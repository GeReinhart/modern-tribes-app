from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.platform.core.database import get_database
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authorization.permission_models import Permission, PermissionCreate, PermissionUpdate
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_permission_decorator
from app.platform.core.utils.db_helpers import (
    check_cascade_constraint,
    check_document_exists,
    check_unique_field,
    create_document,
    delete_document,
    get_all_documents,
    get_document_by_id,
    update_document,
)

router = APIRouter(prefix="/permissions", tags=["platform_core"])

TABLE = "permissions"
ENTITY_NAME = "Permission"


@router.get("/", response_model=List[Permission])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_permissions(current_user: dict = Depends(get_current_user)):
    """Get all permissions"""
    pool = get_database()
    return await get_all_documents(pool, TABLE, any_status=True)


@router.get("/{permission_id}", response_model=Permission)
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_permission(permission_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific permission by ID"""
    pool = get_database()
    return await get_document_by_id(pool, TABLE, permission_id, ENTITY_NAME)


@router.post("/", response_model=Permission, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_permission(permission: PermissionCreate, current_user: dict = Depends(get_current_user)):
    """Create a new permission"""
    pool = get_database()

    # Check if permission name already exists
    await check_unique_field(
        pool, TABLE, "name", permission.name, error_message="Permission name already exists"
    )

    # Create permission
    permission_dict = permission.model_dump()
    permission_dict["created_by"] = UUID(current_user["id"])
    permission_dict["updated_by"] = UUID(current_user["id"])
    return await create_document(pool, TABLE, permission_dict)


@router.put("/{permission_id}", response_model=Permission)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_permission(
    permission_id: str, permission: PermissionUpdate, current_user: dict = Depends(get_current_user)
):
    """Update an existing permission"""
    pool = get_database()

    # Check if permission exists
    existing_permission = await check_document_exists(pool, TABLE, permission_id, ENTITY_NAME)

    # Check if new name already exists (if name is being changed)
    if permission.name and permission.name != existing_permission.get("name"):
        await check_unique_field(
            pool,
            TABLE,
            "name",
            permission.name,
            exclude_id=permission_id,
            error_message="Permission name already exists",
        )

    # Update permission
    permission_dict = permission.model_dump(exclude_unset=True)
    permission_dict["updated_by"] = UUID(current_user["id"])
    return await update_document(pool, TABLE, permission_id, permission_dict, ENTITY_NAME)


@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_permission(permission_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a permission"""
    pool = get_database()

    # Check referential integrity
    await check_cascade_constraint(
        pool,
        table="role_permissions",
        field="permission_id",
        value=permission_id,
        entity_name="permission",
        dependent_entity="role",
    )

    await delete_document(pool, TABLE, permission_id, ENTITY_NAME)
    return None


@router.get("/{permission_id}/roles")
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_permission_roles(permission_id: str, current_user: dict = Depends(get_current_user)):
    """Get all members in a permission"""
    pool = get_database()

    # Check if permission exists and get it
    permission = await check_document_exists(pool, TABLE, permission_id, ENTITY_NAME)

    roles = await get_all_documents(
        pool, "role_permissions", filter_query="permission_id = $1", params=[UUID(permission_id)]
    )

    return {
        "permission_id": str(permission["id"]),
        "permission_name": permission["name"],
        "role_count": len(roles),
        "roles": roles,
    }
