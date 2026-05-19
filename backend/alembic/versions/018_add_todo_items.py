"""Add todo_items table

Revision ID: 018
Revises: 017
Create Date: 2026-05-19

"""
from alembic import op

revision = '018'
down_revision = '017'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE todo_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            feature_instance_id UUID REFERENCES project_feature_instances(id) ON DELETE CASCADE NOT NULL,
            title VARCHAR(500) NOT NULL,
            status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'done')),
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            position INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_todo_items_feature_instance_id ON todo_items(feature_instance_id)")
    op.execute("CREATE TRIGGER update_todo_items_updated_at BEFORE UPDATE ON todo_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_todo_items_updated_at ON todo_items")
    op.execute("DROP TABLE IF EXISTS todo_items CASCADE")
