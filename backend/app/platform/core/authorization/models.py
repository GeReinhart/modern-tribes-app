from enum import Enum

from pydantic import BaseModel


class PermissionEnum(str, Enum):
    ADMIN = "admin"
    CAN_CREATE_OWN_TRIBES = "can_create_own_tribes"
    CAN_ACCESS_OWN_TRIBES = "can_access_attached_tribes"
    CAN_MANAGE_OWN_PROFILE = "can_manage_own_profile"
    CAN_MANAGE_PEOPLE = "can_manage_people"
    CAN_ASSIGN_PROJECTS = "can_assign_projects"


class Authorization(BaseModel):
    authorized: bool
    message: str
