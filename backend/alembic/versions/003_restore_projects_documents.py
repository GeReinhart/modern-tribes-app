"""Restore projects_documents as a platform table

projects_documents was accidentally dropped in migration 002. It is used by
platform publications, documents (page router) and search — not a feature table.
This migration re-creates it without the FK to projects (which no longer exists).

Revision ID: 003
Revises: 002
Create Date: 2026-06-18
"""
from alembic import op

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS projects_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            project_id UUID NULL,
            document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            toc_depth INTEGER NOT NULL DEFAULT 4,
            status VARCHAR(50) NOT NULL DEFAULT 'active'
                CONSTRAINT projects_documents_status_check CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id),
            updated_by UUID REFERENCES users(id)
        )
    """)

    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_projects_documents_url_param_id "
        "ON projects_documents(url_param_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_projects_documents_document_id "
        "ON projects_documents(document_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_projects_documents_status "
        "ON projects_documents(status)"
    )

    op.execute("""
        CREATE OR REPLACE TRIGGER update_projects_documents_updated_at
        BEFORE UPDATE ON projects_documents
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS projects_documents CASCADE")
