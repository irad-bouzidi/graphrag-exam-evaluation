"""
Exam management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import structlog
import os
import uuid
import aiofiles

from src.config import settings
from src.core.database import Neo4jConnection, get_neo4j
from src.core.exceptions import ExamNotFoundError
from src.services.exam_service import ExamService
from src.services.document_processor import DocumentProcessor
from src.services.exam_extractor_service import ExamExtractorService

logger = structlog.get_logger()

router = APIRouter(prefix="/exams", tags=["Exams"])


# ==================== REQUEST/RESPONSE MODELS ====================

class QuestionCreate(BaseModel):
    """Model for creating a question"""
    text: str = Field(..., description="Question text")
    type: str = Field(default="calculation", description="Question type")
    correct_answer: str = Field(..., description="Correct answer")
    points: int = Field(default=1, ge=1, le=20, description="Points for this question")
    skills: List[str] = Field(default=["calculation"], description="Skills tested")
    topic: str = Field(default="numbers_operations", description="Topic category")


class ExamCreate(BaseModel):
    """Model for creating an exam"""
    title: str = Field(..., min_length=1, max_length=200, description="Exam title")
    grade_level: int = Field(default=6, ge=1, le=12, description="Grade level")
    subject: str = Field(default="mathematics", description="Subject")
    duration_minutes: int = Field(default=60, ge=15, le=180, description="Duration in minutes")
    questions: List[QuestionCreate] = Field(default=[], description="List of questions")


class ExamResponse(BaseModel):
    """Response model for exam"""
    id: str
    title: str
    grade_level: int
    subject: str
    duration_minutes: int
    total_points: int
    status: str
    questions: List[Dict[str, Any]] = []


class ExamListResponse(BaseModel):
    """Response model for exam list"""
    exams: List[Dict[str, Any]]
    total: int


# ==================== ENDPOINTS ====================

@router.post("", response_model=Dict[str, Any])
async def create_exam(
    exam: ExamCreate,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Create a new exam with questions
    """
    try:
        service = ExamService(neo4j)
        result = await service.create_exam(
            title=exam.title,
            grade_level=exam.grade_level,
            subject=exam.subject,
            duration_minutes=exam.duration_minutes,
            questions=[q.model_dump() for q in exam.questions]
        )
        return {"success": True, "exam": result}
    except Exception as e:
        logger.error("Failed to create exam", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=ExamListResponse)
