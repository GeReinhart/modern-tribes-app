"""Seed the guitar chords inventory with ~200 popular chords, in several neck positions

Revision ID: 013
Revises: 012
Create Date: 2026-07-31
"""
import json

from alembic import op

revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None

ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
ROOT_SEMITONES = {root: i for i, root in enumerate(ROOTS)}

# Hand-verified authentic open/barre shapes for the 7 natural roots.
# frets: low E to high E; None = muted ("X"). Verified against standard tuning
# (low E=4, A=9, D=2, G=7, B=11, e=4 semitones from C) so every note is a real chord tone.
_HARDCODED = [
    # Major
    ("C", "C", [None, 3, 2, 0, 1, 0], "Open chord"),
    ("D", "D", [None, None, 0, 2, 3, 2], "Open chord"),
    ("E", "E", [0, 2, 2, 1, 0, 0], "Open chord"),
    ("F", "F", [1, 3, 3, 2, 1, 1], "Barre chord"),
    ("G", "G", [3, 2, 0, 0, 0, 3], "Open chord"),
    ("A", "A", [None, 0, 2, 2, 2, 0], "Open chord"),
    ("B", "B", [None, 2, 4, 4, 4, 2], "Barre chord"),
    # Minor
    ("Cm", "C", [None, 3, 5, 5, 4, 3], "Barre chord"),
    ("Dm", "D", [None, None, 0, 2, 3, 1], "Open chord"),
    ("Em", "E", [0, 2, 2, 0, 0, 0], "Open chord"),
    ("Fm", "F", [1, 3, 3, 1, 1, 1], "Barre chord"),
    ("Gm", "G", [3, 5, 5, 3, 3, 3], "Barre chord"),
    ("Am", "A", [None, 0, 2, 2, 1, 0], "Open chord"),
    ("Bm", "B", [None, 2, 4, 4, 3, 2], "Barre chord"),
    # Dominant 7th
    ("C7", "C", [None, 3, 2, 3, 1, 0], "Open chord"),
    ("D7", "D", [None, None, 0, 2, 1, 2], "Open chord"),
    ("E7", "E", [0, 2, 0, 1, 0, 0], "Open chord"),
    ("F7", "F", [1, 3, 1, 2, 1, 1], "Barre chord"),
    ("G7", "G", [3, 2, 0, 0, 0, 1], "Open chord"),
    ("A7", "A", [None, 0, 2, 0, 2, 0], "Open chord"),
    ("B7", "B", [None, 2, 1, 2, 0, 2], "Open chord"),
    # Major 7th
    ("Cmaj7", "C", [None, 3, 2, 0, 0, 0], "Open chord"),
    ("Dmaj7", "D", [None, None, 0, 2, 2, 2], "Open chord"),
    ("Emaj7", "E", [0, 2, 1, 1, 0, 0], "Open chord"),
    ("Fmaj7", "F", [1, 3, 2, 2, 1, 1], "Barre chord"),
    ("Gmaj7", "G", [3, 2, 0, 0, 0, 2], "Open chord"),
    ("Amaj7", "A", [None, 0, 2, 1, 2, 0], "Open chord"),
    ("Bmaj7", "B", [None, 2, 4, 3, 4, 2], "Barre chord"),
    # Minor 7th
    ("Cm7", "C", [None, 3, 5, 3, 4, 3], "Barre chord"),
    ("Dm7", "D", [None, None, 0, 2, 1, 1], "Open chord"),
    ("Em7", "E", [0, 2, 0, 0, 0, 0], "Open chord"),
    ("Fm7", "F", [1, 3, 1, 1, 1, 1], "Barre chord"),
    ("Gm7", "G", [3, 5, 3, 3, 3, 3], "Barre chord"),
    ("Am7", "A", [None, 0, 2, 0, 1, 0], "Open chord"),
    ("Bm7", "B", [None, 2, 4, 2, 3, 2], "Barre chord"),
    # Power chords (root + 5th + octave)
    ("C5", "C", [None, 3, 5, 5, None, None], "Barre chord"),
    ("D5", "D", [None, None, 0, 2, 3, None], "Open chord"),
    ("E5", "E", [0, 2, 2, None, None, None], "Open chord"),
    ("F5", "F", [1, 3, 3, None, None, None], "Barre chord"),
    ("G5", "G", [3, 5, 5, None, None, None], "Barre chord"),
    ("A5", "A", [None, 0, 2, 2, None, None], "Open chord"),
    ("B5", "B", [None, 2, 4, 4, None, None], "Barre chord"),
    # Sus4
    ("Csus4", "C", [None, 3, 3, 0, 1, 1], "Open chord"),
    ("Dsus4", "D", [None, None, 0, 2, 3, 3], "Open chord"),
    ("Esus4", "E", [0, 2, 2, 2, 0, 0], "Open chord"),
    ("Fsus4", "F", [1, 3, 3, 3, 1, 1], "Barre chord"),
    ("Gsus4", "G", [3, 3, 0, 0, 1, 3], "Open chord"),
    ("Asus4", "A", [None, 0, 2, 2, 3, 0], "Open chord"),
    ("Bsus4", "B", [None, 2, 4, 4, 5, 2], "Barre chord"),
    # Add9
    ("Cadd9", "C", [None, 3, 2, 0, 3, 0], "Open chord"),
]

