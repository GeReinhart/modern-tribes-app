from typing import List

from fastapi import APIRouter, Depends, status

from app.platform.core.database import get_database
from app.platform.functions.documents.page_models import (
    DocumentPageCreate,
    DocumentPageResponse,
    DocumentPageUpdate,
    PageReorderRequest,
)
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.functions.documents import page_service as document_page_service
from app.platform.core.utils.db_helpers import resolve_url_param_id
from app.platform.core.authorization.project_access import check_project_access_or_admin

router = APIRouter(prefix="/pages", tags=["platform_documents"])


@router.get(
    "/projects/{project_id}/documents/{project_document_id}/pages",
    response_model=List[DocumentPageResponse],
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_pages(
    project_id: str,
    project_document_id: str,
    current_user: dict = Depends(get_current_user),
):
    """List all pages for a project document.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ guest
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    project_document_id = await resolve_url_param_id(pool, "projects_documents", project_document_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="guest")
    return await document_page_service.list_pages(project_id, project_document_id, pool)


@router.post(
    "/projects/{project_id}/documents/{project_document_id}/pages",
    response_model=DocumentPageResponse,
    status_code=status.HTTP_201_CREATED,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_page(
    project_id: str,
    project_document_id: str,
    data: DocumentPageCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new page in a project document.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    project_document_id = await resolve_url_param_id(pool, "projects_documents", project_document_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="member")
    return await document_page_service.create_page(project_id, project_document_id, data, pool, current_user)


@router.patch(
    "/projects/{project_id}/documents/{project_document_id}/pages/reorder",
    status_code=status.HTTP_204_NO_CONTENT,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def reorder_pages(
    project_id: str,
    project_document_id: str,
    data: PageReorderRequest,
    current_user: dict = Depends(get_current_user),
):
    """Reorder pages within a project document.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    project_document_id = await resolve_url_param_id(pool, "projects_documents", project_document_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="member")
    await document_page_service.reorder_pages(project_id, project_document_id, data.items, pool, current_user)
    return None


@router.get(
    "/projects/{project_id}/documents/{project_document_id}/pages/{page_id}",
    response_model=DocumentPageResponse,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_page(
    project_id: str,
    project_document_id: str,
    page_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get a specific page from a project document.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ guest
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    project_document_id = await resolve_url_param_id(pool, "projects_documents", project_document_id)
    page_id = await resolve_url_param_id(pool, "document_pages", page_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="guest")
    return await document_page_service.get_page(project_id, project_document_id, page_id, pool)


@router.put(
    "/projects/{project_id}/documents/{project_document_id}/pages/{page_id}",
    response_model=DocumentPageResponse,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_page(
    project_id: str,
    project_document_id: str,
    page_id: str,
    data: DocumentPageUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a page in a project document.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    project_document_id = await resolve_url_param_id(pool, "projects_documents", project_document_id)
    page_id = await resolve_url_param_id(pool, "document_pages", page_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="member")
    return await document_page_service.update_page(
        project_id, project_document_id, page_id, data, pool, current_user
    )


@router.patch(
    "/projects/{project_id}/documents/{project_document_id}/pages/{page_id}/archive",
    status_code=status.HTTP_204_NO_CONTENT,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def archive_page(
    project_id: str,
    project_document_id: str,
    page_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Archive a page in a project document.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    project_document_id = await resolve_url_param_id(pool, "projects_documents", project_document_id)
    page_id = await resolve_url_param_id(pool, "document_pages", page_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="manager")
    await document_page_service.archive_page(project_id, project_document_id, page_id, pool, current_user)
    return None
