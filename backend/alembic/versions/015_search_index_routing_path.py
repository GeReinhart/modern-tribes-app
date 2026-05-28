"""Refactor search_index to be entity-agnostic using routing_path

Revision ID: 015
Revises: 014
Create Date: 2026-05-28
"""
from alembic import op

revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE search_index ADD COLUMN routing_path TEXT")

    op.execute("""
        UPDATE search_index si
        SET routing_path = CASE
            WHEN si.project_document_id IS NOT NULL AND si.project_id IS NOT NULL
                THEN '/app/tribes/' || t.url_param_id
                     || '/projects/' || p.url_param_id
                     || '/documents/' || si.project_document_id
            WHEN si.project_id IS NOT NULL
                THEN '/app/tribes/' || t.url_param_id
                     || '/projects/' || p.url_param_id
            ELSE '/app/tribes/' || t.url_param_id
        END
        FROM tribes t
        LEFT JOIN projects p ON p.id = si.project_id
        WHERE t.id = si.tribe_id
    """)

    op.execute("DROP INDEX IF EXISTS idx_search_index_tribe")
    op.execute("ALTER TABLE search_index DROP COLUMN tribe_id")
    op.execute("ALTER TABLE search_index DROP COLUMN project_id")
    op.execute("ALTER TABLE search_index DROP COLUMN project_document_id")
    op.execute("ALTER TABLE search_index DROP COLUMN page_url_param_id")

    op.execute("""
        CREATE INDEX idx_search_index_routing_path ON search_index(routing_path)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS search_index")
