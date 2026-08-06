"""Let a song section be assigned to a specific "Lyrics & Chords" layout block, and allow the
'sections' block type to repeat in a layout (previously only 'custom' blocks could repeat).

Revision ID: 016
Revises: 015
Create Date: 2026-08-06
"""
from alembic import op

revision = '016'
down_revision = '015'
branch_labels = None
depends_on = None

_UNIQUE_INDEX = "guitar_songs_layout_column_blocks_unique"


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs_sections ADD COLUMN IF NOT EXISTS layout_block_id UUID "
        "REFERENCES guitar_songs_layout_column_blocks(id) ON DELETE SET NULL"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_guitar_songs_sections_layout_block "
        "ON guitar_songs_sections(layout_block_id)"
    )
    op.execute(f"DROP INDEX IF EXISTS {_UNIQUE_INDEX}")
    op.execute(f"""
        CREATE UNIQUE INDEX IF NOT EXISTS {_UNIQUE_INDEX}
        ON guitar_songs_layout_column_blocks (song_id, block_type)
        WHERE status = 'active' AND block_type NOT IN ('custom', 'sections')
    """)


def downgrade() -> None:
    op.execute(f"DROP INDEX IF EXISTS {_UNIQUE_INDEX}")
    op.execute(f"""
        CREATE UNIQUE INDEX IF NOT EXISTS {_UNIQUE_INDEX}
        ON guitar_songs_layout_column_blocks (song_id, block_type)
        WHERE status = 'active' AND block_type != 'custom'
    """)
    op.execute("DROP INDEX IF EXISTS idx_guitar_songs_sections_layout_block")
    op.execute("ALTER TABLE guitar_songs_sections DROP COLUMN IF EXISTS layout_block_id")
