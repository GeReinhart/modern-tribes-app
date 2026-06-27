from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.platform.functions.labels import repository as labels_repo
from app.features.events import repository as event_repository
from app.features.events import service as event_service
from app.features.events.label_service import (
    require_feature_access,
    list_persons_for_feature,
    list_feature_labels,
    create_feature_label,
    update_feature_label,
    delete_feature_label,
)
from app.features.tasks.models import PersonOption, FeatureLabel, FeatureLabelCreate, FeatureLabelUpdate
from app.platform.core.authorization.permissions import get_user_permissions
from app.features.events.models import (
    EventCreate, EventUpdate, EventReminderCreate, EventReminderResponse, EventResponse,
    PlanningEventResponse, PlanningEventLabel,
)

router = APIRouter(prefix="/events", tags=["features_events"])
label_router = APIRouter(prefix="/event-labels", tags=["features_events"])


def _row_to_event(row: dict) -> EventResponse:
    from app.features.events.models import EventParticipantInfo
    return EventResponse(
        id=str(row["id"]),
        feature_instance_id=str(row["feature_instance_id"]),
        title=row["title"],
        start_at=row["start_at"],
        end_at=row["end_at"],
        all_day=row["all_day"],
        document_id=str(row["document_id"]) if row.get("document_id") else None,
        document_content_html=row.get("document_content_html"),
        size=row.get("size"),
        force_on_dashboard=row.get("force_on_dashboard", False) or False,
        status=row["status"],
        participant_ids=list(row.get("participant_ids") or []),
        participants=[EventParticipantInfo(**p) for p in (row.get("participants") or [])],
        label_ids=list(row.get("label_ids") or []),
        reminders=[EventReminderResponse(**r) for r in (row.get("reminders") or [])],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        created_by=str(row["created_by"]) if row.get("created_by") else None,
        updated_by=str(row["updated_by"]) if row.get("updated_by") else None,
    )


def _row_to_planning_event(row: dict) -> PlanningEventResponse:
    base = _row_to_event(row)
    return PlanningEventResponse(
        **base.model_dump(),
        feature_instance_name=row["feature_instance_name"],
        project_id=str(row["project_id"]),
        project_url_param_id=row.get("project_url_param_id"),
        project_name=row["project_name"],
        labels=[PlanningEventLabel(**lb) for lb in (row.get("labels") or [])],
    )


