import asyncio
import logging

from app.platform.core.config import settings
from app.platform.core.database import get_database
from app.platform.tools.notifications import service as notification_service
from app.features.events import repository as event_repository

logger = logging.getLogger(__name__)

async def _notify_participants(pool, reminder: dict) -> None:
    event_id = str(reminder["event_id"])
    title = reminder["event_title"]
    start_at = reminder["event_start_at"]
    start_str = start_at.strftime("%d/%m %H:%M") if start_at else ""
    message = f'Reminder: "{title}" starts at {start_str}'

    users = await event_repository.fetch_participant_users(pool, event_id)
    for user in users:
        try:
            await notification_service.create_for_user(
                pool, str(user["user_id"]), message, None
            )
        except Exception:
            logger.exception("Failed to send reminder notification to user %s", user["user_id"])


async def _mail_participants(pool, reminder: dict) -> None:
    event_id = str(reminder["event_id"])
    title = reminder["event_title"]
    start_at = reminder["event_start_at"]
    start_str = start_at.strftime("%d/%m/%Y %H:%M") if start_at else ""
    subject = f'Reminder: "{title}"'
    content_html = f"<p>This is a reminder that <strong>{title}</strong> is scheduled for {start_str}.</p>"

    users = await event_repository.fetch_participant_users(pool, event_id)
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


async def process_due_reminders() -> None:
    pool = get_database()
    reminders = await event_repository.fetch_due_reminders(pool)
    for reminder in reminders:
        try:
            if reminder["reminder_type"] == "mail":
                await _mail_participants(pool, reminder)
            else:
                await _notify_participants(pool, reminder)
            await event_repository.mark_reminder_sent(pool, str(reminder["id"]))
        except Exception:
            logger.exception("Failed to process reminder %s", reminder["id"])


async def event_reminder_scheduler() -> None:
    interval = settings.EVENT_REMINDER_CRON_INTERVAL_SECONDS
    logger.info("Event reminder scheduler started (interval: %ds)", interval)
    while True:
        await asyncio.sleep(interval)
        try:
            await process_due_reminders()
        except Exception:
            logger.exception("Error in event reminder scheduler")
