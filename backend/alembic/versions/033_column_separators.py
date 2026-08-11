"""Add separator_left/separator_right to a layout column: a subtle vertical rule a user can turn
on for either edge of a column, independent of its padding/align.

Revision ID: 033
Revises: 032
Create Date: 2026-08-11
"""
from alembic import op

revision = '033'
down_revision = '032'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE guitar_songs_layout_columns ADD COLUMN separator_left BOOLEAN NOT NULL DEFAULT FALSE")
    op.execute("ALTER TABLE guitar_songs_layout_columns ADD COLUMN separator_right BOOLEAN NOT NULL DEFAULT FALSE")


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs_layout_columns DROP COLUMN separator_left")
    op.execute("ALTER TABLE guitar_songs_layout_columns DROP COLUMN separator_right")
