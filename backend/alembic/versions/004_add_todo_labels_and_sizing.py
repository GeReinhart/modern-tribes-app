"""Add todo_labels, todo_item_labels, size and assignee to todo_items

Revision ID: 004
Revises: 003
Create Date: 2026-05-22
"""
from alembic import op

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE todo_items ADD COLUMN size INTEGER")
    op.execute("ALTER TABLE todo_items ADD COLUMN assigned_person_id UUID REFERENCES persons(id) ON DELETE SET NULL")

    op.execute("""
        CREATE TABLE todo_labels (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            color VARCHAR(20) NOT NULL DEFAULT '#6b7280',
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_todo_labels_feature_instance ON todo_labels(feature_instance_id)")
    op.execute("CREATE TRIGGER update_todo_labels_updated_at BEFORE UPDATE ON todo_labels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")

    op.execute("""
        CREATE TABLE todo_item_labels (
            item_id UUID NOT NULL REFERENCES todo_items(id) ON DELETE CASCADE,
            label_id UUID NOT NULL REFERENCES todo_labels(id) ON DELETE CASCADE,
            PRIMARY KEY (item_id, label_id)
        )
    """)
    op.execute("CREATE INDEX idx_todo_item_labels_item ON todo_item_labels(item_id)")
    op.execute("CREATE INDEX idx_todo_item_labels_label ON todo_item_labels(label_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS todo_item_labels CASCADE")
    op.execute("DROP TABLE IF EXISTS todo_labels CASCADE")
    op.execute("ALTER TABLE todo_items DROP COLUMN IF EXISTS assigned_person_id")
    op.execute("ALTER TABLE todo_items DROP COLUMN IF EXISTS size")
