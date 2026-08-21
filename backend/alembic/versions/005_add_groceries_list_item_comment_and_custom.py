"""Let shoppers add a note to any list item, and add one-off items that only
exist on this list (not in the shared catalog nor its suggestions).

Revision ID: 005
Revises: 004
Create Date: 2026-08-21
"""
from alembic import op

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE groceries_list_items ALTER COLUMN groceries_item_id DROP NOT NULL")
    op.execute("ALTER TABLE groceries_list_items ADD COLUMN custom_name VARCHAR(255)")
    op.execute("ALTER TABLE groceries_list_items ADD COLUMN custom_unit VARCHAR(50)")
    op.execute("ALTER TABLE groceries_list_items ADD COLUMN comment TEXT")
    op.execute(
        """ALTER TABLE groceries_list_items
               ADD CONSTRAINT groceries_list_items_source_check
               CHECK (groceries_item_id IS NOT NULL OR custom_name IS NOT NULL)"""
    )


def downgrade() -> None:
    op.execute("ALTER TABLE groceries_list_items DROP CONSTRAINT groceries_list_items_source_check")
    op.execute("ALTER TABLE groceries_list_items DROP COLUMN comment")
    op.execute("ALTER TABLE groceries_list_items DROP COLUMN custom_unit")
    op.execute("ALTER TABLE groceries_list_items DROP COLUMN custom_name")
    op.execute("ALTER TABLE groceries_list_items ALTER COLUMN groceries_item_id SET NOT NULL")
