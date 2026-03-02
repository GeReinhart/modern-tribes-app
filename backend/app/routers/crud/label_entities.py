from fastapi import APIRouter, status, Depends
from typing import List
from uuid import UUID

from ..auth.authentification import get_current_user
from ...models.crud.label_entities import LabelEntity, LabelEntityCreate, LabelEntityUpdate
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

router = APIRouter(prefix="/label-entities", tags=["crud_label_entities"])

TABLE = "label_entities"
ENTITY_NAME = "LabelEntity"

@router.get("/", response_model=List[LabelEntity])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_label_entities(current_user: dict = Depends(get_current_user)):
    """Get all label entities"""
    pool = get_database()
    return await get_all_documents(pool, TABLE)

@router.get("/{label_entity_id}", response_model=LabelEntity)
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_label_entity(label_entity_id: str,current_user: dict = Depends(get_current_user)):
    """Get a specific label entity by ID"""
    pool = get_database()
    return await get_document_by_id(pool, TABLE, label_entity_id, ENTITY_NAME)

@router.post("/", response_model=LabelEntity, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_label_entity(label_entity: LabelEntityCreate,current_user: dict = Depends(get_current_user)):
    """Create a new label entity"""
    pool = get_database()
    validator = EntityValidator(pool)

    # Validate references
    references = [
        {
            'table': 'labels',
            'id': label_entity.label_id,
            'name': 'Label'
        }
    ]

    if label_entity.person_id:
        references.append({
            'table': 'persons',
            'id': label_entity.person_id,
            'name': 'Person'
        })

    if label_entity.project_id:
        references.append({
            'table': 'projects',
            'id': label_entity.project_id,
            'name': 'Project'
        })

    if label_entity.document_id:
        references.append({
            'table': 'documents',
            'id': label_entity.document_id,
            'name': 'Document'
        })

    await validator.validate_references(references)

    # Create label entity
    label_entity_dict = label_entity.model_dump()
    return await create_document(pool, TABLE, label_entity_dict)


@router.put("/{label_entity_id}", response_model=LabelEntity)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_label_entity(label_entity_id: str, label_entity: LabelEntityUpdate,current_user: dict = Depends(get_current_user)):
    """Update an existing label entity"""
    pool = get_database()
    validator = EntityValidator(pool)

    # Check if label entity exists
    await check_document_exists(pool, TABLE, label_entity_id, ENTITY_NAME)

    # Validate references
    references = []

    if label_entity.label_id:
        references.append({
            'table': 'labels',
            'id': label_entity.label_id,
            'name': 'Label'
        })

    if label_entity.person_id:
        references.append({
            'table': 'persons',
            'id': label_entity.person_id,
            'name': 'Person'
        })

    if label_entity.project_id:
        references.append({
            'table': 'projects',
            'id': label_entity.project_id,
            'name': 'Project'
        })

    if label_entity.document_id:
        references.append({
            'table': 'documents',
            'id': label_entity.document_id,
            'name': 'Document'
        })

    await validator.validate_references(references)

    # Update label entity
    label_entity_dict = label_entity.model_dump(exclude_unset=True)
    return await update_document(pool, TABLE, label_entity_id, label_entity_dict, ENTITY_NAME)


@router.delete("/{label_entity_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_label_entity(label_entity_id: str,current_user: dict = Depends(get_current_user)):
    """Delete a label entity"""
    pool = get_database()
    await delete_document(pool, TABLE, label_entity_id, ENTITY_NAME)
    return None