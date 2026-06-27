import asyncio
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.platform.core.config import settings
from app.platform.core.database import get_database
from app.platform.tools.notifications import push_service
from app.platform.tools.notifications import repository as notification_repo
from app.features.events import repository as event_repository

logger = logging.getLogger(__name__)

_TZ_PARIS = ZoneInfo("Europe/Paris")
_DAY_NAMES_FR = ("Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche")


def _format_event_start(start_at: datetime | None) -> str:
    if start_at is None:
        return ""
    local_dt = start_at.astimezone(_TZ_PARIS) if start_at.tzinfo else start_at
    today = datetime.now(_TZ_PARIS).date()
    event_date = local_dt.date()
    time_str = local_dt.strftime("%Hh%M")
    if event_date == today:
        return f"Aujourd'hui à {time_str}"
    if event_date == today + timedelta(days=1):
        return f"Demain à {time_str}"
    day_name = _DAY_NAMES_FR[event_date.weekday()]
    return f"{day_name} {event_date.strftime('%d/%m/%Y')} à {time_str}"


async def _notify_participants(pool, reminder: dict) -> None:
    reminder_id = str(reminder["id"])
    message = f'Rappel : "{reminder["event_title"]}" commence {_format_event_start(reminder["event_start_at"])}'

    planned = await notification_repo.list_planned_by_reminder_id(pool, reminder_id)
    if not planned:
        logger.info("Reminder %s: no pre-created notifications found, skipping", reminder_id)
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


async def _mail_participants(pool, reminder: dict) -> None:
    event_id = str(reminder["event_id"])
    title = reminder["event_title"]
    start_at = reminder["event_start_at"]
    date_str = _format_event_start(start_at)
    subject = f'Rappel : "{title}"'
    content_html = f"<p>Rappel : <strong>{title}</strong> commence {date_str}.</p>"

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
    if reminders:
        logger.info("Processing %d due reminder(s)", len(reminders))
    for reminder in reminders:
        try:
            if reminder["reminder_type"] == "mail":
                await _mail_participants(pool, reminder)
            else:
                await _notify_participants(pool, reminder)
            await event_repository.mark_reminder_sent(pool, str(reminder["id"]))
            logger.info("Reminder %s processed and marked sent", reminder["id"])
        except Exception:
            logger.exception("Failed to process reminder %s", reminder["id"])


async def event_reminder_scheduler() -> None:
    interval = settings.EVENT_REMINDER_CRON_INTERVAL_SECONDS
    logger.info("Event reminder scheduler started (interval: %ds)", interval)
    while True:
        try:
            await process_due_reminders()
        except Exception:
            logger.exception("Error in event reminder scheduler")
        await asyncio.sleep(interval)
