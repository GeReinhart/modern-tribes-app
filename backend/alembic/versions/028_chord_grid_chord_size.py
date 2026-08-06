"""Chord Grid block: a per-block chord text size, independent of the song-wide
chord_diagram_size -- each chord_grid table can size its own cell text without affecting any
other chord_grid block, the "Chords" block's diagrams, or the "Lyrics & Chords" blocks.

Revision ID: 028
Revises: 027
Create Date: 2026-08-11
"""
from alembic import op

revision = '028'
down_revision = '027'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks "
        "ADD COLUMN IF NOT EXISTS chord_grid_chord_size_px SMALLINT NOT NULL DEFAULT 18"
    )
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks "
        "DROP CONSTRAINT IF EXISTS guitar_songs_layout_column_blocks_chord_grid_chord_size_px_check"
    )
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks ADD CONSTRAINT "
        "guitar_songs_layout_column_blocks_chord_grid_chord_size_px_check "
        "CHECK (chord_grid_chord_size_px BETWEEN 8 AND 40)"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks "
        "DROP CONSTRAINT IF EXISTS guitar_songs_layout_column_blocks_chord_grid_chord_size_px_check"
    )
    op.execute("ALTER TABLE guitar_songs_layout_column_blocks DROP COLUMN IF EXISTS chord_grid_chord_size_px")
