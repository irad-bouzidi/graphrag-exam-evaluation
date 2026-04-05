"""
Submission and Correction API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import structlog

from src.core.database import Neo4jConnection, get_neo4j
from src.core.exceptions import (
    ExamNotFoundError,
    StudentNotFoundError,
    SubmissionNotFoundError,
    CorrectionError
)
from src.services.exam_service import ExamService
from src.services.math_correction_service import MathCorrectionService
from src.services.document_processor import DocumentProcessor

logger = structlog.get_logger()

router = APIRouter(prefix="/submissions", tags=["Submissions"])


# ==================== REQUEST/RESPONSE MODELS ====================

class AnswerCreate(BaseModel):
    """Model for creating an answer"""
    question_id: str = Field(..., description="Question ID")
    answer: str = Field(..., description="Student's answer")


class SubmissionCreate(BaseModel):
    """Model for creating a submission"""
    exam_id: str = Field(..., description="Exam ID")
    student_id: str = Field(..., description="Student ID")
    answers: List[AnswerCreate] = Field(default=[], description="List of answers")


class SubmissionListResponse(BaseModel):
    """Response model for submission list"""
    submissions: List[Dict[str, Any]]
    total: int


# ==================== ENDPOINTS ====================

@router.post("", response_model=Dict[str, Any])
async def create_submission(
    submission: SubmissionCreate,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Create a new exam submission
    """
    try:
        service = ExamService(neo4j)
        result = await service.create_submission(
            exam_id=submission.exam_id,
            student_id=submission.student_id,
            answers=[a.model_dump() for a in submission.answers]
        )
        return {"success": True, "submission": result}
    except ExamNotFoundError:
        raise HTTPException(status_code=404, detail="Exam not found")
    except StudentNotFoundError:
        raise HTTPException(status_code=404, detail="Student not found")
    except Exception as e:
        logger.error("Failed to create submission", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload", response_model=Dict[str, Any])
async def upload_submission(
    file: UploadFile = File(...),
    exam_id: str = Form(...),
    student_id: str = Form(...),
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Upload a submission from scanned PDF/image
    """
    try:
        # Read file content
        content = await file.read()
        
        # Process document to extract text
        processor = DocumentProcessor()
        extraction = await processor.process_document(content, file.filename)
        
        if not extraction.get("success"):
            raise HTTPException(
                status_code=400,
                detail=extraction.get("error", "Failed to process document")
            )
        
        # Create submission with raw text
        service = ExamService(neo4j)
        result = await service.create_submission(
            exam_id=exam_id,
            student_id=student_id,
            raw_text=extraction.get("text", "")
        )
        
        return {
            "success": True,
            "submission": result,
            "extracted_text": extraction.get("text", ""),
            "message": "Submission uploaded. Use /extract-answers to parse answers."
        }
    except ExamNotFoundError:
        raise HTTPException(status_code=404, detail="Exam not found")
    except StudentNotFoundError:
        raise HTTPException(status_code=404, detail="Student not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to upload submission", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=SubmissionListResponse)
async def list_submissions(
    exam_id: Optional[str] = None,
    student_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> SubmissionListResponse:
    """
    List all submissions with optional filters
    """
    try:
        service = ExamService(neo4j)
        result = await service.list_submissions(
            exam_id=exam_id,
            student_id=student_id,
            status=status,
            skip=skip,
            limit=limit
        )
        return SubmissionListResponse(**result)
    except Exception as e:
        logger.error("Failed to list submissions", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{submission_id}", response_model=Dict[str, Any])
async def get_submission(
    submission_id: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get submission details by ID
    """
    try:
        service = ExamService(neo4j)
        submission = await service.get_submission(submission_id)
        return {"success": True, "submission": submission}
    except SubmissionNotFoundError:
        raise HTTPException(status_code=404, detail="Submission not found")
    except Exception as e:
        logger.error("Failed to get submission", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{submission_id}/correct")
async def correct_submission(
    submission_id: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Correct a submission using AI
    """
    try:
        correction_service = MathCorrectionService(neo4j)
        result = await correction_service.correct_submission(submission_id)
        
        return {
            "success": True,
            "correction": result
        }
    except SubmissionNotFoundError:
        raise HTTPException(status_code=404, detail="Submission not found")
    except CorrectionError as e:
        logger.error("Correction failed", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Failed to correct submission", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{submission_id}/extract-answers")
async def extract_answers(
    submission_id: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Extract answers from raw submission text using AI
    """
    try:
        exam_service = ExamService(neo4j)
        submission = await exam_service.get_submission(submission_id)
        
        raw_text = submission.get("raw_text", "")
        if not raw_text:
            raise HTTPException(
                status_code=400,
                detail="No raw text found in submission"
            )
        
        correction_service = MathCorrectionService(neo4j)
        answers = await correction_service.extract_answers_from_text(raw_text)
        
        return {
            "success": True,
            "submission_id": submission_id,
            "answers": answers
        }
    except SubmissionNotFoundError:
        raise HTTPException(status_code=404, detail="Submission not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to extract answers", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{submission_id}/correction")
async def get_correction(
    submission_id: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get the correction for a submission
    """
    try:
        query = """
        MATCH (sub:Submission {id: $submission_id})-[:HAS_CORRECTION]->(c:Correction)
        OPTIONAL MATCH (c)-[:INCLUDES]->(qc:QuestionCorrection)-[:CORRECTS]->(q:Question)
        WITH c, qc, q ORDER BY q.number
        RETURN c {
            .*,
            question_corrections: collect(qc {
                .*,
                question: q {.*}
            })
        } as correction
        """
        
        results = await neo4j.execute_query(query, {"submission_id": submission_id})
        
        if not results or not results[0].get("correction"):
            raise HTTPException(status_code=404, detail="Correction not found")
        
        return {"success": True, "correction": results[0]["correction"]}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get correction", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ==================== BATCH OPERATIONS ====================

@router.post("/batch/correct")
async def batch_correct_submissions(
    submission_ids: List[str],
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Correct multiple submissions at once
    """
    try:
        correction_service = MathCorrectionService(neo4j)
        results = []
        errors = []
        
        for submission_id in submission_ids:
            try:
                result = await correction_service.correct_submission(submission_id)
                results.append({
                    "submission_id": submission_id,
                    "success": True,
                    "score": result.get("percentage", 0)
                })
            except Exception as e:
                errors.append({
                    "submission_id": submission_id,
                    "success": False,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "corrected": len(results),
            "failed": len(errors),
            "results": results,
            "errors": errors
        }
    except Exception as e:
        logger.error("Batch correction failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
