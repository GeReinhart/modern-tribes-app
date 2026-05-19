from fastapi import APIRouter, status, Depends
from typing import List
from uuid import UUID

from ..auth.authentification import get_current_user
from ...models.crud.app_config import AppConfig, AppConfigCreate, AppConfigUpdate
from ...core.database import get_database
from ...utils.db_helpers import (
    get_all_documents,
    get_document_by_id,
    create_document,
    update_document,
    delete_document,
    check_document_exists,
    check_unique_field,
)
from ...models.auth.auth import PermissionEnum
from ...routers.auth.authorization import require_permission_decorator

router = APIRouter(prefix="/app-config", tags=["crud_app_config"])

TABLE = "app_config"
ENTITY_NAME = "AppConfig"


@router.get("/", response_model=List[AppConfig])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_all_config(current_user: dict = Depends(get_current_user)):
    pool = get_database()
    return await get_all_documents(pool, TABLE)


@router.post("/", response_model=AppConfig, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_config(entry: AppConfigCreate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await check_unique_field(pool, TABLE, "key", entry.key, error_message="Configuration key already exists")
    data = entry.model_dump()
    data["updated_by"] = UUID(current_user["id"])
    return await create_document(pool, TABLE, data)


@router.put("/{config_id}", response_model=AppConfig)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_config(config_id: str, entry: AppConfigUpdate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await check_document_exists(pool, TABLE, config_id, ENTITY_NAME)
    data = entry.model_dump(exclude_unset=True)
    data["updated_by"] = UUID(current_user["id"])
    return await update_document(pool, TABLE, config_id, data, ENTITY_NAME)


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_config(config_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await delete_document(pool, TABLE, config_id, ENTITY_NAME)
    return None
