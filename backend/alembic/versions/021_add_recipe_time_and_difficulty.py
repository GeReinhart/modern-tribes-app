"""Add difficulty, prep time and total time to recipes.

Revision ID: 021
Revises: 020
Create Date: 2026-09-09
"""
from alembic import op

revision = '021'
down_revision = '020'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE recipes ADD COLUMN difficulty SMALLINT NULL CHECK (difficulty BETWEEN 0 AND 5)")
    op.execute("ALTER TABLE recipes ADD COLUMN prep_time_minutes SMALLINT NULL CHECK (prep_time_minutes >= 0)")
    op.execute("ALTER TABLE recipes ADD COLUMN total_time_minutes SMALLINT NULL CHECK (total_time_minutes >= 0)")


def downgrade() -> None:
    op.execute("ALTER TABLE recipes DROP COLUMN difficulty")
    op.execute("ALTER TABLE recipes DROP COLUMN prep_time_minutes")
    op.execute("ALTER TABLE recipes DROP COLUMN total_time_minutes")
