"""Replace tribe_projects with tribes_projects (adds id and relation field)

Revision ID: 011
Revises: 010
Create Date: 2026-05-18
"""
from alembic import op

revision = '011'
down_revision = '010'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("DROP TABLE IF EXISTS tribe_projects CASCADE")
    op.execute("""
        CREATE TABLE tribes_projects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE NOT NULL,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
            relation VARCHAR(20) NOT NULL CHECK (relation IN ('manager', 'member', 'guest')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (tribe_id, project_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_tribes_projects_tribe_id ON tribes_projects(tribe_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_tribes_projects_project_id ON tribes_projects(project_id)")


def downgrade():
    op.execute("DROP TABLE IF EXISTS tribes_projects CASCADE")
    op.execute("""
        CREATE TABLE tribe_projects (
            tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            PRIMARY KEY (tribe_id, project_id)
        )
    """)
