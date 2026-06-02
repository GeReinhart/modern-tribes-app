from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.platform.core.database import get_database
from app.platform.core.authorization.models import PermissionEnum
from app.platform.functions.people.represents.models import Represents, RepresentsCreate, RepresentsUpdate
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import (
    require_any_permission_decorator,
    require_permission_decorator,
)
from app.platform.core.utils.db_helpers import (
    check_document_exists,
    create_document,
    delete_document,
    get_all_documents,
    get_document_by_id,
    update_document,
)
from app.platform.core.authorization.ownership import check_own_user_or_admin
from app.platform.core.utils.validators import EntityValidator

router = APIRouter(prefix="/represents", tags=["platform_people"])

TABLE = "represents"
ENTITY_NAME = "Represents"


@router.get("/", response_model=List[Represents])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_MANAGE_PEOPLE)
async def get_all_represents(current_user: dict = Depends(get_current_user)):
    """Get all representation links between users and persons.

    **Permissions:** admin | can_manage_people
    """
    pool = get_database()
    return await get_all_documents(pool, TABLE, any_status=True)


@router.get("/by/user/{user_id}", response_model=List[Represents])
@require_any_permission_decorator(
    PermissionEnum.ADMIN, PermissionEnum.CAN_MANAGE_OWN_PROFILE, PermissionEnum.CAN_MANAGE_PEOPLE
)
async def get_represents_by_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get all representation links for a specific user.

    **Permissions:** admin | can_manage_own_profile (own) | can_manage_people (any)
    """
    pool = get_database()
    await check_own_user_or_admin(user_id, current_user, pool)
    return await get_all_documents(
        pool, TABLE, filter_query="user_id = $1", params=[UUID(user_id)], any_status=True
    )


@router.get("/{represents_id}", response_model=Represents)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_MANAGE_PEOPLE)
async def get_represents(represents_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific representation link by ID.

    **Permissions:** admin | can_manage_people
    """
    pool = get_database()
    return await get_document_by_id(pool, TABLE, represents_id, ENTITY_NAME)


@router.post("/", response_model=Represents, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_MANAGE_PEOPLE)
async def create_represents(represents: RepresentsCreate, current_user: dict = Depends(get_current_user)):
    """Create a new representation link between a user and a person.

    **Permissions:** admin | can_manage_people
    """
    pool = get_database()
    validator = EntityValidator(pool)

    await validator.validate_references(
        [
            {"table": "users", "id": represents.user_id, "name": "User"},
            {"table": "persons", "id": represents.person_id, "name": "Person"},
        ]
    )

    data = represents.model_dump()
    data["created_by"] = UUID(current_user["id"])
    data["updated_by"] = UUID(current_user["id"])
    return await create_document(pool, TABLE, data)


@router.put("/{represents_id}", response_model=Represents)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_MANAGE_PEOPLE)
async def update_represents(
    represents_id: str, represents: RepresentsUpdate, current_user: dict = Depends(get_current_user)
):
    """Update an existing representation link.

    **Permissions:** admin | can_manage_people
    """
    pool = get_database()
    validator = EntityValidator(pool)

    await check_document_exists(pool, TABLE, represents_id, ENTITY_NAME)

    references = []
    if represents.user_id:
        references.append({"table": "users", "id": represents.user_id, "name": "User"})
    if represents.person_id:
        references.append({"table": "persons", "id": represents.person_id, "name": "Person"})
    if references:
        await validator.validate_references(references)

    data = represents.model_dump(exclude_unset=True)
    data["updated_by"] = UUID(current_user["id"])
    return await update_document(pool, TABLE, represents_id, data, ENTITY_NAME)


@router.delete("/{represents_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_MANAGE_PEOPLE)
async def delete_represents(represents_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a representation link.

    **Permissions:** admin | can_manage_people
    """
    pool = get_database()
    await delete_document(pool, TABLE, represents_id, ENTITY_NAME)
    return None
