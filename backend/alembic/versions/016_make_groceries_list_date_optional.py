"""A grocery list can now be created without a scheduled date (e.g. a running "someday"
list). Such a list is never shown as passed, and is skipped by date-based meal
ingredient suggestions until a date is set.

Revision ID: 016
Revises: 015
Create Date: 2026-08-28
"""
from alembic import op

revision = '016'
down_revision = '015'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE groceries_lists ALTER COLUMN scheduled_date DROP NOT NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE groceries_lists ALTER COLUMN scheduled_date SET NOT NULL")
