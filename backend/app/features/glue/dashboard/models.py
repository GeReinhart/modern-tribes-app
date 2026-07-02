from typing import List, Optional

from pydantic import BaseModel


class PinnedTabCreate(BaseModel):
    bookmark_id: str


class PinnedTabItem(BaseModel):
    id: str
    bookmark_id: str
    page_path: str
    page_title: str
    display_order: int


class PinnedTabsResponse(BaseModel):
    pinned_tabs: List[PinnedTabItem]
