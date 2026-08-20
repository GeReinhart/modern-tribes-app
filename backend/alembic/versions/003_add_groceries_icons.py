"""Add an optional icon column to groceries_items and groceries_sections, matching the
existing unvalidated free-form icon convention used by projects_features.icon.

Revision ID: 003
Revises: 002
Create Date: 2026-08-21
"""
from alembic import op

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE groceries_items ADD COLUMN icon VARCHAR(50)")
    op.execute("ALTER TABLE groceries_sections ADD COLUMN icon VARCHAR(50)")


def downgrade() -> None:
    op.execute("ALTER TABLE groceries_sections DROP COLUMN icon")
    op.execute("ALTER TABLE groceries_items DROP COLUMN icon")
