"""Add an optional difficulty level (0=easiest to 5=hardest) to guitar songs and to the shared
guitar chords inventory. Both are manually rated, independent scales -- a song's own difficulty
is not derived from its chords' difficulty.

Revision ID: 031
Revises: 030
Create Date: 2026-08-11
"""
from alembic import op

revision = '031'
down_revision = '030'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE guitar_songs ADD COLUMN difficulty SMALLINT NULL CHECK (difficulty BETWEEN 0 AND 5)")
    op.execute("ALTER TABLE guitar_chords ADD COLUMN difficulty SMALLINT NULL CHECK (difficulty BETWEEN 0 AND 5)")


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs DROP COLUMN difficulty")
    op.execute("ALTER TABLE guitar_chords DROP COLUMN difficulty")
