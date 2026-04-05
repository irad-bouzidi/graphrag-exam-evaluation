"""
Math Correction Service for 6th Grade Primary School
Handles AI-powered evaluation of mathematical problems
"""
from typing import Dict, Any, List, Optional, Tuple
import json
import re
import structlog
from openai import AsyncOpenAI
import sympy
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication

from src.config import settings
from src.core.exceptions import CorrectionError, MathExpressionError, AIServiceError

logger = structlog.get_logger()


# 6th Grade Math Topics and Skills
GRADE_6_TOPICS = {
    "numbers_operations": {
        "name": "Numbers and Operations",
        "skills": [
            "addition", "subtraction", "multiplication", "division",
            "decimals", "fractions", "percentages", "order_of_operations"
        ]
    },
    "geometry": {
        "name": "Geometry",
        "skills": [
            "perimeter", "area", "volume", "angles",
            "shapes", "symmetry", "coordinates"
        ]
    },
    "measurement": {
        "name": "Measurement",
        "skills": [
            "length", "mass", "capacity", "time",
            "unit_conversion", "temperature"
        ]
    },
    "problem_solving": {
        "name": "Problem Solving",
        "skills": [
            "word_problems", "multi_step", "reasoning",
            "estimation", "patterns"
        ]
    },
    "ratios_proportions": {
        "name": "Ratios and Proportions",
        "skills": [
            "ratios", "proportions", "scale", "rates"
        ]
    }
}

# Common error types in 6th grade math
ERROR_TYPES = {
    "calculation_error": "Calculation Error",
    "conceptual_error": "Conceptual Misunderstanding",
    "procedural_error": "Wrong Procedure",
    "careless_mistake": "Careless Mistake",
    "incomplete_answer": "Incomplete Answer",
    "unit_error": "Unit Error",
    "sign_error": "Sign Error",
    "decimal_error": "Decimal Point Error",
    "fraction_error": "Fraction Error",
    "order_of_operations": "Order of Operations Error"
}