async def list_exams(
    grade_level: Optional[int] = None,
    subject: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> ExamListResponse:
    """
    List all exams with optional filters
    """
    try:
        service = ExamService(neo4j)
        result = await service.list_exams(
            grade_level=grade_level,
            subject=subject,
            skip=skip,
            limit=limit
        )
        return ExamListResponse(**result)
    except Exception as e:
        logger.error("Failed to list exams", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{exam_id}", response_model=Dict[str, Any])
async def get_exam(
    exam_id: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get exam details by ID
    """
    try:
        service = ExamService(neo4j)
        exam = await service.get_exam(exam_id)
        return {"success": True, "exam": exam}
    except ExamNotFoundError:
        raise HTTPException(status_code=404, detail="Exam not found")
    except Exception as e:
        logger.error("Failed to get exam", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{exam_id}")
async def delete_exam(
    exam_id: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Delete an exam
    """
    try:
        service = ExamService(neo4j)
        deleted = await service.delete_exam(exam_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Exam not found")
        return {"success": True, "message": "Exam deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete exam", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{exam_id}/statistics")
async def get_exam_statistics(
    exam_id: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get statistics for an exam
    """
    try:
        service = ExamService(neo4j)
        stats = await service.get_exam_statistics(exam_id)
        return {"success": True, "statistics": stats}
    except ExamNotFoundError:
        raise HTTPException(status_code=404, detail="Exam not found")
    except Exception as e:
        logger.error("Failed to get exam statistics", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_exam_document(
    file: UploadFile = File(...),
    title: str = Form(default=""),
    grade_level: int = Form(default=6),
    subject: str = Form(default="mathematics"),
    duration_minutes: int = Form(default=60),
    auto_create: bool = Form(default=True),
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Upload exam document (PDF/image) and extract questions using OCR + LLM
    
    - **file**: PDF or image file (JPEG, PNG, TIFF)
    - **title**: Optional title for the exam
    - **grade_level**: Grade level (1-12, default: 6)
    - **subject**: Subject (default: mathematics)
    - **duration_minutes**: Exam duration in minutes
    - **auto_create**: If true, automatically create the exam in the database
    
    Returns extracted exam structure and optionally creates it in Neo4j
    """
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/tiff"]
    content_type = file.content_type
    
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Allowed: PDF, JPEG, PNG, TIFF"
        )
    
    # Create upload directory if needed
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] or ".pdf"
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    try:
        # Save uploaded file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        logger.info("File uploaded", filename=file.filename, path=file_path, size=len(content))
        
        # Process document with OCR
        processor = DocumentProcessor()
        ocr_text = await processor.process_document(file_path, content_type)
        
        logger.info("OCR completed", text_length=len(ocr_text))
        
        # Extract exam structure using LLM
        extractor = ExamExtractorService(neo4j)
        extraction_result = await extractor.extract_exam_from_text(
            ocr_text=ocr_text,
            title_hint=title,
            grade_level=grade_level
        )
        
        if not extraction_result.get("success"):
            raise HTTPException(
                status_code=400,
                detail="Failed to extract exam structure from document"
            )
        
        exam_data = extraction_result["exam"]
        
        # Apply user-provided metadata
        if title:
            exam_data["title"] = title
        exam_data["grade_level"] = grade_level
        exam_data["subject"] = subject
        exam_data["duration_minutes"] = duration_minutes
        
        # Optionally create in database
        created_exam = None
        if auto_create and exam_data.get("questions"):
            created_exam = await extractor.create_exam_from_extraction(exam_data)
            logger.info("Exam created from upload", exam_id=created_exam.get("id"))
        
        return {
            "success": True,
            "message": "Document processed successfully",
            "extracted_text": ocr_text[:2000] + "..." if len(ocr_text) > 2000 else ocr_text,
            "exam_data": exam_data,
            "created_exam": created_exam,
            "metadata": {
                "filename": file.filename,
                "content_type": content_type,
                "file_size": len(content),
                "questions_found": len(exam_data.get("questions", []))
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to process exam upload", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass


@router.post("/upload-answer-key/{exam_id}")
async def upload_answer_key(
    exam_id: str,
    file: UploadFile = File(...),
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Upload answer key document to update exam with correct answers
    
    - **exam_id**: ID of the exam to update
    - **file**: PDF or image file containing answer key
    """
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/tiff"]
    content_type = file.content_type
    
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}"
        )
    
    # Check exam exists
    service = ExamService(neo4j)
    try:
        exam = await service.get_exam(exam_id)
    except ExamNotFoundError:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Create upload directory if needed
    upload_dir = settings.upload_dir
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] or ".pdf"
    unique_filename = f"answer_key_{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    try:
        # Save uploaded file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Process document with OCR
        processor = DocumentProcessor()
        ocr_text = await processor.process_document(file_path, content_type)
        
        # Extract answers using LLM
        extractor = ExamExtractorService(neo4j)
        answer_result = await extractor.extract_answers_from_text(ocr_text)
        
        if not answer_result.get("success"):
            raise HTTPException(
                status_code=400,
                detail="Failed to extract answers from document"
            )
        
        answers = answer_result.get("answers", [])
        
        # Update exam questions with answers
        updated_count = 0
        for answer in answers:
            q_num = answer.get("question_number")
            correct_answer = answer.get("correct_answer", "")
            
            if q_num and correct_answer:
                # Update question in Neo4j
                query = """
                MATCH (e:Exam {id: $exam_id})-[:HAS_QUESTION]->(q:Question {number: $number})
                SET q.correct_answer = $correct_answer
                RETURN q.id as updated
                """
                result = await neo4j.execute_query(query, {
                    "exam_id": exam_id,
                    "number": q_num,
                    "correct_answer": correct_answer
                })
                if result:
                    updated_count += 1
        
        return {
            "success": True,
            "message": f"Answer key processed, {updated_count} answers updated",
            "answers_extracted": len(answers),
            "answers_applied": updated_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to process answer key", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
