"""Remove feature tables and decouple platform FKs

Revision ID: 002
Revises: 001
Create Date: 2026-06-17
"""
from alembic import op

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make project_document_id nullable in platform tables before dropping projects_documents
    op.execute("ALTER TABLE publications ALTER COLUMN project_document_id DROP NOT NULL")
    op.execute("ALTER TABLE document_pages ALTER COLUMN project_document_id DROP NOT NULL")

    # Drop feature_instance_id column from labels (purely decorative FK to projects_features)
    op.execute("ALTER TABLE labels DROP COLUMN IF EXISTS feature_instance_id")

    # Drop feature tables — CASCADE removes FK constraints in referencing tables
    op.execute("DROP TABLE IF EXISTS kanban_cards CASCADE")
    op.execute("DROP TABLE IF EXISTS kanban_columns CASCADE")
    op.execute("DROP TABLE IF EXISTS todo_items CASCADE")
    op.execute("DROP TABLE IF EXISTS user_tab_configs CASCADE")
    op.execute("DROP TABLE IF EXISTS user_bookmarks CASCADE")
    op.execute("DROP TABLE IF EXISTS projects_documents CASCADE")
    op.execute("DROP TABLE IF EXISTS tribes_projects CASCADE")
    op.execute("DROP TABLE IF EXISTS positions CASCADE")
    op.execute("DROP TABLE IF EXISTS projects_features CASCADE")
    op.execute("DROP TABLE IF EXISTS projects CASCADE")
    op.execute("DROP TABLE IF EXISTS tribes CASCADE")

    # Recreate labels unique index without the feature_instance_id partial condition
    op.execute("DROP INDEX IF EXISTS labels_name_global_unique")
    op.execute("DROP INDEX IF EXISTS labels_name_feature_unique")
    op.execute("DROP INDEX IF EXISTS idx_labels_feature_instance")
    op.execute("CREATE UNIQUE INDEX labels_name_global_unique ON labels (name)")


def downgrade() -> None:
    pass
