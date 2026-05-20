"""Add projects_documents table

Revision ID: 022
Revises: 021
Create Date: 2026-05-20

"""
from alembic import op

revision = '022'
down_revision = '021'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE projects_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id),
            updated_by UUID REFERENCES users(id),
            CONSTRAINT projects_documents_status_check CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)
    op.execute("CREATE INDEX idx_projects_documents_project_id ON projects_documents(project_id)")
    op.execute("CREATE INDEX idx_projects_documents_document_id ON projects_documents(document_id)")
    op.execute("CREATE INDEX idx_projects_documents_status ON projects_documents(status)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_projects_documents_status")
    op.execute("DROP INDEX IF EXISTS idx_projects_documents_document_id")
    op.execute("DROP INDEX IF EXISTS idx_projects_documents_project_id")
    op.execute("DROP TABLE IF EXISTS projects_documents")
