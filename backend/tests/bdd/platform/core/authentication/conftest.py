"""Steps seeding and checking user_sessions, whose refresh tokens are stored hashed."""
import asyncio
from datetime import datetime, timedelta, timezone
from uuid import UUID

import asyncpg
from pytest_bdd import given, parsers, then

from app.platform.core.authentication.security import hash_refresh_token
from tests.db_helpers import TEST_DB_DSN
from tests.helpers import expand_id


def _offset(value: str, unit_days: bool) -> timedelta:
    amount = int(value.rstrip("ds").lstrip("+"))
    return timedelta(days=amount) if unit_days else timedelta(seconds=amount)


async def _insert_session(conn, rec: dict) -> None:
    now = datetime.now(timezone.utc)
    previous = rec.get("previous_refresh_token")
    rotated_ago = rec.get("rotated_ago")
    await conn.execute(
        """INSERT INTO user_sessions(user_id, session_id, expires_at, refresh_token_hash,
               refresh_token_expires_at, previous_refresh_token_hash, previous_rotated_at)
           VALUES($1, $2, $3, $4, $5, $6, $7)""",
        UUID(expand_id(rec["user_id"])),
        rec["session_id"],
        now + timedelta(minutes=60),
        hash_refresh_token(rec["refresh_token"]),
        now + _offset(rec["refresh_expires"], True),
        hash_refresh_token(previous) if previous else None,
        now - _offset(rotated_ago, False) if rotated_ago else None,
    )


@given("the user_sessions table contains:")
def given_user_sessions_table(datatable):
    async def _insert():
        conn = await asyncpg.connect(TEST_DB_DSN, timeout=5)
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                await _insert_session(conn, {headers[i]: row[i] for i in range(len(headers))})
        finally:
            await conn.close()
    asyncio.run(_insert())


async def _session_row(session_id: str) -> asyncpg.Record:
    conn = await asyncpg.connect(TEST_DB_DSN, timeout=5)
    try:
        return await conn.fetchrow(
            "SELECT refresh_token_hash, refresh_token_expires_at FROM user_sessions WHERE session_id = $1",
            session_id,
        )
    finally:
        await conn.close()


@then(parsers.parse("the refresh token of session {session_id} is no longer {token}"))
def then_refresh_token_changed(session_id, token):
    row = asyncio.run(_session_row(session_id))
    assert row["refresh_token_hash"] != hash_refresh_token(token)


@then(parsers.parse("the refresh token of session {session_id} expires in {days:d} days"))
def then_refresh_token_expiry(session_id, days):
    row = asyncio.run(_session_row(session_id))
    remaining = row["refresh_token_expires_at"] - datetime.now(timezone.utc)
    assert timedelta(days=days) - timedelta(minutes=5) < remaining <= timedelta(days=days)
