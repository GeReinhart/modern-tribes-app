"""A meal doesn't need a title — you might plan "dinner, 6 persons" before deciding
what to call it or which recipe to cook.

Revision ID: 010
Revises: 009
Create Date: 2026-08-26
"""
from alembic import op

revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE meals ALTER COLUMN title DROP NOT NULL")


def downgrade() -> None:
    op.execute("UPDATE meals SET title = 'Meal' WHERE title IS NULL")
    op.execute("ALTER TABLE meals ALTER COLUMN title SET NOT NULL")
