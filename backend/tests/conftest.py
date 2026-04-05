"""
Test configuration and fixtures
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest_asyncio.fixture
async def async_client():
    """Create async client for testing"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.fixture
def sample_student():
    """Sample student data"""
    return {
        "first_name": "Test",
        "last_name": "Student",
        "class_name": "6e A",
        "student_id": "TEST001"
    }


@pytest.fixture
def sample_exam():
    """Sample exam data"""
    return {
        "title": "Test Exam",
        "description": "A test examination",
        "class_name": "6e",
        "subject": "Mathématiques",
        "duration_minutes": 30,
        "total_points": 10.0,
        "questions": [
            {
                "text": "Calculate: 5 + 3",
                "question_type": "calculation",
                "correct_answer": "8",
                "points": 2.0,
                "topic": "Addition",
                "difficulty": 1
            },
            {
                "text": "Calculate: 1/2 + 1/4",
                "question_type": "fraction",
                "correct_answer": "3/4",
                "points": 3.0,
                "topic": "Fractions",
                "difficulty": 2
            }
        ]
    }
