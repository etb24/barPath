from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        protected_namespaces=("settings_",),
    )

    firebase_credentials: str = Field(..., alias="FIREBASE_CREDENTIALS")
    firebase_storage_bucket: str = Field(..., alias="FIREBASE_STORAGE_BUCKET")
    model_path: str = Field(..., alias="MODEL_PATH")
    allowed_origins: List[str] = Field(..., alias="ALLOWED_ORIGINS")

    confidence_threshold: float = Field(0.5, alias="CONFIDENCE_THRESHOLD")
    max_path_length: int = Field(1000, alias="MAX_PATH_LENGTH")


settings = Settings()
