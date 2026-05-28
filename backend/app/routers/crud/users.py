from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import settings
from app.core.database import get_database
from app.core.email import magic_link_html
from app.platform.authentication.security import create_magic_token
from app.platform.authorization.models import PermissionEnum
from app.models.crud.users import User, UserCreate, UserUpdate, UserWithRoles
from app.repositories import user_repository as user_repo
from app.platform.authentication.router import get_current_user
from app.platform.authorization.router import (
    require_any_permission_decorator,
    require_permission_decorator,
)
from app.utils.db_helpers import (
    check_document_exists,
    check_unique_field,
    create_document,
    delete_document,
    get_all_documents,
    resolve_url_param_id,
    update_document,
)
from app.platform.authorization.ownership import check_own_user_or_admin
from app.utils.validators import EntityValidator

router = APIRouter(prefix="/users", tags=["crud_users"])

TABLE = "users"
ENTITY_NAME = "User"


@router.get("/", response_model=List[User])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_users(current_user: dict = Depends(get_current_user)):
    pool = get_database()
    return await get_all_documents(pool, TABLE, any_status=True)


@router.get("/with/roles/permissions", response_model=List[UserWithRoles])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_userswith_roles_permissions(current_user: dict = Depends(get_current_user)):
    pool = get_database()
    return await user_repo.get_users_with_roles_and_permissions(pool)


@router.get("/{user_id}", response_model=User)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_MANAGE_OWN_PROFILE)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = await resolve_url_param_id(pool, TABLE, user_id)
    await check_own_user_or_admin(user_id, current_user, pool)
    user = await user_repo.get_user_with_roles_and_permissions(pool, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"{ENTITY_NAME} not found")
    return user


@router.get("/{user_id}/with/roles/permissions", response_model=UserWithRoles)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_MANAGE_OWN_PROFILE)
async def get_user_with_roles_and_permissions(user_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = await resolve_url_param_id(pool, TABLE, user_id)
    await check_own_user_or_admin(user_id, current_user, pool)
    user = await user_repo.get_user_with_roles_and_permissions(pool, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"{ENTITY_NAME} not found")
    return user


@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_user(user: UserCreate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    validator = EntityValidator(pool)
    await check_unique_field(pool, TABLE, "email", user.email, error_message="Email already registered")
    references = [{"table": "persons", "id": user.person_id, "name": "Person"}] if user.person_id else []
    if user.role_ids:
        await validator.validate_reference_lists([{"table": "roles", "ids": user.role_ids, "name": "Role"}])
    await validator.validate_references(references)
    data = user.model_dump()
    role_ids = data.pop("role_ids", None)
    data.pop("sessions", None)
    data["created_by"] = UUID(current_user["id"])
    data["updated_by"] = UUID(current_user["id"])
    created = await create_document(pool, TABLE, data)
    if role_ids:
        async with pool.acquire() as conn:
            await user_repo.update_user_roles(conn, created["id"], role_ids)
    return created


@router.put("/{user_id}", response_model=User)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_user(user_id: str, user: UserUpdate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = await resolve_url_param_id(pool, TABLE, user_id)
    await check_own_user_or_admin(user_id, current_user, pool)
    validator = EntityValidator(pool)
    existing_user = await check_document_exists(pool, TABLE, user_id, ENTITY_NAME)
    if user.email and user.email != existing_user.get("email"):
        await check_unique_field(
            pool, TABLE, "email", user.email, exclude_id=user_id, error_message="Email already registered"
        )
    references = [{"table": "persons", "id": user.person_id, "name": "Person"}] if user.person_id else []
    await validator.validate_references(references)
    if user.role_ids is not None:
        await validator.validate_reference_lists([{"table": "roles", "ids": user.role_ids, "name": "Role"}])
    data = user.model_dump(exclude_unset=True)
    role_ids = data.pop("role_ids", None)
    data.pop("sessions", None)
    data["updated_by"] = UUID(current_user["id"])
    updated = await update_document(pool, TABLE, user_id, data, ENTITY_NAME)
    if role_ids is not None:
        async with pool.acquire() as conn:
            await user_repo.update_user_roles(conn, user_id, role_ids)
    return updated


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = await resolve_url_param_id(pool, TABLE, user_id)
    await delete_document(pool, TABLE, user_id, ENTITY_NAME)
    return None


@router.post("/{user_id}/magic-link/send")
@require_permission_decorator(PermissionEnum.ADMIN)
async def admin_send_magic_link(user_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = await resolve_url_param_id(pool, TABLE, user_id)
    user = await check_document_exists(pool, TABLE, user_id, ENTITY_NAME)
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            """
            SELECT m.id FROM mails m
            JOIN mails_to mt ON mt.mail_id = m.id
            WHERE mt.user_id = $1
              AND m.mail_type = $2
              AND m.status = 'pending'
              AND m.mail_status = 'not_sent'
            LIMIT 1
            """,
            user["id"],
            "magic-link",
        )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A magic-link mail is already pending for {user['email']}",
        )
    magic_token = create_magic_token(user["email"])
    magic_link = f"{settings.FRONTEND_URL}/auth/verify?token={magic_token}"
    subject = f"Sign in to {settings.APP_NAME}"
    html = magic_link_html(magic_link)
    now = datetime.now(timezone.utc)
    mail = await create_document(
        pool,
        "mails",
        {
            "subject": subject,
            "content_html": html,
            "mail_type": "magic-link",
            "mail_status": "not_sent",
            "planned_at": now,
            "status": "pending",
            "created_by": UUID(current_user["id"]),
            "updated_by": UUID(current_user["id"]),
        },
    )
    await create_document(
        pool,
        "mails_to",
        {
            "mail_id": mail["id"],
            "user_id": user["id"],
        },
    )
    return {"message": "Magic link sent", "email": user["email"]}


@router.get("/{user_id}/magic-link/generate")
@require_permission_decorator(PermissionEnum.ADMIN)
async def admin_generate_magic_link(user_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = await resolve_url_param_id(pool, TABLE, user_id)
    user = await check_document_exists(pool, TABLE, user_id, ENTITY_NAME)
    magic_token = create_magic_token(user["email"])
    magic_link = f"{settings.FRONTEND_URL}/auth/verify?token={magic_token}"
    return {"magic_link": magic_link, "email": user["email"]}
