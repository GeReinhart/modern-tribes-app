"""Add custom_content_size_px to guitar song layout blocks.

Revision ID: 023
Revises: 022
Create Date: 2026-09-14
"""
from alembic import op

revision = '023'
down_revision = '022'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs_layout_column_blocks ADD COLUMN custom_content_size_px SMALLINT NOT NULL "
        "DEFAULT 16 CHECK (custom_content_size_px BETWEEN 8 AND 40)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs_layout_column_blocks DROP COLUMN custom_content_size_px")