# Slash chords — the harmonic root (root_note) stays the chord's own root; only the
# bass note (lowest sounding string) changes. Each shape is verified so the bass
# string really sounds the intended bass note.
_SLASH_CHORDS = [
    ("C/E", "C", [0, 3, 2, 0, 1, 0], "Slash chord — bass note E"),
    ("C/G", "C", [3, 3, 2, 0, 1, 0], "Slash chord — bass note G"),
    ("D/F#", "D", [2, None, 0, 2, 3, 2], "Slash chord — bass note F#"),
    ("D/A", "D", [None, 0, 0, 2, 3, 2], "Slash chord — bass note A"),
    ("D/G", "D", [3, None, 0, 2, 3, 2], "Slash chord — bass note G"),
    ("E/G#", "E", [4, None, 2, 1, 0, 0], "Slash chord — bass note G#"),
    ("E/B", "E", [None, 2, 2, 1, 0, 0], "Slash chord — bass note B"),
    ("G/B", "G", [None, 2, 0, 0, 0, 3], "Slash chord — bass note B"),
    ("G/D", "G", [None, None, 0, 0, 0, 3], "Slash chord — bass note D"),
    ("A/C#", "A", [None, 4, 2, 2, 2, 0], "Slash chord — bass note C#"),
    ("Am/C", "A", [None, 3, 2, 2, 1, 0], "Slash chord — bass note C"),
    ("Am/G", "A", [3, 0, 2, 2, 1, 0], "Slash chord — bass note G"),
    ("Em/D", "E", [None, 2, 0, 0, 0, 0], "Slash chord — bass note D"),
]

# --- Movable CAGED shapes ----------------------------------------------------
# Offsets from a barre fret `n`, low E to high E. Verified: every resulting note is
# a real chord tone (root/3rd/5th/7th as appropriate) for any root, since the shapes
# are built by transposing the standard open E-shape / A-shape chords.
_E_SHAPE_QUALITIES = {
    'major': (0, 2, 2, 1, 0, 0),
    'm': (0, 2, 2, 0, 0, 0),
    '7': (0, 2, 0, 1, 0, 0),
    'maj7': (0, 2, 1, 1, 0, 0),
    'm7': (0, 2, 0, 0, 0, 0),
    'sus4': (0, 2, 2, 2, 0, 0),
    '5': (0, 2, 2, None, None, None),
}
_A_SHAPE_QUALITIES = {
    'major': (0, 2, 2, 2, 0),
    'm': (0, 2, 2, 1, 0),
    '7': (0, 2, 0, 2, 0),
    'maj7': (0, 2, 1, 2, 0),
    'm7': (0, 2, 0, 1, 0),
    'sus4': (0, 2, 2, 3, 0),
    '5': (0, 2, 2, None, None),
}


def _shift(n: int, offsets: tuple) -> list:
    return [n + o if o is not None else None for o in offsets]


def _generate_barre_chords() -> list:
    chords = []
    for root in ROOTS:
        target = ROOT_SEMITONES[root]
        n_e = (target - ROOT_SEMITONES['E']) % 12
        n_a = (target - ROOT_SEMITONES['A']) % 12
        if n_e != 0:  # n_e == 0 means root == E, already covered by _HARDCODED
            for quality, offsets in _E_SHAPE_QUALITIES.items():
                name = f"{root}{quality if quality != 'major' else ''}"
                frets = _shift(n_e, offsets)
                chords.append((name, root, frets, f"E-shape barre chord (fret {n_e})"))
        if n_a != 0:  # n_a == 0 means root == A, already covered by _HARDCODED
            for quality, offsets in _A_SHAPE_QUALITIES.items():
                name = f"{root}{quality if quality != 'major' else ''}"
                frets = [None] + _shift(n_a, offsets)
                chords.append((name, root, frets, f"A-shape barre chord (fret {n_a})"))
    return chords


def _values_row(name: str, root_note: str, frets: list, description: str) -> str:
    frets_json = json.dumps(['X' if f is None else f for f in frets])
    description_sql = "'" + description.replace("'", "''") + "'"
    return f"('{name}', '{root_note}', {description_sql}, '{frets_json}'::jsonb)"


def _deduplicate(chords: list) -> list:
    seen = set()
    result = []
    for chord in chords:
        key = (chord[0], chord[1], tuple(chord[2]))
        if key in seen:
            continue
        seen.add(key)
        result.append(chord)
    return result


def upgrade() -> None:
    all_chords = _deduplicate(_HARDCODED + _SLASH_CHORDS + _generate_barre_chords())
    values_clause = ",\n        ".join(_values_row(*chord) for chord in all_chords)
    op.execute(f"""
        INSERT INTO guitar_chords (name, root_note, description, frets)
        SELECT * FROM (VALUES
        {values_clause}
        ) AS seed(name, root_note, description, frets)
        WHERE NOT EXISTS (SELECT 1 FROM guitar_chords WHERE created_by IS NULL)
    """)


def downgrade() -> None:
    op.execute("DELETE FROM guitar_chords WHERE created_by IS NULL")
