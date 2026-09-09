"""Add "is_condiment" to groceries sections, so a recipe can show condiment ingredients apart.

Revision ID: 020
Revises: 019
Create Date: 2026-09-03
"""
from alembic import op

revision = '020'
down_revision = '019'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE groceries_sections ADD COLUMN is_condiment BOOLEAN NOT NULL DEFAULT FALSE")


def downgrade() -> None:
    op.execute("ALTER TABLE groceries_sections DROP COLUMN is_condiment")
