import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "FieldScribe Edge"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Voice-to-Structured Clinical Note Generator for First Responders (Nebius x NVIDIA Global AI Hackathon 2026)"
    
    # Nebius Token Factory Configuration
    NEBIUS_API_KEY: str = Field(default="", env="NEBIUS_API_KEY")
    NEBIUS_BASE_URL: str = Field(default="https://api.studio.nebius.ai/v1", env="NEBIUS_BASE_URL")
    NEBIUS_MODEL: str = Field(default="nvidia/Llama-3.1-Nemotron-70B-Instruct-HF", env="NEBIUS_MODEL")
    
    # Host & Port
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

