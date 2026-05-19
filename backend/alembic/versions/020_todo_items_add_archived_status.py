"""Add archived status to todo_items

Revision ID: 020
Revises: 019
Create Date: 2026-05-19

"""
from alembic import op

revision = '020'
down_revision = '019'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE todo_items DROP CONSTRAINT IF EXISTS todo_items_status_check")
    op.execute("ALTER TABLE todo_items ADD CONSTRAINT todo_items_status_check CHECK (status IN ('todo', 'done', 'archived'))")


def downgrade() -> None:
    op.execute("ALTER TABLE todo_items DROP CONSTRAINT IF EXISTS todo_items_status_check")
    op.execute("ALTER TABLE todo_items ADD CONSTRAINT todo_items_status_check CHECK (status IN ('todo', 'done'))")
