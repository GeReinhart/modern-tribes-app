"""Add color to events

Revision ID: 011
Revises: 010
Create Date: 2026-07-28
"""
from alembic import op

revision = '011'
down_revision = '010'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE events ADD COLUMN IF NOT EXISTS color VARCHAR(20) NOT NULL DEFAULT '#6b7280'")


def downgrade() -> None:
    op.execute("ALTER TABLE events DROP COLUMN IF EXISTS color")
