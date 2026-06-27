import asyncio
import logging

from app.platform.core.config import settings
from app.platform.core.database import get_database
from app.platform.tools.notifications import repository as notification_repo

logger = logging.getLogger(__name__)


async def notification_archival_scheduler() -> None:
    interval = settings.NOTIFICATION_ARCHIVAL_CRON_INTERVAL_SECONDS
    retention = settings.NOTIFICATION_RETENTION_DAYS
    logger.info(
        "Notification archival scheduler started (interval: %ds, retention: %d days)",
        interval,
        retention,
    )
    while True:
        await asyncio.sleep(interval)
        try:
            pool = get_database()
            archived = await notification_repo.archive_old_notifications(pool, retention)
            if archived:
                logger.info("Archived %d notification(s) older than %d days", archived, retention)
        except Exception:
            logger.exception("Error in notification archival scheduler")
