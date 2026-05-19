"""Add project_feature_instances table

Revision ID: 017
Revises: 016
Create Date: 2026-05-19

"""
from alembic import op

revision = '017'
down_revision = '016'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE project_feature_instances (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
            feature_type VARCHAR(100) NOT NULL,
            name VARCHAR(255) NOT NULL,
            status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
            position INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_project_feature_instances_project_id ON project_feature_instances(project_id)")
    op.execute("CREATE TRIGGER update_project_feature_instances_updated_at BEFORE UPDATE ON project_feature_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_project_feature_instances_updated_at ON project_feature_instances")
    op.execute("DROP TABLE IF EXISTS project_feature_instances CASCADE")
