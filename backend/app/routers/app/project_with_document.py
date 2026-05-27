from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.database import get_database
from app.models.app.project_with_document import (
    ProjectTribeWithMembersResponse,
    ProjectWithDocumentCreate,
    ProjectWithDocumentResponse,
    ProjectWithDocumentUpdate,
)
from app.platform.authorization.models import PermissionEnum
from app.platform.authentication.router import get_current_user
from app.platform.authorization.router import require_any_permission_decorator
from app.services import project_service
from app.utils.db_helpers import resolve_url_param_id
from app.platform.authorization.ownership import check_own_tribe_position_or_admin
from app.platform.authorization.project_access import check_project_access_or_admin

router = APIRouter(prefix="/projects", tags=["app_projects"])


@router.post(
    "/with-document", response_model=ProjectWithDocumentResponse, status_code=status.HTTP_201_CREATED
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_project_with_document(
    data: ProjectWithDocumentCreate, current_user: dict = Depends(get_current_user)
):
    pool = get_database()
    await check_own_tribe_position_or_admin(data.tribe_id, current_user, pool, required_position="manager")
    resolved_tribe_id = await resolve_url_param_id(pool, "tribes", data.tribe_id)
    data = data.model_copy(update={"tribe_id": resolved_tribe_id})
    return await project_service.create_project_with_document(data, pool, current_user)


@router.get("/{project_id}/with-document", response_model=ProjectWithDocumentResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_project_with_document(project_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    return await project_service.get_project_with_document(project_id, pool)


@router.put("/{project_id}/with-document", response_model=ProjectWithDocumentResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_project_with_document(
    project_id: str, data: ProjectWithDocumentUpdate, current_user: dict = Depends(get_current_user)
):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    # Verify the user is a manager of at least one tribe linked to this project
    async with pool.acquire() as conn:
        tribe_row = await conn.fetchrow(
            "SELECT tribe_id FROM tribes_projects WHERE project_id = $1 LIMIT 1", UUID(project_id)
        )
    if tribe_row:
        await check_own_tribe_position_or_admin(
            str(tribe_row["tribe_id"]), current_user, pool, required_position="manager"
        )
    return await project_service.update_project_with_document(project_id, data, pool, current_user)


@router.get("/{project_id}/tribes-with-members", response_model=List[ProjectTribeWithMembersResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_project_tribes_with_members(project_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool)
    return await project_service.get_project_tribes_with_members(project_id, pool)
