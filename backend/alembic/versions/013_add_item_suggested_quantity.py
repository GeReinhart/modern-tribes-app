"""Suggested quantity for a catalog item, tracked per feature instance the same way
restock renewal frequency already is — pre-fills the quantity when the item is added
to a list instead of always defaulting to 1.

Revision ID: 013
Revises: 012
Create Date: 2026-08-26
"""
from alembic import op

revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE groceries_instance_items ALTER COLUMN renewal_duration_days DROP NOT NULL")
    op.execute("ALTER TABLE groceries_instance_items ADD COLUMN suggested_quantity NUMERIC(10, 2)")


def downgrade() -> None:
    op.execute("DELETE FROM groceries_instance_items WHERE renewal_duration_days IS NULL")
    op.execute("ALTER TABLE groceries_instance_items ALTER COLUMN renewal_duration_days SET NOT NULL")
    op.execute("ALTER TABLE groceries_instance_items DROP COLUMN suggested_quantity")
