from fastapi import APIRouter, Depends

from app.platform.core.database import get_database
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.features.glue.dashboard_directory.models import DashboardDirectoryResponse
from app.features.glue.dashboard_directory import service

router = APIRouter(prefix="/dashboard-directory", tags=["features_glue_dashboard_directory"])


@router.get("", response_model=DashboardDirectoryResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_dashboard_directory(current_user: dict = Depends(get_current_user)):
    """Get the current user's accessible projects, task boards and event calendars with activity counts.

    **Permissions:** admin | can_access_attached_tribes
    """
    pool = get_database()
    return await service.get_dashboard_directory(current_user["id"], pool)
