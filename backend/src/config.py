import os
import sys
from pathlib import Path
from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def find_env_file() -> Path:
    """
    Find .env file in multiple locations.
    Checks: current dir, backend/, project root (parent of backend/)
    """
    possible_paths = [
        Path(".env"),  # Current working directory
        Path("backend/.env"),  # Backend directory (when running from root)
        Path("../.env"),  # Parent directory (when running from backend/)
        Path(__file__).parent.parent.parent / ".env",  # Project root relative to this file
    ]

    for path in possible_paths:
        if path.exists():
            return path

    # Default to .env in current directory (will fail gracefully if not found)
    return Path(".env")


class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    """

    model_config = SettingsConfigDict(
        env_file=str(find_env_file()),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ===========================================
    # REQUIRED SECRETS (no defaults - must be set)
    # ===========================================

    # OpenAI Configuration
    openai_api_key: str  # Required - no default for secrets!
    openai_model: str = "gpt-4o"
    openai_temperature: float = 0.2
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536  # text-embedding-3-small default dimensions

    # Neo4j Configuration
    neo4j_password: str  # Required - no default for secrets!

    # ===========================================
    # OPTIONAL SECRETS (may be None)
    # ===========================================

    # LangSmith Tracing Configuration
    langsmith_api_key: Optional[str] = None  # Optional - only needed if tracing is enabled

    # Authentication (optional in dev, required in production)
    jwt_secret_key: Optional[str] = None  # Set in production!

    # ===========================================
    # NON-SECRET CONFIGURATION (with safe defaults)
    # ===========================================

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4
    log_level: str = "info"
    debug: bool = True  # Enable debug mode (shows docs)

    # CORS Configuration
    cors_origins: str = "http://localhost:3004,http://localhost:3000"

    # Neo4j Configuration (non-secret parts)
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_database: str = "neo4j"

    # LangSmith Configuration (non-secret parts)
    langsmith_tracing: bool = True
    langsmith_endpoint: str = "https://api.smith.langchain.com"
    langsmith_project: str = "graphrag-exam-evaluation"

    # JWT Configuration (non-secret parts)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Upload Configuration
    max_upload_size_mb: int = 50
    upload_dir: str = "src/uploads"

    # Exam Evaluation Configuration
    grade_level: int = 6
    passing_score: float = 50.0
    max_points_per_question: float = 20.0
    show_step_by_step: bool = True

    # AI Grading Configuration
    strict_grading: bool = False  # If true, partial credit is reduced

    # Monitoring
    enable_metrics: bool = True
    enable_tracing: bool = True

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins into a list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def max_upload_size_bytes(self) -> int:
        """Convert MB to bytes"""
        return self.max_upload_size_mb * 1024 * 1024

    @field_validator("openai_api_key", "neo4j_password", mode="before")
    @classmethod
    def validate_required_secrets(cls, v: str, info) -> str:
        """Ensure required secrets are not placeholder values"""
        placeholder_values = {
            "your-openai-api-key-here",
            "your-langsmith-api-key-here",
            "your-secret-key-here",
        }
        if v and v.lower() in placeholder_values:
            raise ValueError(
                f"Please set a valid value for {info.field_name} in .env file"
            )
        return v


# Global settings instance with validation
def get_settings() -> Settings:
    """Create settings instance with helpful error messages for missing secrets."""
    try:
        return Settings()
    except Exception as e:
        error_msg = str(e)
        if "openai_api_key" in error_msg:
            print(
                "\n❌ ERROR: OPENAI_API_KEY is not configured!\n"
                "   Please set OPENAI_API_KEY in your .env file or environment.\n"
                "   Copy .env.example to .env and add your API key.\n",
                file=sys.stderr,
            )
        elif "neo4j_password" in error_msg:
            print(
                "\n❌ ERROR: NEO4J_PASSWORD is not configured!\n"
                "   Please set NEO4J_PASSWORD in your .env file or environment.\n",
                file=sys.stderr,
            )
        raise


settings = get_settings()