class MathCorrectionService:
    """Service for correcting 6th grade math exams using AI"""
    
    def __init__(self, neo4j_connection):
        self.neo4j = neo4j_connection
        self.client = AsyncOpenAI(
            api_key=settings.openai_api_key
        )
        self.model = settings.openai_model
        self.temperature = settings.openai_temperature
        self.embedding_model = settings.openai_embedding_model
    
    async def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text using OpenAI text-embedding-3-small
        
        Args:
            text: Text to generate embedding for
            
        Returns:
            List of floats representing the embedding vector
        """
        try:
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error("Failed to generate embedding", error=str(e))
            raise AIServiceError(f"Embedding generation failed: {str(e)}")
        
    async def correct_submission(
        self,
        submission_id: str,
        student_answers: List[Dict[str, Any]],
        questions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Correct a complete exam submission
        
        Args:
            submission_id: Unique submission identifier
            student_answers: List of student's answers
            questions: List of exam questions with correct answers
            
        Returns:
            Complete correction with scores and feedback
        """
        logger.info("Starting exam correction", submission_id=submission_id)
        
        corrections = []
        total_points = 0
        earned_points = 0
        errors_by_type = {}
        skills_assessed = {}
        
        for question in questions:
            q_id = question["id"]
            student_answer = next(
                (a for a in student_answers if a.get("question_id") == q_id),
                None
            )
            
            if student_answer:
                correction = await self.correct_question(
                    question=question,
                    student_answer=student_answer.get("answer", ""),
                    show_steps=settings.show_step_by_step
                )
            else:
                correction = {
                    "question_id": q_id,
                    "score": 0,
                    "max_score": question.get("points", 1),
                    "is_correct": False,
                    "feedback": "No answer provided",
                    "error_types": ["incomplete_answer"],
                    "step_by_step": None
                }
            
            corrections.append(correction)
            total_points += correction["max_score"]
            earned_points += correction["score"]
            
            # Track errors
            for error in correction.get("error_types", []):
                errors_by_type[error] = errors_by_type.get(error, 0) + 1
            
            # Track skills
            for skill in question.get("skills", []):
                if skill not in skills_assessed:
                    skills_assessed[skill] = {"correct": 0, "total": 0}
                skills_assessed[skill]["total"] += 1
                if correction["is_correct"]:
                    skills_assessed[skill]["correct"] += 1
        
        # Calculate percentage
        percentage = (earned_points / total_points * 100) if total_points > 0 else 0
        passed = percentage >= settings.passing_score
        
        # Generate overall feedback
        overall_feedback = await self._generate_overall_feedback(
            percentage=percentage,
            errors_by_type=errors_by_type,
            skills_assessed=skills_assessed
        )
        
        result = {
            "submission_id": submission_id,
            "total_score": earned_points,
            "max_score": total_points,
            "percentage": round(percentage, 2),
            "passed": passed,
            "corrections": corrections,
            "errors_summary": errors_by_type,
            "skills_summary": skills_assessed,
            "overall_feedback": overall_feedback,
            "grade_level": 6,
            "subject": "mathematics"
        }
        
        # Store in Neo4j
        await self._store_correction_results(result)
        
        logger.info(
            "Exam correction completed",
            submission_id=submission_id,
            score=percentage
        )
        
        return result
    
    async def correct_question(
        self,
        question: Dict[str, Any],
        student_answer: str,
        show_steps: bool = True
    ) -> Dict[str, Any]:
        """
        Correct a single math question
        
        Args:
            question: Question data including correct answer
            student_answer: Student's answer
            show_steps: Whether to generate step-by-step solution
            
        Returns:
            Correction result with score and feedback
        """
        question_type = question.get("type", "calculation")
        q_id = question.get("id")
        max_score = question.get("points", 1)
        correct_answer = question.get("correct_answer")
        
        try:
            # First, try exact mathematical comparison
            is_numerically_correct = await self._compare_math_answers(
                student_answer, correct_answer
            )
            
            if is_numerically_correct:
                return {
                    "question_id": q_id,
                    "score": max_score,
                    "max_score": max_score,
                    "is_correct": True,
                    "feedback": "Correct! Well done.",
                    "error_types": [],
                    "student_answer": student_answer,
                    "correct_answer": correct_answer,
                    "step_by_step": None
                }
            
            # Use AI for detailed analysis
            ai_correction = await self._ai_correct_question(
                question=question,
                student_answer=student_answer,
                correct_answer=correct_answer,
                show_steps=show_steps
            )
            
            return {
                "question_id": q_id,
                "score": ai_correction.get("partial_score", 0),
                "max_score": max_score,
                "is_correct": ai_correction.get("is_correct", False),
                "feedback": ai_correction.get("feedback", ""),
                "error_types": ai_correction.get("error_types", []),
                "student_answer": student_answer,
                "correct_answer": correct_answer,
                "step_by_step": ai_correction.get("step_by_step") if show_steps else None
            }
            
        except Exception as e:
            logger.error(f"Error correcting question {q_id}: {str(e)}")
            raise CorrectionError(
                f"Failed to correct question: {str(e)}",
                details={"question_id": q_id}
            )
    
    async def _compare_math_answers(
        self,
        student_answer: str,
        correct_answer: str
    ) -> bool:
        """
        Compare two mathematical answers for equivalence
        """
        try:
            # Clean the answers
            student_clean = self._clean_math_expression(student_answer)
            correct_clean = self._clean_math_expression(correct_answer)
            
            # Direct string comparison first
            if student_clean == correct_clean:
                return True
            
            # Try numeric comparison
            try:
                student_num = float(eval(student_clean.replace(',', '.')))
                correct_num = float(eval(correct_clean.replace(',', '.')))
                # Allow small floating point differences
                return abs(student_num - correct_num) < 0.0001
            except:
                pass
            
            # Try sympy for algebraic equivalence
            try:
                transformations = standard_transformations + (implicit_multiplication,)
                student_expr = parse_expr(student_clean, transformations=transformations)
                correct_expr = parse_expr(correct_clean, transformations=transformations)
                return sympy.simplify(student_expr - correct_expr) == 0
            except:
                pass
            
            return False
            
        except Exception as e:
            logger.debug(f"Math comparison failed: {str(e)}")
            return False
    
    def _clean_math_expression(self, expr: str) -> str:
        """Clean a mathematical expression for comparison"""
        if not expr:
            return ""
        
        # Remove whitespace
        expr = expr.strip()
        
        # Normalize fractions (1/2 style)
        expr = re.sub(r'\s*/\s*', '/', expr)
        
        # Replace common math symbols
        replacements = {
            '×': '*',
            '÷': '/',
            '−': '-',
            '–': '-',
            '²': '**2',
            '³': '**3',
            'π': 'pi',
            ',': '.',  # European decimal
        }
        
        for old, new in replacements.items():
            expr = expr.replace(old, new)
        
        # Remove units (cm, m, kg, etc.)
        expr = re.sub(r'\s*(cm|m|km|mm|g|kg|l|ml|s|min|h|°|€|\$)$', '', expr, flags=re.IGNORECASE)
        
        return expr.strip()
    
    async def _ai_correct_question(
        self,
        question: Dict[str, Any],
        student_answer: str,
        correct_answer: str,
        show_steps: bool
    ) -> Dict[str, Any]:
        """
        Use AI to analyze and correct a math question
        """
        question_text = question.get("text", "")
        question_type = question.get("type", "calculation")
        max_score = question.get("points", 1)
        
        system_prompt = """You are an expert primary school math teacher correcting 6th grade (CM2) exams.
Your task is to evaluate student answers fairly but accurately.

Guidelines:
1. Check if the mathematical logic is correct
2. Identify specific error types if the answer is wrong
3. Give partial credit when appropriate (showing understanding but making calculation errors)
4. Provide encouraging but educational feedback
5. For word problems, check if the student understood the problem correctly

Error types to identify:
- calculation_error: Wrong arithmetic
- conceptual_error: Doesn't understand the concept
- procedural_error: Wrong method/approach
- careless_mistake: Small slip, understands concept
- incomplete_answer: Missing parts
- unit_error: Wrong or missing units
- sign_error: Wrong positive/negative
- decimal_error: Decimal point misplaced
- fraction_error: Fraction calculation error
- order_of_operations: PEMDAS/BODMAS error

Respond in JSON format."""

        user_prompt = f"""Correct this 6th grade math question:

Question: {question_text}
Question Type: {question_type}
Maximum Points: {max_score}

Correct Answer: {correct_answer}
Student's Answer: {student_answer}

Provide your evaluation in this JSON format:
{{
    "is_correct": true/false,
    "partial_score": number (0 to {max_score}),
    "error_types": ["error_type1", "error_type2"],
    "feedback": "Encouraging feedback for the student",
    "step_by_step": {'"Step-by-step solution explanation"' if show_steps else 'null'}
}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.error(f"AI correction failed: {str(e)}")
            raise AIServiceError(f"AI correction service failed: {str(e)}")
    
    async def _generate_overall_feedback(
        self,
        percentage: float,
        errors_by_type: Dict[str, int],
        skills_assessed: Dict[str, Dict[str, int]]
    ) -> str:
        """Generate overall feedback for the student"""
        
        system_prompt = """You are a kind and encouraging primary school math teacher.
