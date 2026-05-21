"""Add kanban_labels, kanban_card_labels, and card size

Revision ID: 003
Revises: 002
Create Date: 2026-05-21
"""
from alembic import op

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE kanban_cards ADD COLUMN size INTEGER")

    op.execute("""
        CREATE TABLE kanban_labels (
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
    op.execute("CREATE INDEX idx_kanban_labels_feature_instance ON kanban_labels(feature_instance_id)")
    op.execute("CREATE TRIGGER update_kanban_labels_updated_at BEFORE UPDATE ON kanban_labels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")

    op.execute("""
        CREATE TABLE kanban_card_labels (
            card_id UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
            label_id UUID NOT NULL REFERENCES kanban_labels(id) ON DELETE CASCADE,
            PRIMARY KEY (card_id, label_id)
        )
    """)
    op.execute("CREATE INDEX idx_kanban_card_labels_card ON kanban_card_labels(card_id)")
    op.execute("CREATE INDEX idx_kanban_card_labels_label ON kanban_card_labels(label_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS kanban_card_labels CASCADE")
    op.execute("DROP TABLE IF EXISTS kanban_labels CASCADE")
    op.execute("ALTER TABLE kanban_cards DROP COLUMN IF EXISTS size")
