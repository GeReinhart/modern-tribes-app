"""One "Lyrics & Chords" layout block now holds exactly one song part -- the second layer of
labelling a section had of its own (type_label/custom_label, numbered into display_label) is
redundant with the layout's own blocks/columns/rows, and is dropped in favour of the block's own
title (custom_title/title_heading_level, already generic across every block type). No data
migration: existing sections simply lose their label, and existing multi-section blocks keep
rendering everything they already hold -- they just can no longer grow.

Revision ID: 021
Revises: 020
Create Date: 2026-08-09
"""
from alembic import op

revision = '021'
down_revision = '020'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE guitar_songs_sections DROP COLUMN IF EXISTS type_label")
    op.execute("ALTER TABLE guitar_songs_sections DROP COLUMN IF EXISTS custom_label")


def downgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs_sections ADD COLUMN IF NOT EXISTS type_label VARCHAR(100) NOT NULL DEFAULT 'Section'"
    )
    op.execute("ALTER TABLE guitar_songs_sections ALTER COLUMN type_label DROP DEFAULT")
    op.execute("ALTER TABLE guitar_songs_sections ADD COLUMN IF NOT EXISTS custom_label VARCHAR(200)")
