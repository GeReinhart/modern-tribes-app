"""Add toc_depth to projects_documents

Revision ID: 013
Revises: 012
Create Date: 2026-05-24
"""
from alembic import op

revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE projects_documents
        ADD COLUMN toc_depth INTEGER NOT NULL DEFAULT 4
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE projects_documents
        DROP COLUMN toc_depth
    """)
