from typing import List, Optional

from pydantic import BaseModel, model_validator


class TabConfigItem(BaseModel):
    key: str
    visible: bool
    order: int
    is_default: bool = False
    icon: Optional[str] = None
    name: Optional[str] = None

    @model_validator(mode="after")
    def validate_name_or_icon(self):
        """Clearing the name to show an icon-only tab requires an icon."""
        if self.name == "" and not self.icon:
            raise ValueError("Either name or icon must be provided when name is cleared.")
        return self


class UserTabConfigRequest(BaseModel):
    tab_configs: List[TabConfigItem]


class UserTabConfigResponse(BaseModel):
    context_key: str
    tab_configs: List[TabConfigItem]
