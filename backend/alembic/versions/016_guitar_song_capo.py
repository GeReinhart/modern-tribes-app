"""Add capo to guitar_songs

Revision ID: 016
Revises: 015
Create Date: 2026-08-05
"""
from alembic import op

revision = '016'
down_revision = '015'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs ADD COLUMN IF NOT EXISTS capo INTEGER NOT NULL DEFAULT 0 "
        "CHECK (capo BETWEEN 0 AND 12)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs DROP COLUMN IF EXISTS capo")
