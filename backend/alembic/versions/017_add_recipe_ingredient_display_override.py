"""A recipe ingredient's display_override is a free-text substitute (e.g. "a pinch")
shown instead of the computed quantity + unit when reading a recipe. The stored
quantity/unit are unaffected and stay the source of truth for shopping lists.

Revision ID: 017
Revises: 016
Create Date: 2026-08-28
"""
from alembic import op

revision = '017'
down_revision = '016'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE recipe_ingredients ADD COLUMN display_override VARCHAR(100)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE recipe_ingredients DROP COLUMN display_override")