@router.get("/accessible", response_model=list[PlanningEventResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_accessible_events(current_user: dict = Depends(get_current_user)):
    """List all events the current user can access across all projects."""
    pool = get_database()
    user_id = str(current_user["id"])
    user_perms = await get_user_permissions(pool, user_id)
    if PermissionEnum.ADMIN in user_perms:
        rows = await event_repository.fetch_all_events_with_project(pool)
    else:
        rows = await event_repository.fetch_accessible_events(pool, user_id)
    return [_row_to_planning_event(r) for r in rows]


@router.get("/by-instance/{feature_instance_id}", response_model=list[EventResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_events(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List all events for a feature instance."""
    pool = get_database()
    await require_feature_access(pool, feature_instance_id, current_user, "guest")
    rows = await event_repository.fetch_events(pool, feature_instance_id)
    return [_row_to_event(r) for r in rows]


@router.get("/persons/{feature_instance_id}", response_model=list[PersonOption])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_persons(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List persons available as participants for an events feature instance."""
    return await list_persons_for_feature(get_database(), feature_instance_id, current_user)


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_event(data: EventCreate, current_user: dict = Depends(get_current_user)):
    """Create a new event."""
    pool = get_database()
    user_id = str(current_user["id"])
    await require_feature_access(pool, data.feature_instance_id, current_user, "member")
    row = await event_repository.insert_event(
        pool, data.feature_instance_id, data.title, data.start_at, data.end_at, data.all_day, user_id, data.force_on_dashboard,
    )
    event_id = str(row["id"])
    if data.document_content_html:
        await event_repository.upsert_document(pool, event_id, data.document_content_html, user_id)
    if data.size is not None:
        await event_repository.update_event_size(pool, event_id, data.size, False, user_id)
    full = await event_repository.fetch_event(pool, event_id)
    return _row_to_event(full)


@router.patch("/{event_id}", response_model=EventResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_event(event_id: str, data: EventUpdate, current_user: dict = Depends(get_current_user)):
    """Update an event's fields."""
    pool = get_database()
    user_id = str(current_user["id"])
    async with pool.acquire() as conn:
        ev = await conn.fetchrow("SELECT feature_instance_id FROM events WHERE id = $1", UUID(event_id))
    if not ev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    await require_feature_access(pool, str(ev["feature_instance_id"]), current_user, "member")

    basic: dict = {}
    if data.title is not None:
        basic["title"] = data.title
    if data.start_at is not None:
        basic["start_at"] = data.start_at
    if data.end_at is not None:
        basic["end_at"] = data.end_at
    if data.all_day is not None:
        basic["all_day"] = data.all_day
    if data.force_on_dashboard is not None:
        basic["force_on_dashboard"] = data.force_on_dashboard
    await event_repository.update_event_basic(pool, event_id, basic, user_id)

    if data.size is not None or data.clear_size:
        await event_repository.update_event_size(pool, event_id, data.size, data.clear_size, user_id)

    if data.document_content_html is not None:
        await event_repository.upsert_document(pool, event_id, data.document_content_html, user_id)

    full = await event_repository.fetch_event(pool, event_id)
    return _row_to_event(full)


@router.post("/{event_id}/participants", response_model=list[str])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def set_participants(
    event_id: str, person_ids: list[str], current_user: dict = Depends(get_current_user)
):
    """Replace the participant list for an event."""
    pool = get_database()
    user_id = str(current_user["id"])
    async with pool.acquire() as conn:
        ev = await conn.fetchrow("SELECT feature_instance_id FROM events WHERE id = $1", UUID(event_id))
    if not ev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    await require_feature_access(pool, str(ev["feature_instance_id"]), current_user, "member")
    await event_repository.set_participants(pool, event_id, person_ids, user_id)
    return person_ids


@router.post("/{event_id}/reminders", response_model=list[EventReminderResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def set_reminders(
    event_id: str, reminders: list[EventReminderCreate], current_user: dict = Depends(get_current_user)
):
    """Replace the reminder list for an event."""
    pool = get_database()
    user_id = str(current_user["id"])
    async with pool.acquire() as conn:
        ev = await conn.fetchrow("SELECT feature_instance_id FROM events WHERE id = $1", UUID(event_id))
    if not ev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    await require_feature_access(pool, str(ev["feature_instance_id"]), current_user, "member")
    reminder_dicts = [{"remind_at": r.remind_at, "reminder_type": r.reminder_type} for r in reminders]
    await event_service.set_reminders(pool, event_id, reminder_dicts, user_id)
    full = await event_repository.fetch_event(pool, event_id)
    return full["reminders"] if full else []


@router.post("/{event_id}/labels/{label_id}", response_model=list[str])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def toggle_label(event_id: str, label_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle a label on an event."""
    pool = get_database()
    async with pool.acquire() as conn:
        ev = await conn.fetchrow("SELECT feature_instance_id FROM events WHERE id = $1", UUID(event_id))
    if not ev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    await require_feature_access(pool, str(ev["feature_instance_id"]), current_user, "member")
    return await labels_repo.toggle_entity_label(pool, event_id, 'event', label_id)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an event."""
    pool = get_database()
    async with pool.acquire() as conn:
        ev = await conn.fetchrow("SELECT feature_instance_id FROM events WHERE id = $1", UUID(event_id))
    if not ev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found.")
    await require_feature_access(pool, str(ev["feature_instance_id"]), current_user, "member")
    await event_repository.delete_event(pool, event_id)


# --- Label endpoints ---

@label_router.get("/by-instance/{feature_instance_id}", response_model=list[FeatureLabel])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_labels(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List labels for an events feature instance."""
    return await list_feature_labels(get_database(), feature_instance_id, current_user)


@label_router.post("/", response_model=FeatureLabel, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_label(data: FeatureLabelCreate, current_user: dict = Depends(get_current_user)):
    """Create a label for an events feature instance."""
    return await create_feature_label(get_database(), data, current_user)


@label_router.patch("/{label_id}", response_model=FeatureLabel)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_label(label_id: str, data: FeatureLabelUpdate, current_user: dict = Depends(get_current_user)):
    """Update an event label."""
    return await update_feature_label(get_database(), label_id, data, current_user)


@label_router.delete("/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_label(label_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an event label."""
    await delete_feature_label(get_database(), label_id, current_user)
