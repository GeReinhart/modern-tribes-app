from typing import List

from fastapi import APIRouter, Depends

from app.platform.core.database import get_database
from app.platform.core.app_config.models import AppConfigPublic
from app.platform.core.authentication.router import get_current_user
from app.platform.core.utils.db_helpers import get_all_documents

router = APIRouter(prefix="/app-config", tags=["platform_core"])


@router.get("/", response_model=List[AppConfigPublic])
async def get_public_config(current_user: dict = Depends(get_current_user)):
    pool = get_database()
    rows = await get_all_documents(pool, "app_config")
    return [AppConfigPublic(key=r["key"], value=r["value"]) for r in rows]
