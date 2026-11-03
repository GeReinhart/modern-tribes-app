from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


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
    POSTGRES_POOL_MIN: int = 2
    POSTGRES_POOL_MAX: int = 10
    POSTGRES_POOL_ACQUIRE_TIMEOUT: float = 10.0  # seconds to wait for a free connection
    POSTGRES_POOL_IDLE_LIFETIME: float = 60.0  # seconds before an idle connection is closed
    POSTGRES_COMMAND_TIMEOUT: float = 30.0  # seconds before a query is aborted

    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_IMAGE_EXTENSIONS: str = "jpg,jpeg,png,gif,webp"
    ALLOWED_FILE_EXTENSIONS: str = "pdf,txt"

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
    # Sliding window: every refresh pushes the expiry again, so a device in regular use stays signed in.
    REFRESH_TOKEN_EXPIRE_DAYS: int = 365
    # A just-rotated refresh token stays usable this long, so two tabs refreshing at once both succeed.
    REFRESH_TOKEN_GRACE_SECONDS: int = 120
    MAGIC_LINK_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Email
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "no-reply@modern-tribes.com"
    EMAILS_FROM_NAME: str = "no-reply-modern-tribes"
    MAILPACE_API_TOKEN: str = ""

    # Online translation (DeepL API Free) -- optional fallback of the language feature's local
    # dictionary. Leave the key empty to disable it.
    DEEPL_API_KEY: str = ""
    DEEPL_API_URL: str = "https://api-free.deepl.com/v2/translate"
    DEEPL_TIMEOUT_SECONDS: float = 8.0

    # Mail scheduler
    MAIL_CRON_INTERVAL_SECONDS: int = 5

    # Event reminder scheduler
    EVENT_REMINDER_CRON_INTERVAL_SECONDS: int = 60

    # Notification archival
    NOTIFICATION_RETENTION_DAYS: int = 30
    NOTIFICATION_ARCHIVAL_CRON_INTERVAL_SECONDS: int = 86400

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Base URL
    BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"

    # VAPID keys for Web Push (generate with: python -m pywebpush --vapid-info)
    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""
    VAPID_SUBJECT: str = "mailto:admin@modern-tribes.com"

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

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")


settings = Settings()
