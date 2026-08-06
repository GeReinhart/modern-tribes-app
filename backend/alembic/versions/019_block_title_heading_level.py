"""Per-block title size: each layout block picks a heading level (H1-H4) for its own title,
so titles across different block types (Chords, Lyrics & Chords, free-text, Videos, Labels,
Description) can be sized consistently -- applied on screen and in the PDF.

Revision ID: 019
Revises: 018
Create Date: 2026-08-07
"""
from alembic import op

revision = '019'
down_revision = '018'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks ADD COLUMN IF NOT EXISTS title_heading_level "
        "VARCHAR(2) NOT NULL DEFAULT 'h3' CHECK (title_heading_level IN ('h1', 'h2', 'h3', 'h4'))"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs_layout_column_blocks DROP COLUMN IF EXISTS title_heading_level")
