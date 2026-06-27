from app.features.events import repository as event_repository
from app.features.events.reminder_scheduler import _format_event_start
from app.platform.tools.notifications import repository as notification_repo
from app.platform.tools.notifications import service as notification_service


async def set_reminders(pool, event_id: str, reminders: list[dict], user_id: str) -> list[dict]:
    old_reminder_ids = await event_repository.get_active_reminder_ids(pool, event_id)

    for rid in old_reminder_ids:
        await notification_repo.archive_by_reminder_id(pool, rid)

    new_reminders = await event_repository.set_reminders(pool, event_id, reminders, user_id)

    push_reminders = [r for r in new_reminders if r["reminder_type"] != "mail"]
    if not push_reminders:
        return new_reminders

    event = await event_repository.fetch_event(pool, event_id)
    if not event:
        return new_reminders

    participants = await event_repository.fetch_participant_users(pool, event_id)
    user_ids = {str(u["user_id"]) for u in participants}
    if event.get("created_by"):
        user_ids.add(str(event["created_by"]))

    for reminder in push_reminders:
        message = f'Rappel : "{event["title"]}" commence {_format_event_start(event.get("start_at"))}'
        for uid in user_ids:
            try:
                await notification_service.create_planned_for_reminder(
                    pool, uid, message, str(reminder["id"]), reminder["remind_at"], user_id,
                )
            except Exception:
                pass

    return new_reminders
