from fastapi import APIRouter, status, Depends
from typing import List
from uuid import UUID

from ..auth.authorization import get_current_user
from ...models.crud.roles import Role, RoleCreate, RoleUpdate, RoleWithPermissions
from ...repositories import role_repository as role_repo
from ...core.database import get_database
from ...utils.db_helpers import (
    get_all_documents,
    get_document_by_id,
    create_document,
    update_document,
    delete_document,
    check_unique_field,
    check_document_exists,
    check_cascade_constraint
)
from ...models.auth.auth import PermissionEnum
from ...routers.auth.authorization import (
    require_permission_decorator
)

router = APIRouter(prefix="/roles", tags=["crud_roles"])

TABLE = "roles"
ENTITY_NAME = "Role"


@router.get("/", response_model=List[Role])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_roles(current_user: dict = Depends(get_current_user)):
    """Get all roles"""
    pool = get_database()
    return await get_all_documents(pool, TABLE)


@router.get("/with/permissions", response_model=List[RoleWithPermissions])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_roles_with_permissions(current_user: dict = Depends(get_current_user)):
    pool = get_database()
    return await role_repo.get_roles_with_permissions(pool)


@router.get("/{role_id}", response_model=Role)
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_role(role_id: str,current_user: dict = Depends(get_current_user)):
    """Get a specific role by ID"""
    pool = get_database()
    return await get_document_by_id(pool, TABLE, role_id, ENTITY_NAME)


@router.post("/", response_model=Role, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_role(role: RoleCreate,current_user: dict = Depends(get_current_user)):
    """Create a new role"""
    pool = get_database()

    # Check if role name already exists
    await check_unique_field(
        pool,
        TABLE,
        "name",
        role.name,
        error_message="Role name already exists"
    )

    role_dict = role.model_dump()
    permission_ids = role_dict.pop('permission_ids', None)
    role_dict['created_by'] = UUID(current_user['id'])
    role_dict['updated_by'] = UUID(current_user['id'])
    created = await create_document(pool, TABLE, role_dict)
    if permission_ids:
        async with pool.acquire() as conn:
            await role_repo.update_role_permissions(conn, created['id'], permission_ids)
    return created


@router.put("/{role_id}", response_model=Role)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_role(role_id: str, role: RoleUpdate,current_user: dict = Depends(get_current_user)):
    """Update an existing role"""
    pool = get_database()

    # Check if role exists
    existing_role = await check_document_exists(pool, TABLE, role_id, ENTITY_NAME)

    # Check if new name already exists (if name is being changed)
    if role.name and role.name != existing_role.get("name"):
        await check_unique_field(
            pool,
            TABLE,
            "name",
            role.name,
            exclude_id=role_id,
            error_message="Role name already exists"
        )

    role_dict = role.model_dump(exclude_unset=True)
    permission_ids = role_dict.pop('permission_ids', None)
    role_dict['updated_by'] = UUID(current_user['id'])
    updated = await update_document(pool, TABLE, role_id, role_dict, ENTITY_NAME)
    if permission_ids is not None:
        async with pool.acquire() as conn:
            await role_repo.update_role_permissions(conn, role_id, permission_ids)
    return updated


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_role(role_id: str,current_user: dict = Depends(get_current_user)):
    """Delete a role"""
    pool = get_database()

    # Check referential integrity
    await check_cascade_constraint(
        pool,
        table="user_roles",
        field="role_id",
        value=role_id,
        entity_name="role",
        dependent_entity="user"
    )

    await delete_document(pool, TABLE, role_id, ENTITY_NAME)
    return None


@router.get("/{role_id}/users")
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_role_users(role_id: str,current_user: dict = Depends(get_current_user)):
    """Get all members in a role"""
    pool = get_database()

    # Check if role exists and get it
    role = await check_document_exists(pool, TABLE, role_id, ENTITY_NAME)

    # Get all users with this role using SQL
    users = await get_all_documents(
        pool,
        "user_roles",
        filter_query="role_id = $1",
        params=[UUID(role_id)]
    )

    return {
        "role_id": str(role["id"]),
        "role_name": role["name"],
        "user_count": len(users),
        "users": users
    }