"""Add revisions column to documents

Revision ID: 014
Revises: 013
Create Date: 2026-05-19
"""

from alembic import op

revision = '014'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "ALTER TABLE documents ADD COLUMN IF NOT EXISTS "
        "revisions JSONB NOT NULL DEFAULT '[]'"
    )


def downgrade():
    op.execute("ALTER TABLE documents DROP COLUMN IF EXISTS revisions")
