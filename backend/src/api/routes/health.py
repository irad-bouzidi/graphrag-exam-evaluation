"""
Health check endpoints
"""
from fastapi import APIRouter, Depends
from typing import Dict, Any
import structlog

from src.core.database import Neo4jConnection, get_neo4j

logger = structlog.get_logger()

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check() -> Dict[str, str]:
    """Basic health check"""
    return {"status": "healthy", "service": "exam-evaluation-api"}


@router.get("/ready")
async def readiness_check(
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Readiness check - verifies all dependencies are available
    """
    status = {
        "status": "ready",
        "neo4j": "unknown",
        "version": "1.0.0"
    }
    
    try:
        # Check Neo4j connection
        result = await neo4j.execute_query("RETURN 1 as ping", {})
        status["neo4j"] = "connected" if result else "error"
    except Exception as e:
        logger.error("Neo4j health check failed", error=str(e))
        status["neo4j"] = "error"
        status["status"] = "degraded"
    
    return status


@router.get("/stats")
async def system_stats(
    neo4j: Neo4jConnection = Depends(get_neo4j)
) -> Dict[str, Any]:
    """
    Get system statistics
    """
    try:
        query = """
        OPTIONAL MATCH (e:Exam) WITH count(e) as exams
        OPTIONAL MATCH (s:Student) WITH exams, count(s) as students
        OPTIONAL MATCH (sub:Submission) WITH exams, students, count(sub) as submissions
        OPTIONAL MATCH (c:Correction) WITH exams, students, submissions, count(c) as corrections
        RETURN {
            exams: exams,
            students: students,
            submissions: submissions,
            corrections: corrections
        } as counts
        """
        
        result = await neo4j.execute_query(query, {})
        counts = result[0]["counts"] if result else {}
        
        return {
            "status": "ok",
            "counts": counts
        }
    except Exception as e:
        logger.error("Failed to get stats", error=str(e))
        return {
            "status": "error",
            "error": str(e)
        }
