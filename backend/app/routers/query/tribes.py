from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pydantic import BaseModel

from ..auth.authentification import get_current_user
from ..auth.authorization import require_any_permission_decorator
from ...utils.ownership import check_own_user_or_admin
from ...models.auth.auth import PermissionEnum
from ...models.crud.positions import PositionEnum
from ...core.database import get_database
from ...utils.db_helpers import (
    get_all_documents,
    get_document_by_id,
)

router = APIRouter(prefix="/tribes", tags=["query_tribes"])


class UserPersonPositionTribe(BaseModel):
    user_id: str
    user_login: str
    user_email: str
    person_id: str
    person_first_name: str
    person_last_name: str
    position: PositionEnum
    tribe_id: str
    tribe_name: str


@router.get("/by/user/{user_id}", response_model=List[UserPersonPositionTribe])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_tribes_by_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get all tribes associated with a user"""
    pool = get_database()
    await check_own_user_or_admin(user_id, current_user, pool)

    user = await get_document_by_id(pool, "users", user_id, "User")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    person_id = user.get("person_id")
    if not person_id:
        return []

    person = await get_document_by_id(pool, "persons", person_id, "Person")
    if not person:
        return []

    positions = await get_all_documents(
        pool,
        "positions",
        filter_query="person_id = $1",
        params=[person_id]
    )

    result = []
    for position in positions:
        tribe_id = position.get("tribe_id")
        if not tribe_id:
            continue

        tribe = await get_document_by_id(pool, "tribes", tribe_id, "Tribe")
        if not tribe:
            continue

        result.append(UserPersonPositionTribe(
            user_id=str(user.get("id")),
            user_login=user.get("login", ""),
            user_email=user.get("email", ""),
            person_id=str(person.get("id")),
            person_first_name=person.get("first_name", ""),
            person_last_name=person.get("last_name", ""),
            position=position.get("position"),
            tribe_id=str(tribe.get("id")),
            tribe_name=tribe.get("name", "")
        ))

    return result
