"""Per-song presentation settings for the "Lyrics & Chords" text+chords display: the vertical
space between lyric lines, the lyric text's own font size, and the chord-badge font size --
all in px, both on screen and in the PDF.

Revision ID: 018
Revises: 017
Create Date: 2026-08-06
"""
from alembic import op

revision = '018'
down_revision = '017'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs ADD COLUMN IF NOT EXISTS lyrics_line_spacing_px INTEGER NOT NULL DEFAULT 10 "
        "CHECK (lyrics_line_spacing_px BETWEEN 0 AND 60)"
    )
    op.execute(
        "ALTER TABLE guitar_songs ADD COLUMN IF NOT EXISTS lyrics_text_size_px INTEGER NOT NULL DEFAULT 16 "
        "CHECK (lyrics_text_size_px BETWEEN 8 AND 40)"
    )
    op.execute(
        "ALTER TABLE guitar_songs ADD COLUMN IF NOT EXISTS lyrics_chord_size_px INTEGER NOT NULL DEFAULT 18 "
        "CHECK (lyrics_chord_size_px BETWEEN 8 AND 40)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs DROP COLUMN IF EXISTS lyrics_chord_size_px")
    op.execute("ALTER TABLE guitar_songs DROP COLUMN IF EXISTS lyrics_text_size_px")
    op.execute("ALTER TABLE guitar_songs DROP COLUMN IF EXISTS lyrics_line_spacing_px")
