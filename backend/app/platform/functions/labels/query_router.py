from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.platform.core.database import get_database
from app.platform.core.authorization.models import PermissionEnum
from app.platform.functions.labels import repository as repo
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator

router = APIRouter(prefix="/labels", tags=["platform_labels"])


class LabelSuggestion(BaseModel):
    id: str
    name: str
    color: str
    feature_instance_id: str


@router.get("/search", response_model=list[LabelSuggestion])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def search_labels(name: str = "", current_user: dict = Depends(get_current_user)):
    if not name.strip():
        return []
    pool = get_database()
    rows = await repo.search_feature_labels(pool, name.strip())
    return [LabelSuggestion(**r) for r in rows]
