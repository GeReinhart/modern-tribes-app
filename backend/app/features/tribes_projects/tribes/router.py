from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.platform.core.database import get_database
from app.platform.core.authorization.models import PermissionEnum
from app.features.tribes_projects.models import TribeProject, TribeProjectInput
from app.features.tribes_projects.tribes.models import Tribe, TribeCreate, TribeUpdate
from app.features.tribes_projects.tribes import repository as tribe_repo
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import (
    require_any_permission_decorator,
    require_permission_decorator,
)
from app.platform.core.utils.db_helpers import (
    check_document_exists,
    check_unique_field,
    create_document,
    delete_document,
    get_all_documents,
    get_document_by_id,
    resolve_url_param_id,
    update_document,
)
from app.platform.core.utils.validators import EntityValidator

router = APIRouter(prefix="/tribes", tags=["features_tribes_projects"])

TABLE = "tribes"
ENTITY_NAME = "Tribe"


@router.get("/", response_model=List[Tribe])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ASSIGN_PROJECTS)
async def get_tribes(current_user: dict = Depends(get_current_user)):
    """Get all tribes

    **Permissions:** admin | can_assign_projects
    """
    pool = get_database()
    return await tribe_repo.get_all_tribes_with_member_count(pool)


@router.get("/{tribe_id}", response_model=Tribe)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ASSIGN_PROJECTS)
async def get_tribe(tribe_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific tribe by ID

    **Permissions:** admin | can_assign_projects
    """
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)
    return await get_document_by_id(pool, TABLE, tribe_id, ENTITY_NAME)


@router.post("/", response_model=Tribe, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_tribe(tribe: TribeCreate, current_user: dict = Depends(get_current_user)):
    """Create a new tribe

    **Permissions:** admin
    """
    pool = get_database()
    validator = EntityValidator(pool)

    # Check unique name
    await check_unique_field(pool, TABLE, "name", tribe.name, error_message="Tribe name already exists")

    # Validate single references
    references = []
    if tribe.document_id:
        references.append({"table": "documents", "id": tribe.document_id, "name": "Document"})

    await validator.validate_references(references)

    # Create tribe
    tribe_dict = tribe.model_dump()
    tribe_dict["created_by"] = UUID(current_user["id"])
    tribe_dict["updated_by"] = UUID(current_user["id"])
    return await create_document(pool, TABLE, tribe_dict)


@router.put("/{tribe_id}", response_model=Tribe)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_tribe(tribe_id: str, tribe: TribeUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing tribe

    **Permissions:** admin
    """
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)
    validator = EntityValidator(pool)

    # Check if tribe exists
    existing_tribe = await check_document_exists(pool, TABLE, tribe_id, ENTITY_NAME)

    # Check unique name if changed
    if tribe.name and tribe.name != existing_tribe.get("name"):
        await check_unique_field(
            pool, TABLE, "name", tribe.name, exclude_id=tribe_id, error_message="Tribe name already exists"
        )

    # Validate document reference
    references = []
    if tribe.document_id:
        references.append({"table": "documents", "id": tribe.document_id, "name": "Document"})

    await validator.validate_references(references)

    # Update tribe
    tribe_dict = tribe.model_dump(exclude_unset=True)
    tribe_dict["updated_by"] = UUID(current_user["id"])
    return await update_document(pool, TABLE, tribe_id, tribe_dict, ENTITY_NAME)


@router.delete("/{tribe_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_tribe(tribe_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a tribe

    **Permissions:** admin
    """
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)
    await delete_document(pool, TABLE, tribe_id, ENTITY_NAME)
    return None


@router.get("/{tribe_id}/positions")
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_tribe_positions(tribe_id: str, current_user: dict = Depends(get_current_user)):
    """Get all positions in a tribe

    **Permissions:** admin
    """
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)

    # Check if tribe exists and get it
    tribe = await check_document_exists(pool, TABLE, tribe_id, ENTITY_NAME)

    # Get all positions with this tribe using SQL
    positions = await get_all_documents(
        pool, "positions", filter_query="tribe_id = $1", params=[UUID(tribe_id)]
    )

    return {
        "tribe_id": str(tribe["id"]),
        "tribe_name": tribe["name"],
        "position_count": len(positions),
        "positions": positions,
    }


@router.get("/{tribe_id}/projects", response_model=List[TribeProject])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ASSIGN_PROJECTS)
async def get_tribe_projects(tribe_id: str, current_user: dict = Depends(get_current_user)):
    """Get all project relations for a tribe

    **Permissions:** admin | can_assign_projects
    """
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)
    await check_document_exists(pool, TABLE, tribe_id, ENTITY_NAME)
    return await tribe_repo.get_tribe_projects(pool, tribe_id)


@router.put("/{tribe_id}/projects", response_model=List[TribeProject])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ASSIGN_PROJECTS)
async def sync_tribe_projects(
    tribe_id: str, projects: List[TribeProjectInput], current_user: dict = Depends(get_current_user)
):
    """Replace all project relations for a tribe

    **Permissions:** admin | can_assign_projects
    """
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)
    await check_document_exists(pool, TABLE, tribe_id, ENTITY_NAME)
    validator = EntityValidator(pool)
    if projects:
        await validator.validate_reference_lists(
            [{"table": "projects", "ids": [p.project_id for p in projects], "name": "Project"}]
        )
    return await tribe_repo.sync_tribe_projects(pool, tribe_id, [p.model_dump() for p in projects])


@router.get("/{tribe_id}/persons")
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_tribe_persons(tribe_id: str, current_user: dict = Depends(get_current_user)):
    """Get all persons and their positions in a tribe

    **Permissions:** admin
    """
    pool = get_database()
    tribe_id = await resolve_url_param_id(pool, TABLE, tribe_id)

    tribe = await check_document_exists(pool, TABLE, tribe_id, ENTITY_NAME)

    # Get all positions for this tribe using SQL
    positions = await get_all_documents(
        pool, "positions", filter_query="tribe_id = $1", params=[UUID(tribe_id)]
    )

    if not positions:
        return {"tribe_id": str(tribe["id"]), "tribe_name": tribe["name"], "person_count": 0, "persons": []}

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
        "persons": persons_with_positions,
    }
