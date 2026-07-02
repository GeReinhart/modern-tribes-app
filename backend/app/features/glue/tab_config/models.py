from typing import List, Optional

from pydantic import BaseModel


class TabConfigItem(BaseModel):
    key: str
    visible: bool
    order: int
    is_default: bool = False
    icon: Optional[str] = None


class UserTabConfigRequest(BaseModel):
    tab_configs: List[TabConfigItem]


class UserTabConfigResponse(BaseModel):
    context_key: str
    tab_configs: List[TabConfigItem]
