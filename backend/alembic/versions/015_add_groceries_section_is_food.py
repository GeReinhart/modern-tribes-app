"""Sections in the shared groceries catalog can now be flagged as food or not
(e.g. "Boucherie" vs "Hygiene"), so the recipe ingredient picker can restrict its
suggestions to food sections only.

Revision ID: 015
Revises: 014
Create Date: 2026-08-28
"""
from alembic import op

revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE groceries_sections ADD COLUMN is_food BOOLEAN NOT NULL DEFAULT TRUE"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE groceries_sections DROP COLUMN is_food")
