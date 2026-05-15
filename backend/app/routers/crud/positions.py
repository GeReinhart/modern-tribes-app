from fastapi import APIRouter, status, Depends
from typing import List
from uuid import UUID

from ..auth.authorization import get_current_user
from ...models.crud.positions import Position, PositionCreate, PositionUpdate
from ...core.database import get_database
from ...utils.db_helpers import (
    get_all_documents,
    get_document_by_id,
    create_document,
    update_document,
    delete_document,
    check_document_exists
)
from ...utils.validators import EntityValidator
from ...models.auth.auth import PermissionEnum
from ...routers.auth.authorization import (
    require_permission_decorator
)

router = APIRouter(prefix="/positions", tags=["crud_positions"])

TABLE = "positions"
ENTITY_NAME = "Position"


@router.get("/", response_model=List[Position])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_positions(current_user: dict = Depends(get_current_user)):
    """Get all positions"""
    pool = get_database()
    return await get_all_documents(pool, TABLE)


@router.get("/{position_id}", response_model=Position)
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_position(position_id: str,current_user: dict = Depends(get_current_user)):
    """Get a specific position by ID"""
    pool = get_database()
    return await get_document_by_id(pool, TABLE, position_id, ENTITY_NAME)


@router.get("/by/tribe/{tribe_id}", response_model=List[Position])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_positions_by_tribe(tribe_id: str,current_user: dict = Depends(get_current_user)):
    """Get all positions associated with a tribe"""
    pool = get_database()

    return await get_all_documents(
        pool,
        "positions",
        filter_query="tribe_id = $1",
        params=[UUID(tribe_id)]
    )


@router.post("/", response_model=Position, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_position(position: PositionCreate,current_user: dict = Depends(get_current_user)):
    """Create a new position"""
    pool = get_database()
    validator = EntityValidator(pool)

    # Validate single references
    references = []
    if position.tribe_id:
        references.append({
            'table': 'tribes',
            'id': position.tribe_id,
            'name': 'Tribe'
        })
    if position.person_id:
        references.append({
            'table': 'persons',
            'id': position.person_id,
            'name': 'Person'
        })

    await validator.validate_references(references)

    # Create position
    position_dict = position.model_dump()
    position_dict['created_by'] = UUID(current_user['id'])
    position_dict['updated_by'] = UUID(current_user['id'])
    return await create_document(pool, TABLE, position_dict)


@router.put("/{position_id}", response_model=Position)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_position(position_id: str, position: PositionUpdate,current_user: dict = Depends(get_current_user)):
    """Update an existing position"""
    pool = get_database()
    validator = EntityValidator(pool)

    # Check if position exists
    await check_document_exists(pool, TABLE, position_id, ENTITY_NAME)

    # Validate single references
    references = []
    if position.tribe_id:
        references.append({
            'table': 'tribes',
            'id': position.tribe_id,
            'name': 'Tribe'
        })
    if position.person_id:
        references.append({
            'table': 'persons',
            'id': position.person_id,
            'name': 'Person'
        })

    await validator.validate_references(references)

    # Update position
    position_dict = position.model_dump(exclude_unset=True)
    position_dict['updated_by'] = UUID(current_user['id'])
    return await update_document(pool, TABLE, position_id, position_dict, ENTITY_NAME)


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_position(position_id: str,current_user: dict = Depends(get_current_user)):
    """Delete a position"""
    pool = get_database()
    await delete_document(pool, TABLE, position_id, ENTITY_NAME)
    return None

