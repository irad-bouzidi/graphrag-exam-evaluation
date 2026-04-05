"""
Exam Evaluation API - Main Application
Primary school math exam correction using AI and Graph analysis
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog

from config import settings
from core.database import neo4j_connection
from core.exceptions import (
    ExamNotFoundError,
    StudentNotFoundError,
    SubmissionNotFoundError,
    CorrectionError,
    AIServiceError
)

from src.api.routes import health, exams, students, submissions, graph

# Configure structured logging (following docmana pattern)
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer()
    ]
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("Starting Exam Evaluation API", version="1.0.0")
    
    # Connect to Neo4j
    await neo4j_connection.connect()
    logger.info("Connected to Neo4j")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Exam Evaluation API")
    await neo4j_connection.close()
    logger.info("Disconnected from Neo4j")


# Create FastAPI application
app = FastAPI(
    title="Exam Evaluation API",
    description="""
    AI-powered exam correction system for primary school mathematics.
    
    ## Features
    
    - **Exam Management**: Create, update, and manage math exams
    - **Student Management**: Manage student records and classes
    - **Submission Processing**: Upload and process exam submissions via OCR
    - **AI Correction**: Automated correction using OpenAI GPT
    - **Graph Analysis**: Explore data relationships using Neo4j
    - **Statistics**: Track student and class performance
    
    ## Supported Grade Levels
    
    Currently optimized for Grade 6 (CM2) mathematics including:
    - Numbers and Operations
    - Geometry
    - Measurement
    - Problem Solving
    - Ratios and Proportions
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(",") if settings.cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== EXCEPTION HANDLERS ====================

@app.exception_handler(ExamNotFoundError)
async def exam_not_found_handler(request: Request, exc: ExamNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"success": False, "error": str(exc), "type": "exam_not_found"}
    )


@app.exception_handler(StudentNotFoundError)
async def student_not_found_handler(request: Request, exc: StudentNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"success": False, "error": str(exc), "type": "student_not_found"}
    )


@app.exception_handler(SubmissionNotFoundError)
async def submission_not_found_handler(request: Request, exc: SubmissionNotFoundError):
    return JSONResponse(
        status_code=404,
        content={"success": False, "error": str(exc), "type": "submission_not_found"}
    )


@app.exception_handler(CorrectionError)
async def correction_error_handler(request: Request, exc: CorrectionError):
    return JSONResponse(
        status_code=400,
        content={"success": False, "error": str(exc), "type": "correction_error"}
    )


@app.exception_handler(AIServiceError)
async def ai_service_error_handler(request: Request, exc: AIServiceError):
    return JSONResponse(
        status_code=503,
        content={"success": False, "error": str(exc), "type": "ai_service_error"}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "type": "internal_error"}
    )


# ==================== INCLUDE ROUTERS ====================

app.include_router(health.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(submissions.router, prefix="/api")
app.include_router(graph.router, prefix="/api")


# ==================== ROOT ENDPOINT ====================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Exam Evaluation API",
        "version": "1.0.0",
        "description": "AI-powered exam correction for primary school mathematics",
        "docs": "/docs" if settings.debug else "Disabled in production",
        "health": "/api/health"
    }


@app.get("/api")
async def api_root():
    """API root endpoint"""
    return {
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "exams": "/api/exams",
            "students": "/api/students",
            "submissions": "/api/submissions",
            "graph": "/api/graph"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.api_port,
        reload=settings.debug
    )
