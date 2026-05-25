from typing import List

from fastapi import APIRouter, Depends

from app.core.database import get_database
from app.models.crud.app_config import AppConfigPublic
from app.routers.auth.authentification import get_current_user
from app.utils.db_helpers import get_all_documents

router = APIRouter(prefix="/app-config", tags=["query_app_config"])


@router.get("/", response_model=List[AppConfigPublic])
async def get_public_config(current_user: dict = Depends(get_current_user)):
    pool = get_database()
    rows = await get_all_documents(pool, "app_config")
    return [AppConfigPublic(key=r["key"], value=r["value"]) for r in rows]
