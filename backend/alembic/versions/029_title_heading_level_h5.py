"""Add H5 as a title heading level: unlike H1-H4, it renders non-bold and italic -- a
deliberately toned-down option any block type's title can pick (not tied to any one block
type), e.g. a "Lyrics & Chords" part's title, which now defaults to H5.

Revision ID: 029
Revises: 028
Create Date: 2026-08-11
"""
from alembic import op

revision = '029'
down_revision = '028'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks "
        "DROP CONSTRAINT IF EXISTS guitar_songs_layout_column_blocks_title_heading_level_check"
    )
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks ADD CONSTRAINT "
        "guitar_songs_layout_column_blocks_title_heading_level_check "
        "CHECK (title_heading_level IN ('h1', 'h2', 'h3', 'h4', 'h5'))"
    )


def downgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks "
        "DROP CONSTRAINT IF EXISTS guitar_songs_layout_column_blocks_title_heading_level_check"
    )
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks ADD CONSTRAINT "
        "guitar_songs_layout_column_blocks_title_heading_level_check "
        "CHECK (title_heading_level IN ('h1', 'h2', 'h3', 'h4'))"
    )
