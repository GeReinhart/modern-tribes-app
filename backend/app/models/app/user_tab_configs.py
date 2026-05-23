from pydantic import BaseModel
from typing import List


class TabConfigItem(BaseModel):
    key: str
    visible: bool
    order: int
    is_default: bool = False


class UserTabConfigRequest(BaseModel):
    tab_configs: List[TabConfigItem]


class UserTabConfigResponse(BaseModel):
    context_key: str
    tab_configs: List[TabConfigItem]
