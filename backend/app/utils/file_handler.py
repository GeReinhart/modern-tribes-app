import uuid
import aiofiles
import filetype
from pathlib import Path
from datetime import datetime
from typing import Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image
from io import BytesIO
from ..core.config import settings


class FileHandler:
    def __init__(self):
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.images_dir = self.upload_dir / "images"
        self.files_dir = self.upload_dir / "files"

        # Create directories if they don't exist
        self.images_dir.mkdir(parents=True, exist_ok=True)
        self.files_dir.mkdir(parents=True, exist_ok=True)

    def generate_unique_filename(self, original_filename: str) -> str:
        """Generate unique filename"""
        ext = Path(original_filename).suffix
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = uuid.uuid4().hex[:8]
        return f"{timestamp}_{unique_id}{ext}"

    def get_file_extension(self, filename: str) -> str:
        """Get file extension without dot"""
        return Path(filename).suffix.lstrip('.').lower()

    def validate_file_size(self, file_size: int) -> bool:
        """Validate file size"""
        return file_size <= settings.MAX_FILE_SIZE

    def validate_image_extension(self, filename: str) -> bool:
        """Validate image file extension"""
        ext = self.get_file_extension(filename)
        return ext in settings.allowed_image_extensions_list

    def validate_file_extension(self, filename: str) -> bool:
        """Validate file extension"""
        ext = self.get_file_extension(filename)
        allowed = settings.allowed_image_extensions_list + settings.allowed_file_extensions_list
        return ext in allowed

    async def save_image(self, file: UploadFile) -> Tuple[str, Path]:
        """Save uploaded image"""
        # Validate extension
        if not self.validate_image_extension(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image format. Allowed: {settings.ALLOWED_IMAGE_EXTENSIONS}"
            )

        # Generate unique filename
        filename = self.generate_unique_filename(file.filename)
        file_path = self.images_dir / filename

        # Save file
        try:
            content = await file.read()

            # Validate file size
            if not self.validate_file_size(len(content)):
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / 1024 / 1024}MB"
                )

            # Validate it's actually an image using PIL
            try:
                image = Image.open(BytesIO(content))
                image.verify()
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid image file")

            # Save to disk
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)

            return filename, file_path

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

    async def save_file(self, file: UploadFile) -> Tuple[str, Path, str]:
        """Save uploaded file"""
        # Validate extension
        if not self.validate_file_extension(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file format"
            )

        # Generate unique filename
        filename = self.generate_unique_filename(file.filename)
        file_path = self.files_dir / filename

        # Save file
        try:
            content = await file.read()

            # Validate file size
            if not self.validate_file_size(len(content)):
                raise HTTPException(
                    status_code=400,
                    detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / 1024 / 1024}MB"
                )

            # Detect MIME type using filetype
            kind = filetype.guess(content)
            mime_type = kind.mime if kind else 'application/octet-stream'

            # Save to disk
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)

            return filename, file_path, mime_type

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    def get_file_url(self, filename: str, file_type: str = "images") -> str:
        """Generate file URL"""
        return f"{settings.BASE_URL}/uploads/{file_type}/{filename}"

    async def delete_file(self, file_path: Path) -> bool:
        """Delete file from disk"""
        try:
            if file_path.exists():
                file_path.unlink()
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False


file_handler = FileHandler()