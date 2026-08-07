"""Let a song section be a live link to another section of the same song -- its lyrics/chords
are always read from (and edited through to) the linked section, so identical refrains only
need to be typed once and stay in sync everywhere they're placed.

Revision ID: 017
Revises: 016
Create Date: 2026-08-06
"""
from alembic import op

revision = '017'
down_revision = '016'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs_sections ADD COLUMN IF NOT EXISTS linked_to_section_id UUID "
        "REFERENCES guitar_songs_sections(id) ON DELETE SET NULL"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_guitar_songs_sections_linked_to "
        "ON guitar_songs_sections(linked_to_section_id)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_guitar_songs_sections_linked_to")
    op.execute("ALTER TABLE guitar_songs_sections DROP COLUMN IF EXISTS linked_to_section_id")
