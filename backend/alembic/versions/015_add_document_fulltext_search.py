"""Add full-text search support to documents

Revision ID: 015
Revises: 014
Create Date: 2026-05-19

"""
from alembic import op

revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE documents ADD COLUMN content_text TEXT")

    op.execute("""
        UPDATE documents
        SET content_text = trim(regexp_replace(COALESCE(content_html, ''), '<[^>]+>', ' ', 'g'))
        WHERE content_html IS NOT NULL
    """)

    op.execute("""
        CREATE INDEX idx_documents_content_fts
        ON documents USING GIN(to_tsvector('french', COALESCE(content_text, '')))
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_documents_content_fts")
    op.execute("ALTER TABLE documents DROP COLUMN content_text")
