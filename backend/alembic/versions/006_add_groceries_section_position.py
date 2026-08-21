"""Let shoppers choose the display order of the catalog sections (e.g. shop the
aisles in the order they actually walk them) instead of always seeing them
alphabetically.

Revision ID: 006
Revises: 005
Create Date: 2026-08-21
"""
from alembic import op

revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE groceries_sections ADD COLUMN position INTEGER NOT NULL DEFAULT 0")
    op.execute(
        """WITH ranked AS (
               SELECT id, ROW_NUMBER() OVER (ORDER BY name ASC) - 1 AS rank
               FROM groceries_sections
           )
           UPDATE groceries_sections
           SET position = ranked.rank
           FROM ranked
           WHERE groceries_sections.id = ranked.id"""
    )


def downgrade() -> None:
    op.execute("ALTER TABLE groceries_sections DROP COLUMN position")
