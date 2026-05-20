"""Add kanban_columns and kanban_cards tables

Revision ID: 002
Revises: 001
Create Date: 2026-05-20
"""
from alembic import op

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE kanban_columns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_kanban_columns_feature_instance ON kanban_columns(feature_instance_id)")
    op.execute("CREATE INDEX idx_kanban_columns_position ON kanban_columns(feature_instance_id, position)")
    op.execute("CREATE TRIGGER update_kanban_columns_updated_at BEFORE UPDATE ON kanban_columns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")

    op.execute("""
        CREATE TABLE kanban_cards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
            column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
            parent_card_id UUID REFERENCES kanban_cards(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            assigned_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            position INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_kanban_cards_feature_instance ON kanban_cards(feature_instance_id)")
    op.execute("CREATE INDEX idx_kanban_cards_column ON kanban_cards(column_id)")
    op.execute("CREATE INDEX idx_kanban_cards_parent ON kanban_cards(parent_card_id)")
    op.execute("CREATE TRIGGER update_kanban_cards_updated_at BEFORE UPDATE ON kanban_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS kanban_cards CASCADE")
    op.execute("DROP TABLE IF EXISTS kanban_columns CASCADE")
