from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from ...core.database import get_database
from ...models.auth.auth import PermissionEnum
from ...routers.auth.authorization import (
    require_permission_decorator
)

from ...models.crud.tribes import Tribe, TribeCreate, TribeUpdate
from ...models.crud.tribe_projects import TribeProjectInput, TribeProject
from ...repositories import tribe_repository as tribe_repo
from ...routers.auth.authentification import get_current_user
from ...utils.db_helpers import (
    get_all_documents,
    get_document_by_id,
    create_document,
    update_document,
    delete_document,
    check_unique_field,
    check_document_exists,
    row_to_dict,
    resolve_url_param_id,
)
from ...utils.validators import EntityValidator

router = APIRouter(prefix="/tribes", tags=["crud_tribes"])

TABLE = "tribes"
ENTITY_NAME = "Tribe"


@router.get("/", response_model=List[Tribe])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_tribes(current_user: dict = Depends(get_current_user)):
    """Get all tribes"""

    pool = get_database()
    return await get_all_documents(pool, TABLE, any_status=True)


@router.get("/{tribe_id}", response_model=Tribe)
@require_permission_decorator(PermissionEnum.ADMIN)
# @require_any_permission_decorator(PermissionEnum.ADMIN, Permission.CAN_CRUD_OWN_TRIBES)
async def get_tribe(tribe_id: str,current_user: dict = Depends(get_current_user)):
    """Get a specific tribe by ID"""
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)
    return await get_document_by_id(pool, TABLE, tribe_id, ENTITY_NAME)


# @require_all_permissions_decorator(PermissionEnum.ADMIN, "specific_permission")
@require_permission_decorator(PermissionEnum.ADMIN)
@router.post("/", response_model=Tribe, status_code=status.HTTP_201_CREATED)
async def create_tribe(tribe: TribeCreate,current_user: dict = Depends(get_current_user)):
    """Create a new tribe"""
    pool = get_database()
    validator = EntityValidator(pool)

    # Check unique name
    await check_unique_field(
        pool,
        TABLE,
        "name",
        tribe.name,
        error_message="Tribe name already exists"
    )

    # Validate single references
    references = []
    if tribe.document_id:
        references.append({
            'table': 'documents',
            'id': tribe.document_id,
            'name': 'Document'
        })

    await validator.validate_references(references)

    # Create tribe
    tribe_dict = tribe.model_dump()
    tribe_dict['created_by'] = UUID(current_user['id'])
    tribe_dict['updated_by'] = UUID(current_user['id'])
    return await create_document(pool, TABLE, tribe_dict)


@router.put("/{tribe_id}", response_model=Tribe)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_tribe(tribe_id: str, tribe: TribeUpdate,current_user: dict = Depends(get_current_user)):
    """Update an existing tribe"""
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)
    validator = EntityValidator(pool)

    # Check if tribe exists
    existing_tribe = await check_document_exists(pool, TABLE, tribe_id, ENTITY_NAME)

    # Check unique name if changed
    if tribe.name and tribe.name != existing_tribe.get("name"):
        await check_unique_field(
            pool,
            TABLE,
            "name",
            tribe.name,
            exclude_id=tribe_id,
            error_message="Tribe name already exists"
        )

    # Validate document reference
    references = []
    if tribe.document_id:
        references.append({
            'table': 'documents',
            'id': tribe.document_id,
            'name': 'Document'
        })

    await validator.validate_references(references)

    # Update tribe
    tribe_dict = tribe.model_dump(exclude_unset=True)
    tribe_dict['updated_by'] = UUID(current_user['id'])
    return await update_document(pool, TABLE, tribe_id, tribe_dict, ENTITY_NAME)


@router.delete("/{tribe_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_tribe(tribe_id: str,current_user: dict = Depends(get_current_user)):
    """Delete a tribe"""
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)
    await delete_document(pool, TABLE, tribe_id, ENTITY_NAME)
    return None


@router.get("/{tribe_id}/positions")
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_tribe_positions(tribe_id: str,current_user: dict = Depends(get_current_user)):
    """Get all positions in a tribe"""
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)

    # Check if tribe exists and get it
    tribe = await check_document_exists(pool, TABLE, tribe_id, ENTITY_NAME)

    # Get all positions with this tribe using SQL
    positions = await get_all_documents(
        pool,
        "positions",
        filter_query="tribe_id = $1",
        params=[UUID(tribe_id)]
    )

    return {
        "tribe_id": str(tribe["id"]),
        "tribe_name": tribe["name"],
        "position_count": len(positions),
        "positions": positions
    }


@router.get("/{tribe_id}/projects", response_model=List[TribeProject])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_tribe_projects(tribe_id: str, current_user: dict = Depends(get_current_user)):
    """Get all project relations for a tribe"""
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)
    await check_document_exists(pool, TABLE, tribe_id, ENTITY_NAME)
    return await tribe_repo.get_tribe_projects(pool, tribe_id)


@router.put("/{tribe_id}/projects", response_model=List[TribeProject])
@require_permission_decorator(PermissionEnum.ADMIN)
async def sync_tribe_projects(tribe_id: str, projects: List[TribeProjectInput], current_user: dict = Depends(get_current_user)):
    """Replace all project relations for a tribe"""
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)
    await check_document_exists(pool, TABLE, tribe_id, ENTITY_NAME)
    validator = EntityValidator(pool)
    if projects:
        await validator.validate_reference_lists([{
            'table': 'projects',
            'ids': [p.project_id for p in projects],
            'name': 'Project'
        }])
    return await tribe_repo.sync_tribe_projects(pool, tribe_id, [p.model_dump() for p in projects])


@router.get("/{tribe_id}/persons")
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_tribe_persons(tribe_id: str,current_user: dict = Depends(get_current_user)):
    """Get all persons and their positions in a tribe"""
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)

    tribe = await check_document_exists(pool, TABLE, tribe_id, ENTITY_NAME)

    # Get all positions for this tribe using SQL
    positions = await get_all_documents(
        pool,
        "positions",
        filter_query="tribe_id = $1",
        params=[UUID(tribe_id)]
    )

    if not positions:
        return {
            "tribe_id": str(tribe["id"]),
            "tribe_name": tribe["name"],
            "person_count": 0,
            "persons": []
        }

    # Get unique person_ids (already strings from get_all_documents)
    person_ids = list(set(pos.get("person_id") for pos in positions if pos.get("person_id")))

    # Fetch all persons
    persons_dict = {}
    for person_id in person_ids:
        try:
            person = await get_document_by_id(pool, "persons", person_id, "Person")
            persons_dict[person_id] = person
        except:
            continue

    # Combine persons with their positions
    persons_with_positions = []
    for position in positions:
        person_id = position.get("person_id")
        if person_id in persons_dict:
            person_data = persons_dict[person_id].copy()
            person_data["position"] = position.get("position")
            person_data["position_id"] = position.get("id")
            persons_with_positions.append(person_data)

    return {
        "tribe_id": str(tribe["id"]),
        "tribe_name": tribe["name"],
        "person_count": len(persons_with_positions),
        "persons": persons_with_positions
    }