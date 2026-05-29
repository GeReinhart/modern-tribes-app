from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status

from app.platform.core.database import get_database
from app.features.tribes_projects.projects.document_models import (
    ProjectDocumentCreate,
    ProjectDocumentLabel,
    ProjectDocumentResponse,
    ProjectDocumentSummary,
    ProjectDocumentUpdate,
)
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.features.tribes_projects.projects import document_service as project_document_service
from app.platform.functions.publications import service as publication_service
from app.platform.core.utils.db_helpers import resolve_url_param_id
from app.platform.core.authorization.project_access import check_project_access_or_admin

router = APIRouter(prefix="/project-documents", tags=["app_project_documents"])


@router.get("/projects/{project_id}/documents", response_model=List[ProjectDocumentSummary])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_project_documents(
    project_id: str,
    q: Optional[str] = Query(None),
    label_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="guest")
    return await project_document_service.list_project_documents(
        project_id, pool, search_query=q, label_id=label_id
    )


@router.post(
    "/projects/{project_id}/documents",
    response_model=ProjectDocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_project_document(
    project_id: str,
    data: ProjectDocumentCreate,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="member")
    return await project_document_service.create_project_document(project_id, data, pool, current_user)


@router.get("/projects/{project_id}/documents/{project_document_id}", response_model=ProjectDocumentResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_project_document(
    project_id: str,
    project_document_id: str,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    project_document_id = await resolve_url_param_id(pool, "projects_documents", project_document_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="guest")
    return await project_document_service.get_project_document(project_id, project_document_id, pool)


@router.put("/projects/{project_id}/documents/{project_document_id}", response_model=ProjectDocumentResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_project_document(
    project_id: str,
    project_document_id: str,
    data: ProjectDocumentUpdate,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    project_document_id = await resolve_url_param_id(pool, "projects_documents", project_document_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="member")
    return await project_document_service.update_project_document(
        project_id, project_document_id, data, pool, current_user
    )


@router.patch(
    "/projects/{project_id}/documents/{project_document_id}/archive",
    status_code=status.HTTP_204_NO_CONTENT,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def archive_project_document(
    project_id: str,
    project_document_id: str,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    project_document_id = await resolve_url_param_id(pool, "projects_documents", project_document_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="manager")
    await project_document_service.archive_project_document(
        project_id, project_document_id, pool, current_user
    )
    return None


@router.patch(
    "/projects/{project_id}/documents/{project_document_id}/publish",
    status_code=status.HTTP_200_OK,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def publish_project_document(
    project_id: str,
    project_document_id: str,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    project_document_id = await resolve_url_param_id(pool, "projects_documents", project_document_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="manager")
    return await publication_service.publish_document(project_id, project_document_id, pool, current_user)


@router.patch(
    "/projects/{project_id}/documents/{project_document_id}/unpublish",
    status_code=status.HTTP_204_NO_CONTENT,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def unpublish_project_document(
    project_id: str,
    project_document_id: str,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    project_document_id = await resolve_url_param_id(pool, "projects_documents", project_document_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="manager")
    await publication_service.unpublish_document(project_id, project_document_id, pool, current_user)
    return None


@router.get("/projects/{project_id}/document-labels", response_model=List[ProjectDocumentLabel])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_project_document_labels(
    project_id: str,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="guest")
    return await project_document_service.get_project_document_labels(project_id, pool)
