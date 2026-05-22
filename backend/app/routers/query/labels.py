from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..auth.authentification import get_current_user
from ..auth.authorization import require_any_permission_decorator
from ...models.auth.auth import PermissionEnum
from ...core.database import get_database
from ...repositories import feature_labels_repository as repo

router = APIRouter(prefix="/labels", tags=["query_labels"])


class LabelSuggestion(BaseModel):
    id: str
    name: str
    color: str
    feature_instance_id: str


@router.get("/search", response_model=list[LabelSuggestion])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def search_labels(name: str = '', current_user: dict = Depends(get_current_user)):
    if not name.strip():
        return []
    pool = get_database()
    rows = await repo.search_feature_labels(pool, name.strip())
    return [LabelSuggestion(**r) for r in rows]
