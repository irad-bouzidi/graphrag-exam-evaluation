"""
Exam Extractor Service
Extracts exam structure (questions, answers, metadata) from OCR text using LangChain/LangGraph
"""
from typing import Dict, Any, List, Optional
import json
import re
import traceback
import os
import structlog

# Configure LangSmith tracing before importing LangChain
os.environ.setdefault("LANGCHAIN_TRACING_V2", os.environ.get("LANGSMITH_TRACING", "true"))
os.environ.setdefault("LANGCHAIN_ENDPOINT", os.environ.get("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com"))
os.environ.setdefault("LANGCHAIN_API_KEY", os.environ.get("LANGSMITH_API_KEY", ""))
os.environ.setdefault("LANGCHAIN_PROJECT", os.environ.get("LANGSMITH_PROJECT", "graphrag-exam-evaluation"))

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from src.config import settings
from src.core.exceptions import AIServiceError

logger = structlog.get_logger()


EXAM_EXTRACTION_PROMPT = """You are an expert at analyzing primary school mathematics exam papers.
Given the OCR text from an exam document, extract the exam structure.

Your task:
1. Identify all questions in the exam
2. For each question, extract:
   - The question number
   - The full question text
   - The question type (calculation, word_problem, fill_blank, true_false, multiple_choice, geometry, measurement)
   - The correct answer if visible (may be on answer key)
   - Points/marks for the question (default to 1 if not specified)
   - Mathematical skills being tested (addition, subtraction, multiplication, division, fractions, decimals, percentages, geometry, measurement, problem_solving, etc.)
   - Topic category (numbers_operations, geometry, measurement, problem_solving, ratios_proportions)

3. Extract exam metadata:
   - Title of the exam (if visible)
   - Grade level (default: 6)
   - Duration/time limit (if visible)
   - Total points

Return a JSON object with this exact structure:
{{
    "title": "Exam title or 'Math Exam' if not found",
    "grade_level": 6,
    "duration_minutes": 60,
    "questions": [
        {{
            "number": 1,
            "text": "Full question text",
            "type": "calculation",
            "correct_answer": "Answer if visible, otherwise empty string",
            "points": 1,
            "skills": ["skill1", "skill2"],
            "topic": "numbers_operations"
        }}
    ]
}}

Important:
- Be thorough and capture ALL questions
- Clean up OCR artifacts in the question text
- If a question has multiple parts (a, b, c), treat each part as a separate question
- If correct answers are not visible, leave correct_answer as empty string
- Estimate points based on question complexity if not specified

OCR TEXT:
{ocr_text}

Return ONLY the JSON object, no additional text or markdown."""


ANSWER_EXTRACTION_PROMPT = """You are an expert at analyzing primary school mathematics answer sheets.
Given the OCR text from an exam answer key or correction guide, extract the correct answers.

Your task:
1. Match each answer to its question number
2. Extract the correct answer for each question
3. Include any grading rubric or partial credit information

Return a JSON object:
{{
    "answers": [
        {{
            "question_number": 1,
            "correct_answer": "The correct answer",
            "points": 2,
            "grading_notes": "Any grading criteria or partial credit info"
        }}
    ]
}}

OCR TEXT:
{ocr_text}

Return ONLY the JSON object, no additional text or markdown."""


def get_llm(model: Optional[str] = None, timeout: int = 300) -> ChatOpenAI:
    """
    Get a LangChain ChatOpenAI instance configured for the specified model.
    Handles reasoning models (gpt-5-nano, o1, o3) which don't support temperature.
    
    Args:
        model: Model name to use
        timeout: Request timeout in seconds (default 300s for reasoning models)
    """
    api_key = settings.openai_api_key or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set")
    
    model_name = model or settings.openai_model or os.environ.get("OPENAI_MODEL") or "gpt-4o-mini"
    
    # Reasoning models don't support temperature and use max_completion_tokens instead of max_tokens
    reasoning_models = ["gpt-5-nano", "o1", "o1-mini", "o1-preview", "o3", "o3-mini"]
    is_reasoning_model = any(rm in model_name.lower() for rm in reasoning_models)
    
    logger.info("Initializing LLM", model=model_name, is_reasoning_model=is_reasoning_model)
    
    if is_reasoning_model:
        # Reasoning models: must use default temperature=1 and max_completion_tokens
        return ChatOpenAI(
            model=model_name,
            openai_api_key=api_key,
            temperature=1,
            request_timeout=timeout,
            model_kwargs={"max_completion_tokens": 16000},
        )
    else:
        # Standard models: use temperature and max_tokens
        return ChatOpenAI(
            model=model_name,
            openai_api_key=api_key,
            temperature=0.1,
            max_tokens=4000,
            request_timeout=120,
        )


