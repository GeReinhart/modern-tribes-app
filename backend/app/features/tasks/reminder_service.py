from app.features.tasks import reminder_repository
from app.platform.tools.notifications import repository as notification_repo
from app.platform.tools.notifications import service as notification_service


async def set_reminders(pool, entity_type: str, entity_id: str, reminders: list[dict], user_id: str) -> list[dict]:
    old_ids = await reminder_repository.get_active_reminder_ids(pool, entity_type, entity_id)
    for rid in old_ids:
        await notification_repo.archive_by_reminder_id(pool, rid)

    new_reminders = await reminder_repository.set_reminders(pool, entity_type, entity_id, reminders, user_id)

    push_reminders = [r for r in new_reminders if r["reminder_type"] != "mail"]
    if not push_reminders:
        return new_reminders

    title = await reminder_repository.fetch_task_title(pool, entity_type, entity_id)
    users = await reminder_repository.fetch_notifiable_users(pool, entity_type, entity_id)
    if not users:
        return new_reminders

    for reminder in push_reminders:
        message = f'Rappel : "{title}"'
        for user in users:
            try:
                await notification_service.create_planned_for_reminder(
                    pool, str(user["user_id"]), message, str(reminder["id"]), reminder["remind_at"], user_id,
                )
            except Exception:
                pass

    return new_reminders
