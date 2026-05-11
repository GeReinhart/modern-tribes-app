import asyncpg
from typing import Optional
from .config import settings


class Database:
    pool: Optional[asyncpg.Pool] = None


db = Database()


async def connect_to_postgres():
    """Connect to PostgreSQL on application startup"""
    db.pool = await asyncpg.create_pool(
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        database=settings.POSTGRES_DB,
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        min_size=settings.POSTGRES_POOL_MIN,
        max_size=settings.POSTGRES_POOL_MAX,
    )
    print(f"Connected to PostgreSQL")


async def close_postgres_connection():
    """Close PostgreSQL connection on application shutdown"""
    if db.pool:
        await db.pool.close()
    print("PostgreSQL connection closed")


def get_database() -> asyncpg.Pool:
    """Get database pool instance"""
    return db.pool
