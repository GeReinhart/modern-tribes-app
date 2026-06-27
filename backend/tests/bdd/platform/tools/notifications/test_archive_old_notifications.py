import asyncio
import asyncpg
import pytest
from pytest_bdd import scenario, when, parsers

from app.platform.tools.notifications import repository as notification_repo
from tests.db_helpers import TEST_DB_DSN

FEATURE = "../../../../features/platform/tools/notifications/archive_old_notifications.feature"


@scenario(FEATURE, "Sent notifications older than retention days are archived")
def test_archive_sent():
    pass


@scenario(FEATURE, "Failed notifications older than retention days are archived")
def test_archive_failed():
    pass


@scenario(FEATURE, "Planned notifications are never archived even if old")
def test_never_archive_planned():
    pass


@scenario(FEATURE, "Recent sent notifications are not archived")
def test_skip_recent():
    pass


@when(parsers.re(r"the system archives notifications older than (?P<days>\d+) days"))
def step_archive_notifications(days):
    async def _run():
        pool = await asyncpg.create_pool(TEST_DB_DSN)
        try:
            await notification_repo.archive_old_notifications(pool, int(days))
        finally:
            await pool.close()
    asyncio.run(_run())
