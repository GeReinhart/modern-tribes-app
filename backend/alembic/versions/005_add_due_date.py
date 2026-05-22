"""Add due_date to kanban_cards and todo_items

Revision ID: 005
Revises: 004
Create Date: 2026-05-22
"""
from alembic import op

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE kanban_cards ADD COLUMN due_date DATE")
    op.execute("ALTER TABLE todo_items ADD COLUMN due_date DATE")


def downgrade() -> None:
    op.execute("ALTER TABLE kanban_cards DROP COLUMN IF EXISTS due_date")
    op.execute("ALTER TABLE todo_items DROP COLUMN IF EXISTS due_date")
