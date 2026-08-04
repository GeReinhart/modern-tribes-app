"""Add chord diagram style and size preferences to guitar_songs

Revision ID: 017
Revises: 016
Create Date: 2026-08-06
"""
from alembic import op

revision = '017'
down_revision = '016'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs ADD COLUMN IF NOT EXISTS chord_diagram_style VARCHAR(20) "
        "NOT NULL DEFAULT 'full' CHECK (chord_diagram_style IN ('full', 'simple'))"
    )
    op.execute(
        "ALTER TABLE guitar_songs ADD COLUMN IF NOT EXISTS chord_diagram_size VARCHAR(20) "
        "NOT NULL DEFAULT 'medium' CHECK (chord_diagram_size IN ('small', 'medium', 'large'))"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs DROP COLUMN IF EXISTS chord_diagram_size")
    op.execute("ALTER TABLE guitar_songs DROP COLUMN IF EXISTS chord_diagram_style")
