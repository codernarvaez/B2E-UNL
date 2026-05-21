from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Monorepo root: apps/api/app/core/config.py → parents[4]
_REPO_ROOT = Path(__file__).resolve().parents[4]
_ENV_FILE = _REPO_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(_ENV_FILE, ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg://postgres:postgres@127.0.0.1:54322/postgres"
    supabase_url: str = "http://127.0.0.1:54321"
    supabase_jwt_secret: str = "super-secret-jwt-token-with-at-least-32-characters-long"
    supabase_anon_key: str = ""
    api_host: str = "127.0.0.1"  # En Docker/producción: API_HOST=0.0.0.0 vía .env
    api_port: int = 8000
    cors_origins: str = "http://localhost:4321,http://127.0.0.1:4321"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
