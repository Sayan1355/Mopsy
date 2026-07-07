"""
Signal-Main Backend Configuration

Uses pydantic-settings to load from environment variables / .env file.
No database connection is established in Phase 2.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    app_debug: bool = True
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # Database (placeholder — not connected in Phase 2)
    database_url: str = ""

    # OpenAI (placeholder — not used in Phase 2)
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
