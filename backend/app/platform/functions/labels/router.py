from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.platform.core.database import get_database
from app.platform.core.authorization.models import PermissionEnum
from app.platform.functions.labels.models import Label, LabelCreate, LabelUpdate
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_permission_decorator
from app.platform.core.utils.db_helpers import (
    check_document_exists,
    check_unique_field,
    create_document,
    delete_document,
    get_all_documents,
    get_document_by_id,
    update_document,
)

router = APIRouter(prefix="/labels", tags=["crud_labels"])

TABLE = "labels"
ENTITY_NAME = "Label"


@router.get("/", response_model=List[Label])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_labels(current_user: dict = Depends(get_current_user)):
    """Get all labels"""
    pool = get_database()
    return await get_all_documents(pool, TABLE)


@router.get("/{label_id}", response_model=Label)
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_label(label_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific label by ID"""
    pool = get_database()
    return await get_document_by_id(pool, TABLE, label_id, ENTITY_NAME)


@router.post("/", response_model=Label, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_label(label: LabelCreate, current_user: dict = Depends(get_current_user)):
    """Create a new label"""
    pool = get_database()

    # Check unique name
    await check_unique_field(pool, TABLE, "name", label.name, error_message="Label name already exists")

    # Create label
    label_dict = label.model_dump()
    label_dict["created_by"] = UUID(current_user["id"])
    label_dict["updated_by"] = UUID(current_user["id"])
    return await create_document(pool, TABLE, label_dict)


@router.put("/{label_id}", response_model=Label)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_label(label_id: str, label: LabelUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing label"""
    pool = get_database()

    # Check if label exists
    existing_label = await check_document_exists(pool, TABLE, label_id, ENTITY_NAME)

    # Check unique name if changed
    if label.name and label.name != existing_label.get("name"):
        await check_unique_field(
            pool, TABLE, "name", label.name, exclude_id=label_id, error_message="Label name already exists"
        )

    # Update label
    label_dict = label.model_dump(exclude_unset=True)
    label_dict["updated_by"] = UUID(current_user["id"])
    return await update_document(pool, TABLE, label_id, label_dict, ENTITY_NAME)


@router.delete("/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_label(label_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a label"""
    pool = get_database()
    await delete_document(pool, TABLE, label_id, ENTITY_NAME)
    return None