Generate brief, positive feedback for a 6th grade student based on their exam results.
Focus on:
1. Celebrating what they did well
2. Identifying areas for improvement
3. Giving specific advice for practice
Keep it under 150 words and appropriate for an 11-12 year old."""

        user_prompt = f"""Generate feedback for this exam result:

Score: {percentage:.1f}%
Passed: {"Yes" if percentage >= 50 else "No"}

Error types found:
{json.dumps(errors_by_type, indent=2)}

Skills assessed:
{json.dumps(skills_assessed, indent=2)}

Provide encouraging but helpful feedback."""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=200
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Feedback generation failed: {str(e)}")
            # Return generic feedback
            if percentage >= 80:
                return "Excellent work! Keep up the great effort!"
            elif percentage >= 60:
                return "Good job! With a bit more practice, you'll do even better!"
            elif percentage >= 50:
                return "You passed! Focus on the areas where you made mistakes and keep practicing."
            else:
                return "Keep practicing! Review the corrections and try again. You can do this!"
    
    async def _store_correction_results(self, result: Dict[str, Any]) -> None:
        """Store correction results in Neo4j"""
        query = """
        MATCH (sub:Submission {id: $submission_id})
        CREATE (c:Correction {
            id: randomUUID(),
            submission_id: $submission_id,
            total_score: $total_score,
            max_score: $max_score,
            percentage: $percentage,
            passed: $passed,
            overall_feedback: $overall_feedback,
            corrected_at: datetime()
        })
        CREATE (sub)-[:HAS_CORRECTION]->(c)
        
        WITH c
        UNWIND $corrections as corr
        MATCH (q:Question {id: corr.question_id})
        CREATE (qc:QuestionCorrection {
            id: randomUUID(),
            question_id: corr.question_id,
            score: corr.score,
            max_score: corr.max_score,
            is_correct: corr.is_correct,
            feedback: corr.feedback,
            student_answer: corr.student_answer,
            correct_answer: corr.correct_answer
        })
        CREATE (c)-[:INCLUDES]->(qc)
        CREATE (qc)-[:CORRECTS]->(q)
        
        WITH qc, corr
        UNWIND corr.error_types as error_type
        MERGE (et:ErrorType {name: error_type})
        CREATE (qc)-[:HAS_ERROR]->(et)
        
        RETURN count(qc) as corrections_stored
        """
        
        try:
            await self.neo4j.execute_write(query, {
                "submission_id": result["submission_id"],
                "total_score": result["total_score"],
                "max_score": result["max_score"],
                "percentage": result["percentage"],
                "passed": result["passed"],
                "overall_feedback": result["overall_feedback"],
                "corrections": result["corrections"]
            })
        except Exception as e:
            logger.error(f"Failed to store correction results: {str(e)}")
            # Don't raise - correction was successful, storage is secondary
    
    async def extract_questions_from_text(self, exam_text: str) -> List[Dict[str, Any]]:
        """
        Use AI to extract questions from exam text
        """
        system_prompt = """You are an expert at parsing primary school math exams.
