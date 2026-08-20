"""Some 'piece'-counted items can be split into fractional quantities (half a watermelon)
while others can't (half a yogurt cup) -- this is a property of the specific item, not of
the unit itself, so it needs its own flag rather than being derived from `unit`.

Revision ID: 004
Revises: 003
Create Date: 2026-08-22
"""
from alembic import op

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE groceries_items ADD COLUMN is_divisible BOOLEAN NOT NULL DEFAULT TRUE")


def downgrade() -> None:
    op.execute("ALTER TABLE groceries_items DROP COLUMN is_divisible")
