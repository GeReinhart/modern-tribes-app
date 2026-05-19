"""Split todo_items status into status + todo_status

Revision ID: 021
Revises: 020
Create Date: 2026-05-19

"""
from alembic import op

revision = '021'
down_revision = '020'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add todo_status populated from the old status column
    op.execute("ALTER TABLE todo_items ADD COLUMN todo_status VARCHAR(50) DEFAULT 'todo'")
    op.execute("UPDATE todo_items SET todo_status = CASE WHEN status = 'done' THEN 'done' ELSE 'todo' END")
    op.execute("ALTER TABLE todo_items ALTER COLUMN todo_status SET NOT NULL")
    op.execute("ALTER TABLE todo_items ADD CONSTRAINT todo_items_todo_status_check CHECK (todo_status IN ('todo', 'done'))")

    # Migrate status to entity lifecycle values
    op.execute("ALTER TABLE todo_items DROP CONSTRAINT IF EXISTS todo_items_status_check")
    op.execute("UPDATE todo_items SET status = CASE WHEN status = 'archived' THEN 'archived' ELSE 'active' END")
    op.execute("ALTER TABLE todo_items ADD CONSTRAINT todo_items_status_check CHECK (status IN ('pending', 'active', 'archived'))")
    op.execute("ALTER TABLE todo_items ALTER COLUMN status SET DEFAULT 'active'")


def downgrade() -> None:
    # Merge todo_status back into status
    op.execute("ALTER TABLE todo_items DROP CONSTRAINT IF EXISTS todo_items_todo_status_check")
    op.execute("ALTER TABLE todo_items DROP CONSTRAINT IF EXISTS todo_items_status_check")
    op.execute("UPDATE todo_items SET status = CASE WHEN todo_status = 'done' THEN 'done' WHEN status = 'archived' THEN 'archived' ELSE 'todo' END")
    op.execute("ALTER TABLE todo_items ADD CONSTRAINT todo_items_status_check CHECK (status IN ('todo', 'done', 'archived'))")
    op.execute("ALTER TABLE todo_items ALTER COLUMN status SET DEFAULT 'todo'")
    op.execute("ALTER TABLE todo_items DROP COLUMN todo_status")
