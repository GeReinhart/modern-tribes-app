"""Videos become pure metadata (like a song's title/author) rather than a placeable layout
block, the same way labels already show as a metadata band above the page instead of only as a
block -- unlike labels though, the 'videos' block type is dropped outright rather than kept
around for backward compatibility, since a video can't be printed to PDF anyway (no PDF rendering
value ever existed once video playback moved off the page). Any 'videos' row is deleted first so
the tightened CHECK constraint can be added without failing on historical data.

Revision ID: 034
Revises: 033
Create Date: 2026-08-12
"""
from alembic import op

revision = '034'
down_revision = '033'
branch_labels = None
depends_on = None

_BLOCK_TYPES_WITHOUT_VIDEOS = (
    "'title', 'author', 'tempo', 'time_signature', 'capo', 'description', 'chords', 'sections', "
    "'labels', 'custom', 'chord_grid'"
)
_BLOCK_TYPES_WITH_VIDEOS = (
    "'title', 'author', 'tempo', 'time_signature', 'capo', 'description', 'chords', 'sections', "
    "'videos', 'labels', 'custom', 'chord_grid'"
)


def upgrade() -> None:
    op.execute("DELETE FROM guitar_songs_layout_column_blocks WHERE block_type = 'videos'")
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks "
        "DROP CONSTRAINT IF EXISTS guitar_songs_layout_column_blocks_block_type_check"
    )
    op.execute(
        f"ALTER TABLE guitar_songs_layout_column_blocks ADD CONSTRAINT "
        f"guitar_songs_layout_column_blocks_block_type_check CHECK (block_type IN ({_BLOCK_TYPES_WITHOUT_VIDEOS}))"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks "
        "DROP CONSTRAINT IF EXISTS guitar_songs_layout_column_blocks_block_type_check"
    )
    op.execute(
        f"ALTER TABLE guitar_songs_layout_column_blocks ADD CONSTRAINT "
        f"guitar_songs_layout_column_blocks_block_type_check CHECK (block_type IN ({_BLOCK_TYPES_WITH_VIDEOS}))"
    )
