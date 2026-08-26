"""Add "liter" as a valid unit for groceries items, alongside gram/kg/piece.

Revision ID: 012
Revises: 011
Create Date: 2026-08-26
"""
from alembic import op

revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE groceries_items DROP CONSTRAINT groceries_items_unit_check")
    op.execute("ALTER TABLE groceries_items ADD CONSTRAINT groceries_items_unit_check "
               "CHECK (unit IN ('gram', 'kg', 'piece', 'liter'))")


def downgrade() -> None:
    op.execute("ALTER TABLE groceries_items DROP CONSTRAINT groceries_items_unit_check")
    op.execute("ALTER TABLE groceries_items ADD CONSTRAINT groceries_items_unit_check "
               "CHECK (unit IN ('gram', 'kg', 'piece'))")
