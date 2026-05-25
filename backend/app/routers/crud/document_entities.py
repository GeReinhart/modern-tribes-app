from typing import List

from fastapi import APIRouter, Depends, status

from app.core.database import get_database
from app.models.auth.auth import PermissionEnum
from app.models.crud.document_entities import (
    DocumentEntity,
    DocumentEntityCreate,
    DocumentEntityUpdate,
)
from app.routers.auth.authentification import get_current_user
from app.routers.auth.authorization import require_permission_decorator
from app.utils.db_helpers import (
    check_document_exists,
    create_document,
    delete_document,
    get_all_documents,
    get_document_by_id,
    update_document,
)
from app.utils.validators import EntityValidator

router = APIRouter(prefix="/document-entities", tags=["crud_document_entities"])

TABLE = "document_entities"
ENTITY_NAME = "DocumentEntity"


@router.get("/", response_model=List[DocumentEntity])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_document_entities(current_user: dict = Depends(get_current_user)):
    """Get all document entities"""
    pool = get_database()
    return await get_all_documents(pool, TABLE)


@router.get("/{document_entity_id}", response_model=DocumentEntity)
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_document_entity(document_entity_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific document entity by ID"""
    pool = get_database()
    return await get_document_by_id(pool, TABLE, document_entity_id, ENTITY_NAME)


@router.post("/", response_model=DocumentEntity, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_document_entity(
    document_entity: DocumentEntityCreate, current_user: dict = Depends(get_current_user)
):
    """Create a new document entity"""
    pool = get_database()
    validator = EntityValidator(pool)

    # Validate references
    references = [{"table": "documents", "id": document_entity.document_id, "name": "Document"}]

    if document_entity.project_id:
        references.append({"table": "projects", "id": document_entity.project_id, "name": "Project"})

    if document_entity.related_document_id:
        references.append(
            {"table": "documents", "id": document_entity.related_document_id, "name": "Related Document"}
        )

    await validator.validate_references(references)

    # Create document entity
    document_entity_dict = document_entity.model_dump()
    return await create_document(pool, TABLE, document_entity_dict)


@router.put("/{document_entity_id}", response_model=DocumentEntity)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_document_entity(
    document_entity_id: str,
    document_entity: DocumentEntityUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update an existing document entity"""
    pool = get_database()
    validator = EntityValidator(pool)

    # Check if document entity exists
    await check_document_exists(pool, TABLE, document_entity_id, ENTITY_NAME)

    # Validate references
    references = []

    if document_entity.document_id:
        references.append({"table": "documents", "id": document_entity.document_id, "name": "Document"})

    if document_entity.project_id:
        references.append({"table": "projects", "id": document_entity.project_id, "name": "Project"})

    if document_entity.related_document_id:
        references.append(
            {"table": "documents", "id": document_entity.related_document_id, "name": "Related Document"}
        )

    await validator.validate_references(references)

    # Update document entity
    document_entity_dict = document_entity.model_dump(exclude_unset=True)
    return await update_document(pool, TABLE, document_entity_id, document_entity_dict, ENTITY_NAME)


@router.delete("/{document_entity_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_document_entity(document_entity_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a document entity"""
    pool = get_database()
    await delete_document(pool, TABLE, document_entity_id, ENTITY_NAME)
    return None
