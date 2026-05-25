from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str
    APP_VERSION: str
    DEBUG: bool
    HOST: str
    PORT: int

    # PostgreSQL
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_POOL_MIN: int
    POSTGRES_POOL_MAX: int

    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_IMAGE_EXTENSIONS: str = "jpg,jpeg,png,gif,webp"
    ALLOWED_FILE_EXTENSIONS: str = "pdf,txt"

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    MAGIC_LINK_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Email
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "no-reply@modern-tribes.com"
    EMAILS_FROM_NAME: str = "no-reply-modern-tribes"
    MAILPACE_API_TOKEN: str = ""

    # Mail scheduler
    MAIL_CRON_INTERVAL_SECONDS: int = 60


    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Base URL
    BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"

    # Cellar (S3-compatible object storage — CleverCloud)
    CELLAR_ADDON_HOST: str = "cellar-c2.services.clever-cloud.com"
    CELLAR_ADDON_KEY_ID: str = ""
    CELLAR_ADDON_KEY_SECRET: str = ""
    CELLAR_BUCKET_NAME: str = "uploads"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_image_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_IMAGE_EXTENSIONS.split(",")]

    @property
    def allowed_file_extensions_list(self) -> List[str]:
        return [ext.strip() for ext in self.ALLOWED_FILE_EXTENSIONS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()