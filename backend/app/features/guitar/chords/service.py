import re

from fastapi import HTTPException, status

from app.features.guitar.chords import repository as chords_repository
from app.features.guitar.chords.models import (
    GuitarChordCreate,
    GuitarChordResponse,
    GuitarChordUpdate,
)

_ROOT_NOTE_FROM_NAME_RE = re.compile(r'^([A-Ga-g])([#b]?)')


def propose_root_note(name: str) -> str | None:
    match = _ROOT_NOTE_FROM_NAME_RE.match(name.strip())
    if not match:
        return None
    letter, accidental = match.groups()
    return letter.upper() + accidental


async def list_chords(pool, search: str | None, root_note: str | None) -> list[GuitarChordResponse]:
    rows = await chords_repository.fetch_chords(pool, search, root_note)
    return [GuitarChordResponse(**row) for row in rows]


async def create_chord(pool, data: GuitarChordCreate, user_id: str) -> GuitarChordResponse:
    root_note = data.root_note or propose_root_note(data.name)
    if root_note is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not derive a root note from the chord name; please provide root_note explicitly.",
        )
    row = await chords_repository.insert_chord(pool, data.name, root_note, data.description, data.frets, user_id)
    return GuitarChordResponse(**row)


async def update_chord(pool, chord_id: str, data: GuitarChordUpdate, user_id: str) -> GuitarChordResponse:
    updates = data.model_dump(exclude_unset=True)
    row = await chords_repository.update_chord(pool, chord_id, updates, user_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chord not found.")
    return GuitarChordResponse(**row)


async def delete_chord(pool, chord_id: str, user_id: str) -> None:
    row = await chords_repository.fetch_chord(pool, chord_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chord not found.")
    await chords_repository.archive_chord(pool, chord_id, user_id)
