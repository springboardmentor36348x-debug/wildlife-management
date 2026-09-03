"""
Application configuration.
Loads settings from environment variables / .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    # Defaults to SQLite for zero-install local development (no Postgres server needed).
    # Switch to a postgresql:// URL in .env once you're ready to move to Postgres.
    DATABASE_URL: str = "sqlite:///./wildlife_intelligence.db"

    # Auth
    SECRET_KEY: str = "dev-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # App
    ENVIRONMENT: str = "development"
    UPLOAD_DIR: str = "uploads"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # AI models
    # Defaults to the stock YOLOv8 COCO checkpoint (auto-downloaded by ultralytics).
    # Once you have a wildlife-finetuned checkpoint (see backend/training/),
    # point this at it, e.g. "app/ml_models/wildlife_yolov8_best.pt" - no code
    # changes needed elsewhere, image_analysis.py reads this setting.
    YOLO_MODEL_PATH: str = "yolov8n.pt"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
