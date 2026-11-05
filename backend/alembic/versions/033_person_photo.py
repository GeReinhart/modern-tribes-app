"""Add an optional profile photo to persons.

Revision ID: 033
Revises: 032
Create Date: 2026-11-05
"""
from alembic import op

revision = '033'
down_revision = '032'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE persons ADD COLUMN photo_url TEXT")


def downgrade() -> None:
    op.execute("ALTER TABLE persons DROP COLUMN photo_url")
