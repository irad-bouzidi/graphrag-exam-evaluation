"""
Student management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import structlog

from src.core.database import Neo4jConnection, get_neo4j
from src.core.exceptions import StudentNotFoundError
from src.services.exam_service import ExamService

logger = structlog.get_logger()

router = APIRouter(prefix="/students", tags=["Students"])


# ==================== REQUEST/RESPONSE MODELS ====================

class StudentCreate(BaseModel):
    """Model for creating a student"""
    name: str = Field(..., min_length=1, max_length=100, description="Student name")
    student_number: str = Field(..., min_length=1, max_length=50, description="Student ID number")
    class_name: str = Field(..., min_length=1, max_length=50, description="Class name")
    grade_level: int = Field(default=6, ge=1, le=12, description="Grade level")


class StudentUpdate(BaseModel):
    """Model for updating a student"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    class_name: Optional[str] = Field(None, min_length=1, max_length=50)
    grade_level: Optional[int] = Field(None, ge=1, le=12)


class StudentResponse(BaseModel):
    """Response model for student"""
    id: str
    name: str
    student_number: str
    class_name: str
    grade_level: int


class StudentListResponse(BaseModel):
    """Response model for student list"""
    students: List[Dict[str, Any]]
    total: int


class BulkStudentCreate(BaseModel):
    """Model for bulk creating students"""
    students: List[StudentCreate]


# ==================== ENDPOINTS ====================

@router.post("", response_model=Dict[str, Any])
async def create_student(
    student: StudentCreate,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Create a new student
    """
    try:
        service = ExamService(neo4j)
        result = await service.create_student(
            name=student.name,
            student_number=student.student_number,
            class_name=student.class_name,
            grade_level=student.grade_level
        )
        return {"success": True, "student": result}
    except Exception as e:
        logger.error("Failed to create student", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk", response_model=Dict[str, Any])
async def bulk_create_students(
    data: BulkStudentCreate,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Create multiple students at once
    """
    try:
        service = ExamService(neo4j)
        created = []
        errors = []
        
        for student in data.students:
            try:
                result = await service.create_student(
                    name=student.name,
                    student_number=student.student_number,
                    class_name=student.class_name,
                    grade_level=student.grade_level
                )
                created.append(result)
            except Exception as e:
                errors.append({
                    "student_number": student.student_number,
                    "error": str(e)
                })
        
        return {
            "success": True,
            "created": len(created),
            "errors": errors,
            "students": created
        }
    except Exception as e:
        logger.error("Failed to bulk create students", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=StudentListResponse)
async def list_students(
    class_name: Optional[str] = None,
    grade_level: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> StudentListResponse:
    """
    List all students with optional filters
    """
    try:
        service = ExamService(neo4j)
        result = await service.list_students(
            class_name=class_name,
            grade_level=grade_level,
            skip=skip,
            limit=limit
        )
        return StudentListResponse(**result)
    except Exception as e:
        logger.error("Failed to list students", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{student_id}", response_model=Dict[str, Any])
async def get_student(
    student_id: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get student details by ID
    """
    try:
        service = ExamService(neo4j)
        student = await service.get_student(student_id)
        return {"success": True, "student": student}
    except StudentNotFoundError:
        raise HTTPException(status_code=404, detail="Student not found")
    except Exception as e:
        logger.error("Failed to get student", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{student_id}/statistics")
async def get_student_statistics(
    student_id: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get statistics for a student
    """
    try:
        service = ExamService(neo4j)
        stats = await service.get_student_statistics(student_id)
        return {"success": True, "statistics": stats}
    except StudentNotFoundError:
        raise HTTPException(status_code=404, detail="Student not found")
    except Exception as e:
        logger.error("Failed to get student statistics", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{student_id}/submissions")
async def get_student_submissions(
    student_id: str,
    skip: int = 0,
    limit: int = 20,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get all submissions for a student
    """
    try:
        service = ExamService(neo4j)
        # Verify student exists
        await service.get_student(student_id)
        
        result = await service.list_submissions(
            student_id=student_id,
            skip=skip,
            limit=limit
        )
        return {"success": True, **result}
    except StudentNotFoundError:
        raise HTTPException(status_code=404, detail="Student not found")
    except Exception as e:
        logger.error("Failed to get student submissions", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{student_id}/skills")
async def get_student_skills(
    student_id: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get skill analysis for a student
    """
    try:
        service = ExamService(neo4j)
        analysis = await service.get_skill_analysis(student_id=student_id)
        return {"success": True, **analysis}
    except StudentNotFoundError:
        raise HTTPException(status_code=404, detail="Student not found")
    except Exception as e:
        logger.error("Failed to get student skills", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/class/{class_name}/statistics")
async def get_class_statistics(
    class_name: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get statistics for a class
    """
    try:
        service = ExamService(neo4j)
        stats = await service.get_class_statistics(class_name)
        return {"success": True, "statistics": stats}
    except Exception as e:
        logger.error("Failed to get class statistics", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/class/{class_name}/skills")
async def get_class_skills(
    class_name: str,
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get skill analysis for a class
    """
    try:
        service = ExamService(neo4j)
        analysis = await service.get_skill_analysis(class_name=class_name)
        return {"success": True, **analysis}
    except Exception as e:
        logger.error("Failed to get class skills", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
