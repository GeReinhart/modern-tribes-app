"""Let shoppers mark a grocery list as a favorite, so it can be reused as a
starting point when scheduling a new list.

Revision ID: 007
Revises: 006
Create Date: 2026-08-21
"""
from alembic import op

revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE groceries_lists ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT FALSE")


def downgrade() -> None:
    op.execute("ALTER TABLE groceries_lists DROP COLUMN is_favorite")
