"""A meal can have a rich-text description, same document-linking pattern as
events and recipes.

Revision ID: 011
Revises: 010
Create Date: 2026-08-26
"""
from alembic import op

revision = '011'
down_revision = '010'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE meals ADD COLUMN document_id UUID REFERENCES documents(id) ON DELETE SET NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE meals DROP COLUMN document_id")
