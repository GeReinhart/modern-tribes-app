"""An optional, free-form title for a section's own content -- distinct from the "Lyrics &
Chords" block's own title (custom_title, already generic across every block type). Where the
block's title names the block itself (shown in its own edit tab), this names the part's content
specifically (e.g. a comment on which verse this is), with no type/suggestion list and no
auto-numbering -- exactly the concept type_label/custom_label/display_label used to cover,
minus everything the earlier simplification (021) deliberately dropped.

Revision ID: 022
Revises: 021
Create Date: 2026-08-09
"""
from alembic import op

revision = '022'
down_revision = '021'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE guitar_songs_sections ADD COLUMN IF NOT EXISTS title VARCHAR(255)")


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs_sections DROP COLUMN IF EXISTS title")
