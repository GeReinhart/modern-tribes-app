"""The 'sections' ("Lyrics & Chords") half of a block's content -- lyrics_text/lyrics_words/
linked_to_block_id -- kept apart from service.py's row/column structure concerns, the same way
pdf_service.py already keeps PDF rendering apart from it."""
from fastapi import HTTPException, status

from app.features.guitar.song.layout import repository as repo
from app.features.guitar.song.layout.lyrics_words import rebuild_words
from app.features.guitar.song.layout.models import (
    SECTIONS_BLOCK_TYPE,
    GuitarSongLayoutBlockContentUpdate,
    WordChordPosition,
)


async def _require_valid_link_target(pool, song_id: str, block_id: str, linked_to_block_id: str | None) -> None:
    """A link can only point at another "root" 'sections' block (not itself, not itself a link)
    of the same song -- no chains, no self-links, no cross-song references."""
    if linked_to_block_id is None:
        return
    if linked_to_block_id == block_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A block cannot link to itself.")
    target_context = await repo.fetch_block_context(pool, linked_to_block_id)
    if (
        target_context is None
        or target_context["song_id"] != song_id
        or target_context["block_type"] != SECTIONS_BLOCK_TYPE
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="linked_to_block_id must reference another 'Lyrics & Chords' block in this song.",
        )
    target = await repo.fetch_block(pool, linked_to_block_id)
    if target and target.get("linked_to_block_id"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Cannot link to a block that is itself a link."
        )


async def resolve_content_target(pool, block: dict) -> dict:
    """Where a lyrics/chord edit on `block` actually lands -- its own row, or (if it's a link)
    the block it mirrors, so editing "through" a link keeps every mirror in sync."""
    if not block.get("linked_to_block_id"):
        return block
    target = await repo.fetch_block(pool, block["linked_to_block_id"])
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked block not found.")
    return target


async def apply_sections_content(
    pool, block_id: str, block: dict, data: GuitarSongLayoutBlockContentUpdate, user_id: str
) -> None:
    """Apply the sections-specific fields of a block-content update, called from
    service.update_block_content once it's confirmed block_type == 'sections'."""
    song_id = block["song_id"]
    if "linked_to_block_id" in data.model_fields_set:
        await _require_valid_link_target(pool, song_id, block_id, data.linked_to_block_id)
        await repo.update_block_link(pool, block_id, data.linked_to_block_id, user_id)
        if data.linked_to_block_id:
            await repo.clear_block_sections_content(pool, block_id, user_id)
        block = await repo.fetch_block(pool, block_id)

    if "lyrics_text" not in data.model_fields_set:
        return
    target = await resolve_content_target(pool, block)
    words = rebuild_words(data.lyrics_text or "", target.get("lyrics_words"))
    await repo.update_block_lyrics(pool, target["id"], data.lyrics_text, words, user_id)


async def set_lyrics_word_chord(
    pool, block_id: str, line_index: int, word_index: int, position: WordChordPosition,
    chord_id: str | None, user_id: str,
) -> dict:
    """Attach, replace or detach (chord_id: None) the chord at one of the 5 fixed positions
    around a word (before, start, middle, end, after). Returns the block the coordinate actually
    lands on -- its own, or (through a link) the block it mirrors."""
    block = await repo.fetch_block(pool, block_id)
    if block is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Layout block not found.")
    target = await resolve_content_target(pool, block)
    words = target.get("lyrics_words") or []
    if line_index < 0 or line_index >= len(words) or word_index < 0 or word_index >= len(words[line_index]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No word at that position.")
    if chord_id:
        words[line_index][word_index]["chords"][position] = chord_id
    else:
        words[line_index][word_index]["chords"].pop(position, None)
    await repo.update_block_lyrics_words(pool, target["id"], words, user_id)
    return await repo.fetch_block(pool, block_id)
