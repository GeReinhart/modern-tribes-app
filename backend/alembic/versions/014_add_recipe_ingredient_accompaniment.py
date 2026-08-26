"""An accompaniment is a recipe ingredient that isn't part of the recipe itself but is
suggested alongside it (e.g. bread with a soup). Bulk-adding a meal's ingredients to a
groceries list only adds the core ingredients; accompaniments are added one at a time.

Revision ID: 014
Revises: 013
Create Date: 2026-08-26
"""
from alembic import op

revision = '014'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE recipe_ingredients ADD COLUMN is_accompaniment BOOLEAN NOT NULL DEFAULT FALSE"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE recipe_ingredients DROP COLUMN is_accompaniment")
