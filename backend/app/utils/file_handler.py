import asyncio
import logging
import uuid
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Tuple

import boto3
import filetype
from botocore.client import BaseClient, Config
from fastapi import HTTPException, UploadFile
from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)


class FileHandler:
    def __init__(self):
        self._s3: BaseClient | None = None

    @property
    def _use_cellar(self) -> bool:
        return bool(settings.CELLAR_ADDON_KEY_ID and settings.CELLAR_ADDON_KEY_SECRET)

    def _client(self) -> BaseClient:
        if self._s3 is None:
            logger.warning(
                "Initializing Cellar client: host=%s bucket=%s key_id=%s",
                settings.CELLAR_ADDON_HOST,
                settings.CELLAR_BUCKET_NAME,
                settings.CELLAR_ADDON_KEY_ID[:6] + "***" if settings.CELLAR_ADDON_KEY_ID else "MISSING",
            )
            self._s3 = boto3.client(
                "s3",
                endpoint_url=f"https://{settings.CELLAR_ADDON_HOST}",
                aws_access_key_id=settings.CELLAR_ADDON_KEY_ID,
                aws_secret_access_key=settings.CELLAR_ADDON_KEY_SECRET,
                config=Config(
                    signature_version="s3v4",
                    request_checksum_calculation="when_required",
                    response_checksum_validation="when_required",
                ),
            )
            try:
                self._s3.put_bucket_acl(
                    Bucket=settings.CELLAR_BUCKET_NAME,
                    ACL="public-read",
                )
                logger.warning("Cellar bucket ACL set to public-read")
            except Exception as e:
                logger.warning("Cellar put_bucket_acl failed (may be already set): %s", e)
        return self._s3

    def _put(self, key: str, content: bytes, content_type: str) -> None:
        logger.warning("Cellar PUT: bucket=%s key=%s content_type=%s size=%d",
                       settings.CELLAR_BUCKET_NAME, key, content_type, len(content))
        try:
            self._client().put_object(
                Bucket=settings.CELLAR_BUCKET_NAME,
                Key=key,
                Body=content,
                ContentType=content_type,
                ContentLength=len(content),
                ACL="public-read",
            )
            logger.warning("Cellar PUT success: key=%s", key)
        except Exception as e:
            logger.exception("Cellar PUT failed: key=%s error=%s", key, e)
            raise

    def _delete(self, key: str) -> None:
        self._client().delete_object(Bucket=settings.CELLAR_BUCKET_NAME, Key=key)

    def _save_local(self, key: str, content: bytes) -> None:
        path = Path(settings.UPLOAD_DIR) / key
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)

    def _delete_local(self, key: str) -> None:
        path = Path(settings.UPLOAD_DIR) / key
        if path.exists():
            path.unlink()

    def generate_unique_filename(self, original_filename: str) -> str:
        ext = Path(original_filename).suffix
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = uuid.uuid4().hex[:8]
        return f"{timestamp}_{unique_id}{ext}"

    def get_file_extension(self, filename: str) -> str:
        return Path(filename).suffix.lstrip(".").lower()

    def validate_file_size(self, size: int) -> bool:
        return size <= settings.MAX_FILE_SIZE

    def validate_image_extension(self, filename: str) -> bool:
        return self.get_file_extension(filename) in settings.allowed_image_extensions_list

    def validate_file_extension(self, filename: str) -> bool:
        allowed = settings.allowed_image_extensions_list + settings.allowed_file_extensions_list
        return self.get_file_extension(filename) in allowed

    def _detect_image_mime(self, content: bytes, filename: str) -> str:
        kind = filetype.guess(content)
        if kind and kind.mime.startswith("image/"):
            return kind.mime
        ext = self.get_file_extension(filename)
        fallback = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
                    "gif": "image/gif", "webp": "image/webp"}
        return fallback.get(ext, "image/jpeg")

    async def save_image(self, file: UploadFile) -> Tuple[str, str]:
        if not self.validate_image_extension(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image format. Allowed: {settings.ALLOWED_IMAGE_EXTENSIONS}",
            )

        content = await file.read()

        if not self.validate_file_size(len(content)):
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / 1024 / 1024}MB",
            )

        try:
            image = Image.open(BytesIO(content))
            image.verify()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file")

        filename = self.generate_unique_filename(file.filename)
        key = f"images/{filename}"
        mime_type = self._detect_image_mime(content, file.filename)

        if self._use_cellar:
            try:
                await asyncio.to_thread(self._put, key, content, mime_type)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to upload image: {e}")
        else:
            await asyncio.to_thread(self._save_local, key, content)

        return filename, key

    async def save_file(self, file: UploadFile) -> Tuple[str, int, str]:
        if not self.validate_file_extension(file.filename):
            raise HTTPException(status_code=400, detail="Invalid file format")

        content = await file.read()

        if not self.validate_file_size(len(content)):
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / 1024 / 1024}MB",
            )

        kind = filetype.guess(content)
        mime_type = kind.mime if kind else "application/octet-stream"

        filename = self.generate_unique_filename(file.filename)
        key = f"files/{filename}"

        if self._use_cellar:
            try:
                await asyncio.to_thread(self._put, key, content, mime_type)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to upload file: {e}")
        else:
            await asyncio.to_thread(self._save_local, key, content)

        return filename, len(content), mime_type

    def get_file_url(self, filename: str, file_type: str = "images") -> str:
        if self._use_cellar:
            return (
                f"https://{settings.CELLAR_BUCKET_NAME}"
                f".{settings.CELLAR_ADDON_HOST}/{file_type}/{filename}"
            )
        return f"{settings.BASE_URL}/uploads/{file_type}/{filename}"

    async def delete_file(self, filename: str, file_type: str = "images") -> bool:
        key = f"{file_type}/{filename}"
        try:
            if self._use_cellar:
                await asyncio.to_thread(self._delete, key)
            else:
                await asyncio.to_thread(self._delete_local, key)
            return True
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False


file_handler = FileHandler()
