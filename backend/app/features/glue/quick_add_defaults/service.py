from fastapi import HTTPException

from app.features.glue.quick_add_defaults.models import (
    QuickAddDefaultEntry,
    QuickAddDefaultsResponse,
    QuickAddDefaultUpdate,
)
from app.features.glue.quick_add_defaults import repository

_ALLOWED_FEATURE_TYPES = {
    "task": ("kanban", "todo_list"),
    "event": ("events",),
}


async def _build_entry(user_id: str, quick_add_type: str, pool) -> QuickAddDefaultEntry:
    configured = await repository.get_configured_instance(pool, user_id, quick_add_type)
    return QuickAddDefaultEntry(feature_instance_id=configured)


async def get_quick_add_defaults(user_id: str, pool) -> QuickAddDefaultsResponse:
    return QuickAddDefaultsResponse(
        task=await _build_entry(user_id, "task", pool),
        event=await _build_entry(user_id, "event", pool),
    )


async def set_quick_add_default(
    user_id: str, quick_add_type: str, data: QuickAddDefaultUpdate, pool, current_user: dict
) -> QuickAddDefaultEntry:
    if quick_add_type not in _ALLOWED_FEATURE_TYPES:
        raise HTTPException(status_code=404, detail="Unknown quick-add type")

    if data.feature_instance_id is not None:
        instance = await repository.get_feature_instance(pool, data.feature_instance_id)
        if instance is None or instance["status"] != "active":
            raise HTTPException(status_code=404, detail="Feature instance not found")
        if instance["feature_type"] not in _ALLOWED_FEATURE_TYPES[quick_add_type]:
            raise HTTPException(
                status_code=400,
                detail=f"Feature instance is not compatible with quick-add type '{quick_add_type}'",
            )

    await repository.upsert_configured_instance(
        pool, user_id, quick_add_type, data.feature_instance_id, current_user["id"]
    )
    return await _build_entry(user_id, quick_add_type, pool)
