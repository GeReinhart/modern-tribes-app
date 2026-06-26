"""Add force_on_dashboard to kanban_cards, todo_items, events

Revision ID: 004
Revises: 003
Create Date: 2026-06-26
"""
from alembic import op

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS force_on_dashboard BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("ALTER TABLE todo_items ADD COLUMN IF NOT EXISTS force_on_dashboard BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("ALTER TABLE events ADD COLUMN IF NOT EXISTS force_on_dashboard BOOLEAN NOT NULL DEFAULT FALSE")


def downgrade() -> None:
    op.execute("ALTER TABLE kanban_cards DROP COLUMN IF EXISTS force_on_dashboard")
    op.execute("ALTER TABLE todo_items DROP COLUMN IF EXISTS force_on_dashboard")
    op.execute("ALTER TABLE events DROP COLUMN IF EXISTS force_on_dashboard")
