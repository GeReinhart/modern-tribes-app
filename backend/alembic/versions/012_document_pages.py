"""Add document_pages table

Revision ID: 012
Revises: 011
Create Date: 2026-05-24
"""
from alembic import op

revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE document_pages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            project_document_id UUID NOT NULL REFERENCES projects_documents(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            content_html TEXT NOT NULL DEFAULT '',
            content_summary TEXT,
            content_text TEXT,
            attachments JSONB NOT NULL DEFAULT '[]',
            revisions JSONB NOT NULL DEFAULT '[]',
            order_index INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(50) NOT NULL DEFAULT 'active'
                CONSTRAINT document_pages_status_check CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE INDEX idx_document_pages_project_document_id ON document_pages(project_document_id)
    """)
    op.execute("""
        CREATE INDEX idx_document_pages_status ON document_pages(project_document_id, status)
    """)
    op.execute("""
        CREATE INDEX idx_document_pages_content_fts
            ON document_pages USING GIN(to_tsvector('french', COALESCE(content_text, '')))
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_document_pages_updated_at
            BEFORE UPDATE ON document_pages
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS document_pages")
