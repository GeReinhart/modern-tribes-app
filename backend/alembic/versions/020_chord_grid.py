"""Chord Grid block: a free-form table (rows/columns the user adds and removes) where each
cell holds a freely-ordered mix of chord references and short text (e.g. "Em G x4") -- a
simplified chart of chord order and repeats for the guitarist. Stored as JSON directly on the
block (like guitar_chords.frets) rather than as new relational tables, since replace_row
archives+recreates every block in a row on any edit (see _remap_sections_across_replace for why
that's a real trap for a per-block-1:1 structure) and a chord grid's rows/columns/cells belong
exclusively to their own block, with no "reassign to another block" concept to justify that
complexity. The block's existing custom_title/custom_content_html/custom_document_id double as
the grid's title and comment, same as a custom block's title and body.

Revision ID: 020
Revises: 019
Create Date: 2026-08-07
"""
from alembic import op

revision = '020'
down_revision = '019'
branch_labels = None
depends_on = None

_BLOCK_TYPES = (
    "'title', 'author', 'tempo', 'time_signature', 'capo', 'description', 'chords', 'sections', "
    "'videos', 'labels', 'custom', 'chord_grid'"
)


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks ADD COLUMN IF NOT EXISTS chord_grid_rows JSONB"
    )
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks "
        "DROP CONSTRAINT IF EXISTS guitar_songs_layout_column_blocks_block_type_check"
    )
    op.execute(
        f"ALTER TABLE guitar_songs_layout_column_blocks ADD CONSTRAINT "
        f"guitar_songs_layout_column_blocks_block_type_check CHECK (block_type IN ({_BLOCK_TYPES}))"
    )
    op.execute("DROP INDEX IF EXISTS guitar_songs_layout_column_blocks_unique")
    op.execute(
        "CREATE UNIQUE INDEX guitar_songs_layout_column_blocks_unique ON guitar_songs_layout_column_blocks "
        "(song_id, block_type) WHERE status = 'active' AND block_type NOT IN ('custom', 'sections', 'chord_grid')"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS guitar_songs_layout_column_blocks_unique")
    op.execute(
        "CREATE UNIQUE INDEX guitar_songs_layout_column_blocks_unique ON guitar_songs_layout_column_blocks "
        "(song_id, block_type) WHERE status = 'active' AND block_type NOT IN ('custom', 'sections')"
    )
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks "
        "DROP CONSTRAINT IF EXISTS guitar_songs_layout_column_blocks_block_type_check"
    )
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks ADD CONSTRAINT "
        "guitar_songs_layout_column_blocks_block_type_check CHECK (block_type IN ("
        "'title', 'author', 'tempo', 'time_signature', 'capo', 'description', 'chords', 'sections', "
        "'videos', 'labels', 'custom'))"
    )
    op.execute("ALTER TABLE guitar_songs_layout_column_blocks DROP COLUMN IF EXISTS chord_grid_rows")
