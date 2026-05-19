from fastapi import APIRouter, status, Depends
from uuid import UUID

from ..auth.authentification import get_current_user
from ..auth.authorization import require_any_permission_decorator
from ...models.auth.auth import PermissionEnum
from ...models.app.project_with_document import (
    ProjectWithDocumentCreate, ProjectWithDocumentUpdate, ProjectWithDocumentResponse,
)
from ...core.database import get_database
from ...services import project_service
from ...utils.ownership import check_own_tribe_position_or_admin

router = APIRouter(prefix="/projects", tags=["app_projects"])


@router.post("/with-document", response_model=ProjectWithDocumentResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_project_with_document(
    data: ProjectWithDocumentCreate, current_user: dict = Depends(get_current_user)
):
    pool = get_database()
    await check_own_tribe_position_or_admin(data.tribe_id, current_user, pool, required_position="manager")
    return await project_service.create_project_with_document(data, pool, current_user)


@router.get("/{project_id}/with-document", response_model=ProjectWithDocumentResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_project_with_document(project_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    return await project_service.get_project_with_document(project_id, pool)


@router.put("/{project_id}/with-document", response_model=ProjectWithDocumentResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_project_with_document(
    project_id: str, data: ProjectWithDocumentUpdate, current_user: dict = Depends(get_current_user)
):
    pool = get_database()
    # Verify the user is a manager of at least one tribe linked to this project
    async with pool.acquire() as conn:
        tribe_row = await conn.fetchrow(
            "SELECT tribe_id FROM tribes_projects WHERE project_id = $1 LIMIT 1",
            UUID(project_id)
        )
    if tribe_row:
        await check_own_tribe_position_or_admin(str(tribe_row["tribe_id"]), current_user, pool, required_position="manager")
    return await project_service.update_project_with_document(project_id, data, pool, current_user)