Extract all questions from the exam text and identify:
1. The question number
2. The question text
3. The question type (calculation, word_problem, geometry, fraction, etc.)
4. The points value if specified
5. Any diagrams or figures mentioned

Return as JSON array."""

        user_prompt = f"""Extract all questions from this 6th grade math exam:

{exam_text}

Return JSON array:
[
    {{
        "number": 1,
        "text": "question text",
        "type": "calculation|word_problem|geometry|fraction|percentage|etc",
        "points": 1,
        "has_figure": false
    }}
]"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get("questions", result) if isinstance(result, dict) else result
            
        except Exception as e:
            logger.error(f"Question extraction failed: {str(e)}")
            raise AIServiceError(f"Failed to extract questions: {str(e)}")
    
    async def extract_answers_from_text(
        self,
        answer_text: str,
        questions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Use AI to extract student answers from answer sheet text
        """
        questions_summary = "\n".join([
            f"Q{q['number']}: {q['text'][:100]}..."
            for q in questions
        ])
        
        system_prompt = """You are an expert at reading student answer sheets for primary school math exams.
Extract the student's answers, even if handwritten or unclear.
Match each answer to its corresponding question number."""

        user_prompt = f"""The exam has these questions:
{questions_summary}

Student's answer sheet text:
{answer_text}

Extract answers as JSON array:
[
    {{
        "question_number": 1,
        "answer": "student's answer"
    }}
]"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            return result.get("answers", result) if isinstance(result, dict) else result
            
        except Exception as e:
            logger.error(f"Answer extraction failed: {str(e)}")
            raise AIServiceError(f"Failed to extract answers: {str(e)}")
