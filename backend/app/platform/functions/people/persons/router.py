from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.platform.core.database import get_database
from app.platform.core.authorization.models import PermissionEnum
from app.platform.functions.people.persons.models import Person, PersonCreate, PersonUpdate
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
from app.platform.core.authorization.ownership import check_own_person_or_admin
from app.platform.core.utils.validators import EntityValidator

router = APIRouter(prefix="/persons", tags=["platform_people"])

TABLE = "persons"
ENTITY_NAME = "Person"


@router.get("/", response_model=List[Person])
@require_any_permission_decorator(
    PermissionEnum.ADMIN, PermissionEnum.CAN_CREATE_OWN_TRIBES, PermissionEnum.CAN_ACCESS_OWN_TRIBES
)
async def get_persons(current_user: dict = Depends(get_current_user)):
    pool = get_database()
    return await get_all_documents(pool, TABLE, any_status=True)


@router.get("/{person_id}", response_model=Person)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_MANAGE_OWN_PROFILE)
async def get_person(person_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await check_own_person_or_admin(person_id, current_user, pool)
    return await get_document_by_id(pool, TABLE, person_id, ENTITY_NAME)


@router.post("/", response_model=Person, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_person(person: PersonCreate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    validator = EntityValidator(pool)
    references = (
        [{"table": "documents", "id": person.document_id, "name": "Document"}] if person.document_id else []
    )
    await validator.validate_references(references)
    person_dict = person.model_dump()
    person_dict["created_by"] = UUID(current_user["id"])
    person_dict["updated_by"] = UUID(current_user["id"])
    return await create_document(pool, TABLE, person_dict)


@router.put("/{person_id}", response_model=Person)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_MANAGE_OWN_PROFILE)
async def update_person(person_id: str, person: PersonUpdate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await check_own_person_or_admin(person_id, current_user, pool)
    validator = EntityValidator(pool)
    await check_document_exists(pool, TABLE, person_id, ENTITY_NAME)
    references = (
        [{"table": "documents", "id": person.document_id, "name": "Document"}] if person.document_id else []
    )
    await validator.validate_references(references)
    person_dict = person.model_dump(exclude_unset=True)
    person_dict["updated_by"] = UUID(current_user["id"])
    return await update_document(pool, TABLE, person_id, person_dict, ENTITY_NAME)


@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_person(person_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await delete_document(pool, TABLE, person_id, ENTITY_NAME)
    return None
