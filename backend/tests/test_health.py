"""
Tests for health endpoints
"""
import pytest


@pytest.mark.asyncio
async def test_health_check(async_client):
    """Test basic health check endpoint"""
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "exam-evaluation-api"


@pytest.mark.asyncio
async def test_health_ready(async_client):
    """Test readiness check endpoint"""
    response = await async_client.get("/api/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "dependencies" in data
