"""Add song_state to guitar_songs: an editorial draft/completed state, distinct from the
generic status column. A completed song locks its content (title, layout, videos...) and only
exposes the read-only presentation screen, until it is set back to draft.

Revision ID: 030
Revises: 029
Create Date: 2026-08-11
"""
from alembic import op

revision = '030'
down_revision = '029'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs ADD COLUMN song_state VARCHAR(20) NOT NULL DEFAULT 'draft' "
        "CHECK (song_state IN ('draft', 'completed'))"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs DROP COLUMN song_state")
