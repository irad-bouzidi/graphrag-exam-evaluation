from typing import Optional, Dict, Any


class ExamEvaluationException(Exception):
    """Base exception for Exam Evaluation API"""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class Neo4jConnectionError(ExamEvaluationException):
    """Raised when Neo4j connection fails"""
    pass


class DocumentProcessingError(ExamEvaluationException):
    """Raised when document processing fails"""
    pass


class ExamNotFoundError(ExamEvaluationException):
    """Raised when an exam is not found"""
    pass


class StudentNotFoundError(ExamEvaluationException):
    """Raised when a student is not found"""
    pass


class SubmissionNotFoundError(ExamEvaluationException):
    """Raised when a submission is not found"""
    pass


class CorrectionError(ExamEvaluationException):
    """Raised when exam correction fails"""
    pass


class ValidationError(ExamEvaluationException):
    """Raised when validation fails"""
    pass


class AIServiceError(ExamEvaluationException):
    """Raised when AI service (OpenAI) fails"""
    pass


class MathExpressionError(ExamEvaluationException):
    """Raised when mathematical expression parsing/evaluation fails"""
    pass
