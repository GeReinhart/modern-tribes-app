from typing import Optional

from fastapi import APIRouter, Depends

from app.platform.core.database import get_database
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.features.tasks.my_tasks import repository as repo
from app.features.tasks.my_tasks.models import MyTasksResponse, to_kanban, to_todo

router = APIRouter(prefix="/my-tasks", tags=["features_tasks_my_tasks"])


@router.get("", response_model=MyTasksResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_my_tasks(
    tribe_id: Optional[str] = None,
    project_id: Optional[str] = None,
    person_id: Optional[str] = None,
    label_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """Get tasks assigned to the current user across all accessible projects.

    **Permissions:** admin | can_access_own_tribes
    """
    pool = get_database()
    user_id = current_user["id"]
    filters = {
        k: v
        for k, v in {
            "tribe_id": tribe_id,
            "project_id": project_id,
            "person_id": person_id,
            "label_id": label_id,
        }.items()
        if v is not None
    }
    kanban_rows = await repo.fetch_my_tasks_kanban(pool, user_id, filters)
    todo_rows = await repo.fetch_my_tasks_todo(pool, user_id, filters)
    return MyTasksResponse(
        kanban=[to_kanban(r) for r in kanban_rows],
        todo=[to_todo(r) for r in todo_rows],
    )
