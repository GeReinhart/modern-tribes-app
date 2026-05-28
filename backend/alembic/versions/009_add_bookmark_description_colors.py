"""Add description and color columns to user_bookmarks

Revision ID: 009
Revises: 008
Create Date: 2026-05-23
"""
from alembic import op

revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE user_bookmarks
            ADD COLUMN description TEXT,
            ADD COLUMN color_text VARCHAR(50),
            ADD COLUMN color_background VARCHAR(50)
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE user_bookmarks
            DROP COLUMN IF EXISTS description,
            DROP COLUMN IF EXISTS color_text,
            DROP COLUMN IF EXISTS color_background
    """)
