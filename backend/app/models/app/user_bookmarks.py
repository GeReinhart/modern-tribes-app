from typing import List, Optional

from pydantic import BaseModel


class UserBookmarkCreate(BaseModel):
    page_path: str
    page_title: str
    description: Optional[str] = None
    color_text: Optional[str] = None
    color_background: Optional[str] = None


class UserBookmarkUpdate(BaseModel):
    page_title: str
    description: Optional[str] = None
    color_text: Optional[str] = None
    color_background: Optional[str] = None


class UserBookmarkItem(BaseModel):
    id: str
    page_path: str
    page_title: str
    display_order: int
    description: Optional[str] = None
    color_text: Optional[str] = None
    color_background: Optional[str] = None


class UserBookmarksResponse(BaseModel):
    bookmarks: List[UserBookmarkItem]


class UserBookmarksReorderRequest(BaseModel):
    ordered_ids: List[str]
