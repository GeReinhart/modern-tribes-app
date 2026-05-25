import asyncio
import logging

from app.core.config import settings
from app.core.database import get_database
from app.core.email import send_email

logger = logging.getLogger(__name__)


async def process_pending_mails() -> None:
    pool = get_database()
    async with pool.acquire() as conn:
        mails = await conn.fetch("""
            SELECT id, subject, content_html
            FROM mails
            WHERE status = 'pending'
              AND mail_status = 'not_sent'
              AND planned_at <= NOW()
        """)

        for mail in mails:
            try:
                recipients = await conn.fetch("""
                    SELECT u.email FROM mails_to mt
                    JOIN users u ON u.id = mt.user_id
                    WHERE mt.mail_id = $1
                """, mail['id'])

                for recipient in recipients:
                    await send_email(recipient['email'], mail['subject'], mail['content_html'])

                await conn.execute("""
                    UPDATE mails
                    SET status = 'archived',
                        mail_status = 'sent',
                        sent_at = NOW(),
                        updated_at = NOW()
                    WHERE id = $1
                """, mail['id'])

                logger.info("Mail %s sent to %d recipient(s)", mail['id'], len(recipients))

            except Exception:
                logger.exception("Failed to send mail %s", mail['id'])


async def mail_scheduler() -> None:
    interval = settings.MAIL_CRON_INTERVAL_SECONDS
    logger.info("Mail scheduler started (interval: %ds)", interval)
    while True:
        await asyncio.sleep(interval)
        logger.info("Mail scheduler tick")
        try:
            await process_pending_mails()
        except Exception:
            logger.exception("Mail scheduler encountered an unexpected error")