class ExamExtractorService:
    """Service for extracting exam structure from OCR text using LangChain"""
    
    def __init__(self, neo4j_connection=None):
        self.neo4j = neo4j_connection
        self.model_name = settings.openai_model
        self.llm = get_llm(self.model_name)
    
    async def extract_exam_from_text(
        self,
        ocr_text: str,
        title_hint: Optional[str] = None,
        grade_level: int = 6
    ) -> Dict[str, Any]:
        """
        Extract exam structure from OCR text using LangChain LLM
        
        Args:
            ocr_text: Raw text from OCR processing
            title_hint: Optional title hint from user
            grade_level: Expected grade level
            
        Returns:
            Structured exam data
        """
        logger.info("Extracting exam structure from OCR text", text_length=len(ocr_text))
        
        result_text = None
        try:
            # Clean the OCR text first
            cleaned_text = self._clean_ocr_text(ocr_text)
            
            logger.info("Calling LLM via LangChain", model=self.model_name)
            
            # Build messages for LangChain
            messages = [
                SystemMessage(content="You are an expert at analyzing exam documents. Always respond with valid JSON only. Do not include any markdown formatting."),
                HumanMessage(content=EXAM_EXTRACTION_PROMPT.format(ocr_text=cleaned_text))
            ]
            
            # Call LLM via LangChain (use ainvoke for async)
            response = await self.llm.ainvoke(messages)
            
            logger.info("LLM response received")
            
            result_text = response.content
            logger.info("LLM response content", response_preview=result_text[:200] if result_text else "None")
            
            # Try to extract JSON if wrapped in markdown code blocks
            if result_text:
                # Remove markdown code blocks if present
                if "```json" in result_text:
                    result_text = result_text.split("```json")[1].split("```")[0].strip()
                elif "```" in result_text:
                    result_text = result_text.split("```")[1].split("```")[0].strip()
                result_text = result_text.strip()
            
            exam_data = json.loads(result_text)
            
            # Apply hints and defaults
            if title_hint and title_hint.strip():
                exam_data["title"] = title_hint
            
            exam_data["grade_level"] = grade_level
            
            # Calculate total points
            total_points = sum(q.get("points", 1) for q in exam_data.get("questions", []))
            exam_data["total_points"] = total_points
            
            # Validate and clean question data
            exam_data["questions"] = self._validate_questions(exam_data.get("questions", []))
            
            logger.info(
                "Exam extraction complete",
                title=exam_data.get("title"),
                num_questions=len(exam_data.get("questions", []))
            )
            
            return {
                "success": True,
                "exam": exam_data
            }
            
        except json.JSONDecodeError as e:
            logger.error("Failed to parse LLM response as JSON", error=str(e), raw_response=result_text[:500] if result_text else "None")
            raise AIServiceError(f"Failed to parse exam structure: {str(e)}")
        except Exception as e:
            tb = traceback.format_exc()
            logger.error("Exam extraction failed", error=str(e), error_type=type(e).__name__, traceback=tb)
            raise AIServiceError(f"Failed to extract exam: {str(e)}")
    
    async def extract_answers_from_text(
        self,
        ocr_text: str
    ) -> Dict[str, Any]:
        """
        Extract answers from an answer key document using LangChain
        
        Args:
            ocr_text: Raw text from OCR processing of answer key
            
        Returns:
            Structured answer data
        """
        logger.info("Extracting answers from OCR text")
        
        result_text = None
        try:
            cleaned_text = self._clean_ocr_text(ocr_text)
            
            messages = [
                SystemMessage(content="You are an expert at analyzing exam answer keys. Always respond with valid JSON only. Do not include any markdown formatting."),
                HumanMessage(content=ANSWER_EXTRACTION_PROMPT.format(ocr_text=cleaned_text))
            ]
            
            response = await self.llm.ainvoke(messages)
            
            result_text = response.content
            
            # Clean markdown if present
            if result_text:
                if "```json" in result_text:
                    result_text = result_text.split("```json")[1].split("```")[0].strip()
                elif "```" in result_text:
                    result_text = result_text.split("```")[1].split("```")[0].strip()
                result_text = result_text.strip()
            
            answer_data = json.loads(result_text)
            
            return {
                "success": True,
                "answers": answer_data.get("answers", [])
            }
            
        except Exception as e:
            logger.error("Answer extraction failed", error=str(e))
            raise AIServiceError(f"Failed to extract answers: {str(e)}")
    
    async def merge_exam_with_answers(
        self,
        exam_data: Dict[str, Any],
        answers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Merge extracted exam with answers from answer key
        
        Args:
            exam_data: Exam structure with questions
            answers: List of answers from answer key
            
        Returns:
            Complete exam with answers
        """
        questions = exam_data.get("questions", [])
        
        # Create answer lookup by question number
        answer_lookup = {a["question_number"]: a for a in answers}
        
        # Merge answers into questions
        for question in questions:
            q_num = question.get("number")
            if q_num in answer_lookup:
                answer = answer_lookup[q_num]
                if not question.get("correct_answer"):
                    question["correct_answer"] = answer.get("correct_answer", "")
                if answer.get("points"):
                    question["points"] = answer["points"]
        
        exam_data["questions"] = questions
        return exam_data
    
    def _clean_ocr_text(self, text: str) -> str:
        """Clean OCR artifacts from text"""
        # Remove multiple spaces
        text = re.sub(r' +', ' ', text)
        # Remove multiple newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        # Fix common OCR mistakes
        text = text.replace('|', 'l')
        # Remove non-printable characters
        text = ''.join(c for c in text if c.isprintable() or c in '\n\t')
        return text.strip()
    
    def _validate_questions(self, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Validate and normalize question data"""
        valid_types = ["calculation", "word_problem", "fill_blank", "true_false", "multiple_choice", "geometry", "measurement"]
        valid_topics = ["numbers_operations", "geometry", "measurement", "problem_solving", "ratios_proportions"]
        
        validated = []
        for i, q in enumerate(questions):
            # Ensure required fields
            validated_q = {
                "number": q.get("number", i + 1),
                "text": q.get("text", "").strip(),
                "type": q.get("type", "calculation") if q.get("type") in valid_types else "calculation",
                "correct_answer": str(q.get("correct_answer", "")).strip(),
                "points": max(1, int(q.get("points", 1))),
                "skills": q.get("skills", ["calculation"]) if isinstance(q.get("skills"), list) else ["calculation"],
                "topic": q.get("topic", "numbers_operations") if q.get("topic") in valid_topics else "numbers_operations"
            }
            
            # Only add if there's actual question text
            if validated_q["text"]:
                validated.append(validated_q)
        
        return validated
    
    async def create_exam_from_extraction(
        self,
        exam_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create exam in Neo4j from extracted data
        
        Args:
            exam_data: Extracted and validated exam data
            
        Returns:
            Created exam with ID
        """
        if not self.neo4j:
            raise AIServiceError("Neo4j connection required to create exam")
        
        from src.services.exam_service import ExamService
        
        service = ExamService(self.neo4j)
        
        # Convert questions to the format expected by exam service
        questions = []
        for q in exam_data.get("questions", []):
            questions.append({
                "text": q["text"],
                "type": q["type"],
                "correct_answer": q["correct_answer"],
                "points": q["points"],
                "skills": q["skills"],
                "topic": q["topic"]
            })
        
        # Create the exam
        result = await service.create_exam(
            title=exam_data.get("title", "Uploaded Exam"),
            grade_level=exam_data.get("grade_level", 6),
            subject=exam_data.get("subject", "mathematics"),
            duration_minutes=exam_data.get("duration_minutes", 60),
            questions=questions
        )
        
        return result
