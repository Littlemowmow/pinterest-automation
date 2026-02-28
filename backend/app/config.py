from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str

    # Google Drive
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: str = "http://localhost:8000/auth/google/callback"

    # Anthropic
    anthropic_api_key: str = ""

    # Pinterest
    pinterest_app_id: Optional[str] = None
    pinterest_app_secret: Optional[str] = None
    pinterest_redirect_uri: str = "http://localhost:8000/auth/pinterest/callback"

    # Frontend
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
