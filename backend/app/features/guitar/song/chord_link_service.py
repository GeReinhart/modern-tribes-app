from app.features.guitar.song import repository as repo


async def ensure_chord_in_song(pool, song_id: str, chord_id: str, user_id: str, comment: str | None = None) -> str:
    """Make sure a chord is linked to a song's manual chord list, reactivating a previously
    removed link instead of duplicating it. No-ops if the chord is already linked."""
    existing = await repo.find_song_chord_pair(pool, song_id, chord_id)
    if existing and existing["status"] == "active":
        return existing["id"]
    position = await repo.next_song_chord_position(pool, song_id)
    if existing:
        await repo.reactivate_song_chord(pool, existing["id"], position, comment, user_id)
        return existing["id"]
    return await repo.insert_song_chord(pool, song_id, chord_id, position, comment, user_id)
