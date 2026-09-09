"""Add "none" as a valid unit for groceries items, for items with no meaningful quantity (curry, salt...).

Revision ID: 019
Revises: 018
Create Date: 2026-09-03
"""
from alembic import op

revision = '019'
down_revision = '018'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE groceries_items DROP CONSTRAINT groceries_items_unit_check")
    op.execute("ALTER TABLE groceries_items ADD CONSTRAINT groceries_items_unit_check "
               "CHECK (unit IN ('gram', 'kg', 'piece', 'liter', 'none'))")


def downgrade() -> None:
    op.execute("ALTER TABLE groceries_items DROP CONSTRAINT groceries_items_unit_check")
    op.execute("ALTER TABLE groceries_items ADD CONSTRAINT groceries_items_unit_check "
               "CHECK (unit IN ('gram', 'kg', 'piece', 'liter'))")
