from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.database import get_database
from app.platform.authorization.models import PermissionEnum
from app.models.crud.projects import Project, ProjectCreate, ProjectUpdate
from app.platform.authentication.router import get_current_user
from app.platform.authorization.router import require_permission_decorator
from app.utils.db_helpers import (
    check_document_exists,
    create_document,
    delete_document,
    get_all_documents,
    get_document_by_id,
    resolve_url_param_id,
    update_document,
)
from app.utils.validators import EntityValidator

router = APIRouter(prefix="/projects", tags=["crud_projects"])

TABLE = "projects"
ENTITY_NAME = "Project"


@router.get("/", response_model=List[Project])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_projects(current_user: dict = Depends(get_current_user)):
    """Get all projects"""
    pool = get_database()
    return await get_all_documents(pool, TABLE, any_status=True)


@router.get("/{project_id}", response_model=Project)
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific project by ID"""
    pool = get_database()
    project_id = await resolve_url_param_id(pool, TABLE, project_id)
    return await get_document_by_id(pool, TABLE, project_id, ENTITY_NAME)


@router.post("/", response_model=Project, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    """Create a new project"""
    pool = get_database()
    validator = EntityValidator(pool)

    # Validate references
    references = [{"table": "documents", "id": project.document_id, "name": "Document"}]

    # Create project
    project_dict = project.model_dump()
    project_dict["created_by"] = UUID(current_user["id"])
    project_dict["updated_by"] = UUID(current_user["id"])
    return await create_document(pool, TABLE, project_dict)


@router.put("/{project_id}", response_model=Project)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_project(
    project_id: str, project: ProjectUpdate, current_user: dict = Depends(get_current_user)
):
    """Update an existing project"""
    pool = get_database()
    project_id = await resolve_url_param_id(pool, TABLE, project_id)
    validator = EntityValidator(pool)

    # Check if project exists
    await check_document_exists(pool, TABLE, project_id, ENTITY_NAME)

    # Validate references
    references = []

    if project.document_id:
        references.append({"table": "documents", "id": project.document_id, "name": "Document"})

    # Update project
    project_dict = project.model_dump(exclude_unset=True)
    project_dict["updated_by"] = UUID(current_user["id"])
    return await update_document(pool, TABLE, project_id, project_dict, ENTITY_NAME)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a project"""
    pool = get_database()
    project_id = await resolve_url_param_id(pool, TABLE, project_id)
    await delete_document(pool, TABLE, project_id, ENTITY_NAME)
    return None
