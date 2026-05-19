from fastapi import APIRouter, status, Depends
from typing import List
from uuid import UUID
import json

from ..auth.authentification import get_current_user
from ...models.crud.documents import Document, DocumentCreate, DocumentUpdate
from ...core.database import get_database
from ...utils.db_helpers import (
    get_all_documents,
    get_document_by_id,
    create_document,
    update_document,
    delete_document,
    check_document_exists
)
from ...models.auth.auth import PermissionEnum
from ...routers.auth.authorization import (
    require_permission_decorator
)
from ...utils.document_helpers import extract_content_summary

router = APIRouter(prefix="/documents", tags=["crud_documents"])

TABLE = "documents"
ENTITY_NAME = "Document"


@router.get("/", response_model=List[Document])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_documents(current_user: dict = Depends(get_current_user)):
    """Get all documents"""
    pool = get_database()
    return await get_all_documents(pool, TABLE, any_status=True)


@router.get("/{document_id}", response_model=Document)
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_document(document_id: str,current_user: dict = Depends(get_current_user)):
    """Get a specific document by ID"""
    pool = get_database()
    return await get_document_by_id(pool, TABLE, document_id, ENTITY_NAME)


@router.post("/", response_model=Document, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_document_endpoint(document: DocumentCreate,current_user: dict = Depends(get_current_user)):
    """Create a new document"""
    pool = get_database()

    # Create document
    document_dict = document.model_dump()
    document_dict['content_summary'] = extract_content_summary(document_dict['content_html'])
    document_dict['created_by'] = UUID(current_user['id'])
    document_dict['updated_by'] = UUID(current_user['id'])
    return await create_document(pool, TABLE, document_dict)


@router.put("/{document_id}", response_model=Document)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_document_endpoint(document_id: str, document: DocumentUpdate,current_user: dict = Depends(get_current_user)):
    """Update an existing document"""
    pool = get_database()

    current_doc = await check_document_exists(pool, TABLE, document_id, ENTITY_NAME)

    document_dict = document.model_dump(exclude_unset=True)
    if 'content_html' in document_dict:
        document_dict['content_summary'] = extract_content_summary(document_dict['content_html'])
    document_dict['updated_by'] = UUID(current_user['id'])

    revisions_raw = current_doc.get('revisions') or '[]'
    current_revisions = json.loads(revisions_raw) if isinstance(revisions_raw, str) else revisions_raw
    updated_at = current_doc.get('updated_at')
    current_revisions.append({
        'content_html': current_doc['content_html'],
        'updated_at': updated_at.isoformat() if hasattr(updated_at, 'isoformat') else str(updated_at),
        'updated_by': current_doc.get('updated_by'),
    })
    document_dict['revisions'] = current_revisions

    return await update_document(pool, TABLE, document_id, document_dict, ENTITY_NAME)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_document_endpoint(document_id: str,current_user: dict = Depends(get_current_user)):
    """Delete a document"""
    pool = get_database()
    await delete_document(pool, TABLE, document_id, ENTITY_NAME)
    return None