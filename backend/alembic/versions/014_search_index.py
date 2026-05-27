"""Add search_index table

Revision ID: 014
Revises: 013
Create Date: 2026-05-27
"""
from alembic import op

revision = '014'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE search_index (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_type VARCHAR(100) NOT NULL,
            entity_id UUID NOT NULL,
            content_text TEXT,
            content_summary TEXT,
            tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            project_document_id VARCHAR(6),
            page_url_param_id VARCHAR(6),
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CONSTRAINT search_index_status_check CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE (entity_type, entity_id)
        )
    """)
    op.execute("""
        CREATE INDEX idx_search_index_entity ON search_index(entity_type, entity_id)
    """)
    op.execute("""
        CREATE INDEX idx_search_index_tribe ON search_index(tribe_id)
    """)
    op.execute("""
        CREATE INDEX idx_search_index_content_fts
            ON search_index USING GIN(to_tsvector('french', COALESCE(content_text, '')))
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_search_index_updated_at
            BEFORE UPDATE ON search_index
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)

    # Populate from tribe documents
    op.execute("""
        INSERT INTO search_index
            (entity_type, entity_id, content_text, content_summary, tribe_id, project_id,
             project_document_id, page_url_param_id, status)
        SELECT 'document', d.id, d.content_text, d.content_summary,
               t.id, NULL, NULL, NULL, 'active'
        FROM documents d
        JOIN tribes t ON t.document_id = d.id AND t.status = 'active'
        WHERE d.status = 'active' AND d.content_text IS NOT NULL AND d.content_text != ''
        ON CONFLICT (entity_type, entity_id) DO NOTHING
    """)

    # Populate from project documents
    op.execute("""
        INSERT INTO search_index
            (entity_type, entity_id, content_text, content_summary, tribe_id, project_id,
             project_document_id, page_url_param_id, status)
        SELECT 'document', d.id, d.content_text, d.content_summary,
               t.id, proj.id, NULL, NULL, 'active'
        FROM documents d
        JOIN projects proj ON proj.document_id = d.id AND proj.status = 'active'
        JOIN tribes_projects tp ON tp.project_id = proj.id
        JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
        WHERE d.status = 'active' AND d.content_text IS NOT NULL AND d.content_text != ''
        ON CONFLICT (entity_type, entity_id) DO NOTHING
    """)

    # Populate from projects_documents
    op.execute("""
        INSERT INTO search_index
            (entity_type, entity_id, content_text, content_summary, tribe_id, project_id,
             project_document_id, page_url_param_id, status)
        SELECT 'document', d.id, d.content_text, d.content_summary,
               t.id, proj.id, pd.url_param_id, NULL, 'active'
        FROM documents d
        JOIN projects_documents pd ON pd.document_id = d.id AND pd.status = 'active'
        JOIN projects proj ON proj.id = pd.project_id AND proj.status = 'active'
        JOIN tribes_projects tp ON tp.project_id = proj.id
        JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
        WHERE d.status = 'active' AND d.content_text IS NOT NULL AND d.content_text != ''
        ON CONFLICT (entity_type, entity_id) DO NOTHING
    """)

    # Populate from document_pages
    op.execute("""
        INSERT INTO search_index
            (entity_type, entity_id, content_text, content_summary, tribe_id, project_id,
             project_document_id, page_url_param_id, status)
        SELECT 'page', dp.id, dp.content_text, dp.content_summary,
               t.id, proj.id, pd.url_param_id, dp.url_param_id, 'active'
        FROM document_pages dp
        JOIN projects_documents pd ON pd.id = dp.project_document_id AND pd.status = 'active'
        JOIN projects proj ON proj.id = pd.project_id AND proj.status = 'active'
        JOIN tribes_projects tp ON tp.project_id = proj.id
        JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
        WHERE dp.status = 'active' AND dp.content_text IS NOT NULL AND dp.content_text != ''
        ON CONFLICT (entity_type, entity_id) DO NOTHING
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS search_index")
