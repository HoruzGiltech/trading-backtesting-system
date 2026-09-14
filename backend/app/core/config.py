from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Variables individuales (usadas en desarrollo local)
    postgres_user: Optional[str] = None
    postgres_password: Optional[str] = None
    postgres_db: Optional[str] = None
    postgres_port: Optional[int] = None
    postgres_host: str = "localhost"

    # Railway (y otros proveedores) inyectan esta variable directamente
    database_url_override: Optional[str] = None

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    # CORS: dominios permitidos, separados por coma
    cors_origins: str = "http://localhost:5173"

    @property
    def database_url(self) -> str:
        if self.database_url_override:
            return self.database_url_override
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    class Config:
        env_file = "../.env"

settings = Settings()