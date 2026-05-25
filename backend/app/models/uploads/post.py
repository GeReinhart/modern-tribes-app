from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.uploads.files import AttachmentFile


class PostCreate(BaseModel):
    content: str = Field(..., min_length=1, description="Post content in HTML")
    attachments: List[AttachmentFile] = Field(default=[], description="File attachments")


class PostUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, description="Post content in HTML")
    attachments: Optional[List[AttachmentFile]] = Field(None, description="File attachments")


class PostInDB(BaseModel):
    id
    content: str = Field(..., description="Post content in HTML")
    attachments: List[AttachmentFile] = Field(default=[], description="File attachments")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True


class PostResponse(PostInDB):
    pass


class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    page_size: int