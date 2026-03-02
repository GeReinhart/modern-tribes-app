from fastapi import APIRouter, status, Depends
from typing import List
from uuid import UUID

from ..auth.authentification import get_current_user
from ...models.crud.projects import Project, ProjectCreate, ProjectUpdate
from ...core.database import get_database
from ...utils.db_helpers import (
    get_all_documents,
    get_document_by_id,
    create_document,
    update_document,
    delete_document,
    check_document_exists
)
from ...utils.validators import EntityValidator
from ...models.auth.auth import PermissionEnum
from ...routers.auth.authorization import (
    require_permission_decorator
)

router = APIRouter(prefix="/projects", tags=["crud_projects"])

TABLE = "projects"
ENTITY_NAME = "Project"


@router.get("/", response_model=List[Project])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_projects(current_user: dict = Depends(get_current_user)):
    """Get all projects"""
    pool = get_database()
    return await get_all_documents(pool, TABLE)


@router.get("/{project_id}", response_model=Project)
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_project(project_id: str,current_user: dict = Depends(get_current_user)):
    """Get a specific project by ID"""
    pool = get_database()
    return await get_document_by_id(pool, TABLE, project_id, ENTITY_NAME)


@router.post("/", response_model=Project, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_project(project: ProjectCreate,current_user: dict = Depends(get_current_user)):
    """Create a new project"""
    pool = get_database()
    validator = EntityValidator(pool)

    # Validate references
    references = [
        {
            'table': 'documents',
            'id': project.document_id,
            'name': 'Document'
        }
    ]

    # Create project
    project_dict = project.model_dump()
    return await create_document(pool, TABLE, project_dict)


@router.put("/{project_id}", response_model=Project)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_project(project_id: str, project: ProjectUpdate,current_user: dict = Depends(get_current_user)):
    """Update an existing project"""
    pool = get_database()
    validator = EntityValidator(pool)

    # Check if project exists
    await check_document_exists(pool, TABLE, project_id, ENTITY_NAME)

    # Validate references
    references = []

    if project.document_id:
        references.append({
            'table': 'documents',
            'id': project.document_id,
            'name': 'Document'
        })

    # Update project
    project_dict = project.model_dump(exclude_unset=True)
    return await update_document(pool, TABLE, project_id, project_dict, ENTITY_NAME)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_project(project_id: str,current_user: dict = Depends(get_current_user)):
    """Delete a project"""
    pool = get_database()
    await delete_document(pool, TABLE, project_id, ENTITY_NAME)
    return None