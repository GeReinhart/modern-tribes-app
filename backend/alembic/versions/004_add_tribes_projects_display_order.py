"""Add display_order to tribes_projects

Revision ID: 004
Revises: 003
Create Date: 2026-06-12
"""
from alembic import op

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE tribes_projects ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0")


def downgrade() -> None:
    op.execute("ALTER TABLE tribes_projects DROP COLUMN IF EXISTS display_order")
