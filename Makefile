.PHONY: help install dev test lint format clean docker-up docker-down seed

help:
	@echo "Available commands:"
	@echo "  install       - Install dependencies"
	@echo "  dev           - Run development server"
	@echo "  test          - Run tests"
	@echo "  lint          - Run linter"
	@echo "  format        - Format code"
	@echo "  clean         - Clean cache files"
	@echo "  neo4j-up      - Start Neo4j container"
	@echo "  neo4j-down    - Stop Neo4j container"
	@echo "  api-up        - Build and start API container"
	@echo "  api-down      - Stop API container"
	@echo "  docker-up     - Start all Docker services"
	@echo "  docker-down   - Stop all Docker services"
	@echo "  seed          - Seed database with sample data"

# Backend commands
install:
	cd backend && poetry install
	cd frontend && npm install

dev-backend:
	cd backend && poetry run uvicorn app.main:app --reload --port 8083

dev-frontend:
	cd frontend && npm run dev

dev:
	@echo "Starting both services..."
	@make neo4j-up
	@sleep 5
	@make -j2 dev-backend dev-frontend

test:
	cd backend && poetry run pytest -v

lint:
	cd backend && poetry run ruff check app tests
	cd frontend && npm run lint

format:
	cd backend && poetry run ruff format app tests
	cd frontend && npm run format

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true

# Docker commands - Separate Neo4j and API
neo4j-up:
	docker-compose -f docker-compose.neo4j.yml up -d

neo4j-down:
	docker-compose -f docker-compose.neo4j.yml down

neo4j-logs:
	docker-compose -f docker-compose.neo4j.yml logs -f

api-build:
	docker-compose -f docker-compose.api.yml build --no-cache api

api-up:
	docker-compose -f docker-compose.api.yml up -d

api-down:
	docker-compose -f docker-compose.api.yml down

api-logs:
	docker-compose -f docker-compose.api.yml logs -f

api-rebuild:
	docker-compose -f docker-compose.api.yml build --no-cache api && docker-compose -f docker-compose.api.yml up -d api

# Combined commands
docker-up: neo4j-up
	@echo "Waiting for Neo4j to be healthy..."
	@sleep 10
	@make api-up

docker-down: api-down neo4j-down

docker-logs:
	docker-compose -f docker-compose.neo4j.yml -f docker-compose.api.yml logs -f

seed:
	cd backend && poetry run python -m scripts.seed_data

# Build commands
build-backend:
	cd backend && docker build -t exam-evaluation-api .

build-frontend:
	cd frontend && docker build -t exam-evaluation-frontend .

build: build-backend build-frontend
