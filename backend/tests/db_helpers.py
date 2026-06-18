"""Test database infrastructure for real-DB BDD tests."""
import asyncio
import os
import re
import subprocess
from contextlib import asynccontextmanager
from datetime import date
from uuid import UUID

import asyncpg

TEST_DB_NAME = "modern_tribes_test"
TEST_DB_PORT = 5433
TEST_DB_DSN = f"postgresql://admin:password123@localhost:{TEST_DB_PORT}/{TEST_DB_NAME}"
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

_UUID_RE = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.I)
_DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
_INT_COLS = {"position", "size", "toc_depth", "order_index", "display_order"}


def url_param_id_from_uuid(uuid_str: str) -> str:
    """Derive a deterministic 6-char url_param_id from a UUID string."""
    return uuid_str.replace("-", "")[-6:]


def coerce(col: str, val: str):
    """Convert a string value to the appropriate Python type for asyncpg."""
    if val is None or val == "":
        return None
    if col in _INT_COLS and isinstance(val, str) and val.lstrip('-').isdigit():
        return int(val)
    if isinstance(val, str):
        if _UUID_RE.match(val):
            return UUID(val)
        if _DATE_RE.match(val):
            return date.fromisoformat(val)
    return val


_CONNECT_TIMEOUT = 5  # seconds — fail fast if PostgreSQL is not running


async def _create_db_if_needed():
    try:
        conn = await asyncpg.connect(
            f"postgresql://admin:password123@localhost:{TEST_DB_PORT}/postgres",
            timeout=_CONNECT_TIMEOUT,
        )
    except (asyncpg.PostgresConnectionFailureError, OSError, TimeoutError) as exc:
        raise RuntimeError(
            f"Cannot reach PostgreSQL at localhost:{TEST_DB_PORT}. "
            "Run: docker compose -f docker-compose.bdd-test.yml up -d postgres-test"
        ) from exc
    try:
        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", TEST_DB_NAME)
        if not exists:
            await conn.execute(f"CREATE DATABASE {TEST_DB_NAME}")
    finally:
        await conn.close()


def _alembic_upgrade(env: dict) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["./venv/bin/python", "-m", "alembic", "upgrade", "head"],
        cwd=_BACKEND_DIR,
        env=env,
        capture_output=True,
        text=True,
    )


async def _reset_schema():
    conn = await asyncpg.connect(
        f"postgresql://admin:password123@localhost:{TEST_DB_PORT}/{TEST_DB_NAME}",
        timeout=_CONNECT_TIMEOUT,
    )
    try:
        await conn.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
    finally:
        await conn.close()


def _run_alembic():
    env = {
        **os.environ,
        "POSTGRES_DB": TEST_DB_NAME,
        "POSTGRES_PORT": str(TEST_DB_PORT),
        "POSTGRES_USER": "admin",
        "POSTGRES_PASSWORD": "password123",
        "POSTGRES_HOST": "localhost",
    }
    result = _alembic_upgrade(env)
    if result.returncode != 0:
        print("\n[test-db] Migration conflict detected; resetting schema...", flush=True)
        asyncio.run(_reset_schema())
        result = _alembic_upgrade(env)
    if result.returncode != 0:
        raise RuntimeError(f"Alembic upgrade failed:\n{result.stderr}")


def setup_test_database():
    """Idempotent: create test DB and apply all migrations."""
    print("\n[test-db] Setting up modern_tribes_test database...", flush=True)
    asyncio.run(_create_db_if_needed())
    _run_alembic()
    print("[test-db] Database ready.", flush=True)


async def _truncate():
    conn = await asyncpg.connect(TEST_DB_DSN, timeout=_CONNECT_TIMEOUT)
    try:
        rows = await conn.fetch(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'alembic_version'"
        )
        if rows:
            tables = ", ".join(f'"{r["tablename"]}"' for r in rows)
            await conn.execute(f"TRUNCATE TABLE {tables} RESTART IDENTITY CASCADE")
    finally:
        await conn.close()


def truncate_all_tables():
    """Truncate every non-alembic table (sync wrapper for use in fixtures)."""
    asyncio.run(_truncate())


@asynccontextmanager
async def db_lifespan(app):
    """FastAPI lifespan: create pool -> set db.pool -> yield -> cleanup."""
    from app.platform.core.database import db
    pool = await asyncpg.create_pool(TEST_DB_DSN)
    db.pool = pool
    try:
        yield
    finally:
        await pool.close()
        db.pool = None
