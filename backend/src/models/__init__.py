"""
Pydantic models for API requests and responses
"""
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from enum import Enum


class QuestionType(str, Enum):
    """Types of math questions"""
    CALCULATION = "calculation"
    WORD_PROBLEM = "word_problem"
    GEOMETRY = "geometry"
    FRACTION = "fraction"
    DECIMAL = "decimal"
    PERCENTAGE = "percentage"
    EQUATION = "equation"
    COMPARISON = "comparison"


class ErrorCategory(str, Enum):
    """Categories of errors made by students"""
    CALCULATION = "calculation"  # Basic arithmetic errors
    CONCEPTUAL = "conceptual"    # Misunderstanding of concepts
    PROCEDURAL = "procedural"    # Wrong method/steps
    CARELESS = "careless"        # Simple mistakes
    INCOMPLETE = "incomplete"    # Partial answer
    NOTATION = "notation"        # Writing/notation errors
    UNIT = "unit"                # Unit conversion errors


class SubmissionStatus(str, Enum):
    """Status of exam submission"""
    PENDING = "pending"
    PROCESSING = "processing"
    CORRECTED = "corrected"
    REVIEWED = "reviewed"
    ERROR = "error"


# Student Models
class StudentBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    class_name: str = Field(default="6e", description="Class/grade level")
    student_id: Optional[str] = Field(None, description="School student ID")


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    class_name: Optional[str] = None
    student_id: Optional[str] = None


class Student(StudentBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Question Models
class QuestionBase(BaseModel):
    text: str = Field(..., min_length=1, description="The question text")
    question_type: QuestionType = Field(default=QuestionType.CALCULATION)
    correct_answer: str = Field(..., description="The correct answer")
    points: float = Field(default=1.0, ge=0)
    topic: Optional[str] = Field(None, description="Math topic (e.g., fractions, geometry)")
    difficulty: int = Field(default=1, ge=1, le=5)
    solution_steps: Optional[List[str]] = Field(None, description="Step-by-step solution")


class QuestionCreate(QuestionBase):
    pass


class Question(QuestionBase):
    id: str
    order: int
    
    class Config:
        from_attributes = True


# Exam Models
class ExamBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    class_name: str = Field(default="6e")
    subject: str = Field(default="Mathématiques")
    duration_minutes: int = Field(default=60, ge=1)
    total_points: float = Field(default=20.0, ge=0)


class ExamCreate(ExamBase):
    questions: List[QuestionCreate]


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_points: Optional[float] = None


class Exam(ExamBase):
    id: str
    questions: List[Question] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Answer Models
class AnswerBase(BaseModel):
    question_id: str
    student_answer: str
    image_data: Optional[str] = Field(None, description="Base64 encoded image of answer")


class AnswerCreate(AnswerBase):
    pass


class CorrectionDetail(BaseModel):
    is_correct: bool
    points_earned: float
    max_points: float
    feedback: str
    error_category: Optional[ErrorCategory] = None
    error_description: Optional[str] = None
    correct_answer: str
    student_answer: str
    step_by_step_solution: Optional[List[str]] = None
    skills_assessed: List[str] = []


class Answer(AnswerBase):
    id: str
    correction: Optional[CorrectionDetail] = None
    
    class Config:
        from_attributes = True


# Submission Models
class SubmissionCreate(BaseModel):
    exam_id: str
    student_id: str
    answers: List[AnswerCreate]


class SubmissionUpdate(BaseModel):
    status: Optional[SubmissionStatus] = None
    teacher_notes: Optional[str] = None


class SubmissionSummary(BaseModel):
    id: str
    exam_id: str
    student_id: str
    student_name: str
    exam_title: str
    status: SubmissionStatus
    score: Optional[float] = None
    max_score: float
    percentage: Optional[float] = None
    submitted_at: datetime


class Submission(BaseModel):
    id: str
    exam_id: str
    student_id: str
    exam: Optional[Exam] = None
    student: Optional[Student] = None
    answers: List[Answer] = []
    status: SubmissionStatus
    score: Optional[float] = None
    max_score: float
    percentage: Optional[float] = None
    teacher_notes: Optional[str] = None
    submitted_at: datetime
    corrected_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Graph Models
class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # student, exam, question, topic, skill, error_type
    properties: dict = {}


class GraphEdge(BaseModel):
    from_id: str
    to_id: str
    label: str
    properties: dict = {}


class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


# Statistics Models
class TopicPerformance(BaseModel):
    topic: str
    total_questions: int
    correct_answers: int
    average_score: float
    common_errors: List[str] = []


class StudentPerformance(BaseModel):
    student_id: str
    student_name: str
    total_submissions: int
    average_score: float
    strong_topics: List[str] = []
    weak_topics: List[str] = []
    common_error_types: List[str] = []


class ClassStatistics(BaseModel):
    class_name: str
    total_students: int
    total_submissions: int
    average_score: float
    topic_performance: List[TopicPerformance]
    score_distribution: dict  # score range -> count


# File Upload Models
class FileUpload(BaseModel):
    filename: str
    content_type: str
    size: int


class OCRResult(BaseModel):
    text: str
    confidence: float
    regions: List[dict] = []


# API Response Models
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class HealthCheck(BaseModel):
    status: str
    service: str
    version: str
    dependencies: Optional[dict] = None
