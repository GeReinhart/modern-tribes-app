from uuid import UUID


async def fetch_cached_pdf(pool, song_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT content_hash, pdf_bytes FROM guitar_songs_layout_pdf_cache WHERE song_id = $1 AND status = 'active'",
            UUID(song_id),
        )
    return dict(row) if row else None


async def upsert_cached_pdf(pool, song_id: str, content_hash: str, pdf_bytes: bytes, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO guitar_songs_layout_pdf_cache (song_id, content_hash, pdf_bytes, created_by, updated_by)
               VALUES ($1, $2, $3, $4::uuid, $4::uuid)
               ON CONFLICT (song_id) DO UPDATE
                   SET content_hash = $2, pdf_bytes = $3, updated_by = $4::uuid, updated_at = NOW(),
                       status = 'active'""",
            UUID(song_id), content_hash, pdf_bytes, UUID(user_id),
        )
