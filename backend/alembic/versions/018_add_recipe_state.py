"""Recipes can now be marked as a draft while still being worked on, or completed once
finished. This is a plain editorial flag (no content-locking, unlike the guitar songs'
song_state) used only for display and list filtering. Existing recipes are backfilled as
completed (assumed already finished); new recipes start as draft.

Revision ID: 018
Revises: 017
Create Date: 2026-08-31
"""
from alembic import op

revision = '018'
down_revision = '017'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE recipes ADD COLUMN recipe_state VARCHAR(20) NOT NULL DEFAULT 'completed' "
        "CHECK (recipe_state IN ('draft', 'completed'))"
    )
    op.execute("ALTER TABLE recipes ALTER COLUMN recipe_state SET DEFAULT 'draft'")


def downgrade() -> None:
    op.execute("ALTER TABLE recipes DROP COLUMN recipe_state")
