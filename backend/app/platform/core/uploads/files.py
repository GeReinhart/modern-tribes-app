from datetime import datetime, timezone

from pydantic import BaseModel, Field


class AttachmentFile(BaseModel):
    id: str = Field(..., description="Unique file identifier")
    name: str = Field(..., description="Original filename")
    size: int = Field(..., description="File size in bytes")
    type: str = Field(..., description="MIME type")
    url: str = Field(..., description="File URL")
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UploadImageResponse(BaseModel):
    error: int = Field(default=0, description="Error code (0 = success)")
    message: str = Field(default="Upload successful")
    url: str = Field(..., description="Uploaded image URL")


class UploadFileResponse(BaseModel):
    url: str = Field(..., description="Uploaded file URL")
    name: str = Field(..., description="Original filename")
    size: int = Field(..., description="File size in bytes")
    type: str = Field(..., description="MIME type")
    id: str = Field(..., description="Unique file identifier")
