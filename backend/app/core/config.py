from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from pathlib import Path

# Find project root directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_ENV = BASE_DIR.parent / ".env"
BACKEND_ENV = BASE_DIR / ".env"

env_file = ROOT_ENV if ROOT_ENV.exists() else BACKEND_ENV

class Settings(BaseSettings):
    PROJECT_NAME: str = "CodeSync AI"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Debug
    APP_ENV: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "codesync-ai-super-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
        
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./codesync.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Real-time Collaboration
    COLLAB_SERVER_URL: str = "ws://localhost:1234"
    
    # AI Assistant
    AI_PROVIDER: str = "gemini"  # gemini, openai, anthropic, mock
    AI_API_KEY: str = ""
    AI_MODEL_NAME: str = "gemini-1.5-pro"
    
    # Execution Engine Sandbox
    DOCKER_CONTAINER_MEMORY_LIMIT: str = "256m"
    DOCKER_CONTAINER_CPU_LIMIT: str = "1.0"
    EXECUTION_TIMEOUT_SECONDS: int = 10

    model_config = SettingsConfigDict(
        env_file=str(env_file) if env_file.exists() else None,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
