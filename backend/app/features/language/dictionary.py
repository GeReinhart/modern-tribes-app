"""Persistence and assembly for the global word dictionary: words, their optional
declensions, and the translation links between words of different languages. Shared by
the lesson and learn sub-packages, since a word is created once and read everywhere."""
from uuid import UUID


async def find_active_word_by_text(pool, text: str, language: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id::text, text, language, word_type, article, plural FROM language_words "
            "WHERE lower(text) = lower($1) AND language = $2 AND status = 'active'",
            text, language,
        )
    return dict(row) if row else None


async def get_word(pool, word_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id::text, text, language, word_type, article, plural FROM language_words "
            "WHERE id = $1 AND status = 'active'",
            UUID(word_id),
        )
    return dict(row) if row else None


async def create_word(pool, text: str, language: str, word_type: str, article, plural, user_id: str) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO language_words (text, language, word_type, article, plural, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6, $6)
               RETURNING id::text, text, language, word_type, article, plural""",
            text, language, word_type, article, plural, UUID(user_id),
        )
    return dict(row)


async def update_word(
    pool, word_id: str, text: str, word_type: str, article, plural, user_id: str,
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """UPDATE language_words SET text = $1, word_type = $2, article = $3, plural = $4, updated_by = $5
               WHERE id = $6
               RETURNING id::text, text, language, word_type, article, plural""",
            text, word_type, article, plural, UUID(user_id), UUID(word_id),
        )
    return dict(row)


async def replace_declensions(pool, word_id: str, declensions: list[dict], user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM language_word_declensions WHERE word_id = $1", UUID(word_id),
        )
    await create_declensions(pool, word_id, declensions, user_id)


async def create_declensions(pool, word_id: str, declensions: list[dict], user_id: str) -> None:
    async with pool.acquire() as conn:
        for position, item in enumerate(declensions):
            await conn.execute(
                """INSERT INTO language_word_declensions
                       (word_id, case_label, form, position, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $5, $5)""",
                UUID(word_id), item["case_label"], item["form"], position, UUID(user_id),
            )


async def get_declensions(pool, word_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT case_label, form FROM language_word_declensions "
            "WHERE word_id = $1 AND status = 'active' ORDER BY position",
            UUID(word_id),
        )
    return [dict(r) for r in rows]


async def link_translation(pool, word_id_a: str, word_id_b: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO language_word_translations (word_id_a, word_id_b, created_by, updated_by)
               VALUES ($1, $2, $3, $3)""",
            UUID(word_id_a), UUID(word_id_b), UUID(user_id),
        )


async def get_translations(pool, word_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT w.id::text, w.text, w.language, w.word_type, w.article, w.plural
               FROM language_word_translations t
               JOIN language_words w
                   ON w.id = CASE WHEN t.word_id_a = $1 THEN t.word_id_b ELSE t.word_id_a END
               WHERE $1 IN (t.word_id_a, t.word_id_b) AND t.status = 'active' AND w.status = 'active'""",
            UUID(word_id),
        )
    return [dict(r) for r in rows]


async def search_words(pool, query: str, language: str | None = None) -> list[dict]:
    """A "contains" search, but ranked so an exact or prefix match is never pushed out of
    the LIMIT by other, less relevant matches merely containing the query -- e.g. searching
    "tête" must surface "tête" itself before "entêté", which also contains it."""
    contains, prefix = f"%{query}%", f"{query}%"
    async with pool.acquire() as conn:
        if language:
            rows = await conn.fetch(
                "SELECT id::text, text, language, word_type FROM language_words "
                "WHERE status = 'active' AND language = $1 AND text ILIKE $2 "
                "ORDER BY (lower(text) = lower($3)) DESC, (text ILIKE $4) DESC, text LIMIT 20",
                language, contains, query, prefix,
            )
        else:
            rows = await conn.fetch(
                "SELECT id::text, text, language, word_type FROM language_words "
                "WHERE status = 'active' AND text ILIKE $1 "
                "ORDER BY (lower(text) = lower($2)) DESC, (text ILIKE $3) DESC, text LIMIT 20",
                contains, query, prefix,
            )
    return [dict(r) for r in rows]


async def get_word_with_translations(pool, word_id: str) -> dict:
    """A word with its declensions and its translations, each translation carrying its
    own declensions too (one level deep — a translation's own translations are omitted)."""
    word = await get_word(pool, word_id)
    word["declensions"] = await get_declensions(pool, word_id)
    translations = await get_translations(pool, word_id)
    for translation in translations:
        translation["declensions"] = await get_declensions(pool, translation["id"])
    word["translations"] = translations
    return word
