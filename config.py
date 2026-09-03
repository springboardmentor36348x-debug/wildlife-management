"""
Application configuration settings
"""

import os
from datetime import timedelta
from typing import Optional

class Settings:
    """Application settings"""

    # API Settings
    API_TITLE: str = "Wildlife Population Intelligence System"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "AI-powered wildlife monitoring and conservation platform"

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///wildlife.db"
    )

    # JWT Settings
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "your-secret-key-change-in-production-12345678901234567890"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    JWT_REFRESH_EXPIRATION_DAYS: int = int(os.getenv("JWT_REFRESH_EXPIRATION_DAYS", "7"))

    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # File Upload Settings
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "/uploads")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
    ALLOWED_IMAGE_EXTENSIONS: list = ["jpg", "jpeg", "png", "gif", "webp"]
    ALLOWED_AUDIO_EXTENSIONS: list = ["mp3", "wav", "m4a", "aac", "flac"]

    # ML Models
    IMAGE_MODEL_PATH: str = os.getenv("IMAGE_MODEL_PATH", "/models/yolov8")
    AUDIO_MODEL_PATH: str = os.getenv("AUDIO_MODEL_PATH", "/models/birdnet")

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "wildlife.log")

    # Email (optional)
    SMTP_SERVER: Optional[str] = os.getenv("SMTP_SERVER")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")

    # AI Settings (Phase 10)
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "openai")
    AI_MODEL: str = os.getenv("AI_MODEL", "gpt-4")
    AI_API_KEY: Optional[str] = os.getenv("AI_API_KEY")
    AI_MAX_TOKENS: int = int(os.getenv("AI_MAX_TOKENS", "1000"))

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"

settings = Settings()
