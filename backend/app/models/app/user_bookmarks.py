from pydantic import BaseModel
from typing import List


class UserBookmarkCreate(BaseModel):
    page_path: str
    page_title: str


class UserBookmarkItem(BaseModel):
    id: str
    page_path: str
    page_title: str
    display_order: int


class UserBookmarksResponse(BaseModel):
    bookmarks: List[UserBookmarkItem]


class UserBookmarksReorderRequest(BaseModel):
    ordered_ids: List[str]
