"""Seed the languages reference table (French, English, German) so the Learn Language
feature has usable language codes right after migrating, without depending on the
dev-only seed script (mirrors how guitar_chords is seeded directly in 001_initial_schema).

Revision ID: 026
Revises: 025
Create Date: 2026-11-02
"""
from alembic import op

revision = '026'
down_revision = '025'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO languages (code, name) VALUES
            ('fr', 'French'),
            ('en', 'English'),
            ('de', 'German')
        ON CONFLICT (code) DO NOTHING
    """)


def downgrade() -> None:
    op.execute("DELETE FROM languages WHERE code IN ('fr', 'en', 'de')")
