"""Unify kanban and todo labels into the global labels table

Revision ID: 006
Revises: 005
Create Date: 2026-05-22
"""
from alembic import op

revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Extend labels table to support feature-instance-scoped labels
    op.execute("ALTER TABLE labels ADD COLUMN feature_instance_id UUID REFERENCES projects_features(id) ON DELETE CASCADE")
    op.execute("ALTER TABLE labels ADD COLUMN color VARCHAR(20) NOT NULL DEFAULT '#6b7280'")
    op.execute("ALTER TABLE labels ADD COLUMN position INTEGER NOT NULL DEFAULT 0")

    # Replace the global UNIQUE(name) with per-scope unique constraints
    op.execute("ALTER TABLE labels DROP CONSTRAINT labels_name_key")
    op.execute("CREATE UNIQUE INDEX labels_name_global_unique ON labels (name) WHERE feature_instance_id IS NULL")
    op.execute("CREATE UNIQUE INDEX labels_name_feature_unique ON labels (name, feature_instance_id) WHERE feature_instance_id IS NOT NULL")
    op.execute("CREATE INDEX idx_labels_feature_instance ON labels (feature_instance_id)")

    # Migrate kanban labels (IDs preserved so label_entities FK holds during the INSERT below)
    op.execute("""
        INSERT INTO labels (id, name, color, position, feature_instance_id, status, created_at, updated_at, created_by, updated_by)
        SELECT id, name, color, position, feature_instance_id, 'active', created_at, updated_at, created_by, updated_by
        FROM kanban_labels
    """)

    # Migrate todo labels
    op.execute("""
        INSERT INTO labels (id, name, color, position, feature_instance_id, status, created_at, updated_at, created_by, updated_by)
        SELECT id, name, color, position, feature_instance_id, 'active', created_at, updated_at, created_by, updated_by
        FROM todo_labels
    """)

    # Migrate kanban card label associations into label_entities
    op.execute("""
        INSERT INTO label_entities (label_id, entity_type, entity_id)
        SELECT label_id, 'kanban_card', card_id FROM kanban_card_labels
    """)

    # Migrate todo item label associations into label_entities
    op.execute("""
        INSERT INTO label_entities (label_id, entity_type, entity_id)
        SELECT label_id, 'todo_item', item_id FROM todo_item_labels
    """)

    # Drop junction tables first (FK dependency order), then label tables
    op.execute("DROP TABLE kanban_card_labels")
    op.execute("DROP TABLE todo_item_labels")
    op.execute("DROP TABLE kanban_labels")
    op.execute("DROP TABLE todo_labels")


def downgrade() -> None:
    # Recreate old label tables (empty — data is not migrated back)
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
    op.execute("""
        CREATE TABLE kanban_card_labels (
            card_id UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
            label_id UUID NOT NULL REFERENCES kanban_labels(id) ON DELETE CASCADE,
            PRIMARY KEY (card_id, label_id)
        )
    """)
    op.execute("""
        CREATE TABLE todo_item_labels (
            item_id UUID NOT NULL REFERENCES todo_items(id) ON DELETE CASCADE,
            label_id UUID NOT NULL REFERENCES todo_labels(id) ON DELETE CASCADE,
            PRIMARY KEY (item_id, label_id)
        )
    """)

    # Remove feature-scoped labels and their associations from unified tables
    op.execute("DELETE FROM label_entities WHERE entity_type IN ('kanban_card', 'todo_item')")
    op.execute("DELETE FROM labels WHERE feature_instance_id IS NOT NULL")

    # Restore constraints on labels table
    op.execute("DROP INDEX idx_labels_feature_instance")
    op.execute("DROP INDEX labels_name_feature_unique")
    op.execute("DROP INDEX labels_name_global_unique")
    op.execute("ALTER TABLE labels DROP COLUMN position")
    op.execute("ALTER TABLE labels DROP COLUMN color")
    op.execute("ALTER TABLE labels DROP COLUMN feature_instance_id")
    op.execute("ALTER TABLE labels ADD CONSTRAINT labels_name_key UNIQUE (name)")
