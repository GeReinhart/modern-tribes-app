import asyncio
import logging

from app.platform.core.config import settings
from app.platform.core.database import get_database
from app.platform.tools.notifications import push_service
from app.platform.tools.notifications import repository as notification_repo
from app.features.tasks import reminder_repository

logger = logging.getLogger(__name__)


async def _notify_users(pool, reminder: dict) -> None:
    reminder_id = str(reminder["id"])
    title = reminder.get("task_title") or ""
    message = f'Rappel : "{title}"'

    planned = await notification_repo.list_planned_by_reminder_id(pool, reminder_id)
    if not planned:
        logger.info("Task reminder %s: no pre-created notifications, skipping", reminder_id)
        return

    for notification in planned:
        try:
            await notification_repo.update_message(pool, str(notification["id"]), message)
            await push_service.send_to_user(
                pool,
                str(notification["target_user_id"]),
                message,
                notification["url_param_id"],
            )
        except Exception:
            logger.exception("Failed to send push for notification %s", notification["id"])


async def _mail_users(pool, reminder: dict) -> None:
    entity_type = reminder["entity_type"]
    entity_id = str(reminder["entity_id"])
    title = reminder.get("task_title") or ""
    subject = f'Rappel : "{title}"'
    content_html = f"<p>Rappel : <strong>{title}</strong>.</p>"

    users = await reminder_repository.fetch_notifiable_users(pool, entity_type, entity_id)
    if not users:
        return

    async with pool.acquire() as conn:
        mail_id = await conn.fetchval(
            """INSERT INTO mails (subject, content_html, planned_at, mail_status, status)
               VALUES ($1, $2, NOW(), 'not_sent', 'pending') RETURNING id""",
            subject, content_html,
        )
        for user in users:
            try:
                await conn.execute(
                    "INSERT INTO mails_to (mail_id, user_id) VALUES ($1, $2)",
                    mail_id, user["user_id"],
                )
            except Exception:
                logger.exception("Failed to queue mail for user %s", user["user_id"])


async def process_due_task_reminders() -> None:
    pool = get_database()
    reminders = await reminder_repository.fetch_due_task_reminders(pool)
    if reminders:
        logger.info("Processing %d due task reminder(s)", len(reminders))
    for reminder in reminders:
        try:
            if reminder["reminder_type"] == "mail":
                await _mail_users(pool, reminder)
            else:
                await _notify_users(pool, reminder)
            await reminder_repository.mark_reminder_sent(pool, str(reminder["id"]))
            logger.info("Task reminder %s processed and marked sent", reminder["id"])
        except Exception:
            logger.exception("Failed to process task reminder %s", reminder["id"])


async def task_reminder_scheduler() -> None:
    interval = settings.EVENT_REMINDER_CRON_INTERVAL_SECONDS
    logger.info("Task reminder scheduler started (interval: %ds)", interval)
    while True:
        try:
            await process_due_task_reminders()
        except Exception:
            logger.exception("Error in task reminder scheduler")
        await asyncio.sleep(interval)
