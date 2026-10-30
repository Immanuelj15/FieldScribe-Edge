import os
from typing import List, Literal
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "FieldScribe Edge"
    VERSION: str = "1.1.0"
    DESCRIPTION: str = "Voice-to-Structured Clinical Note Generator for First Responders (Ollama & Nebius with NVIDIA Models)"
    
    # Active AI Provider: "ollama" | "nebius" | "demo"
    AI_PROVIDER: str = Field(default="ollama", env="AI_PROVIDER")

    # Ollama Local Configuration
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434", env="OLLAMA_BASE_URL")
    OLLAMA_MODEL: str = Field(default="nemotron", env="OLLAMA_MODEL")
    OLLAMA_TIMEOUT: float = Field(default=120.0, env="OLLAMA_TIMEOUT")

    # Nebius Token Factory Configuration
    NEBIUS_API_KEY: str = Field(default="", env="NEBIUS_API_KEY")
    NEBIUS_BASE_URL: str = Field(default="https://api.studio.nebius.ai/v1", env="NEBIUS_BASE_URL")
    NEBIUS_MODEL: str = Field(default="nvidia/Llama-3.1-Nemotron-70B-Instruct-HF", env="NEBIUS_MODEL")
    NEBIUS_TIMEOUT: float = Field(default=45.0, env="NEBIUS_TIMEOUT")
    
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
