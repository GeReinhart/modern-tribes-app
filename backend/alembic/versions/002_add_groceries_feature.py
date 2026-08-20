"""Groceries feature: an app-wide shared catalog (items/sections) plus per-project-tab
scheduled shopping lists. Renewal tracking is opted in per feature instance, since the
same item can need restocking at a different cadence per project.

Revision ID: 002
Revises: 001
Create Date: 2026-08-19
"""
from alembic import op

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    _create_groceries_catalog_tables()
    _create_groceries_list_tables()


def _create_groceries_catalog_tables() -> None:
    op.execute("""
        CREATE TABLE groceries_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            unit VARCHAR(20) NOT NULL CHECK (unit IN ('gram', 'kg', 'piece')),
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TABLE groceries_sections (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TABLE groceries_item_sections (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            groceries_item_id UUID REFERENCES groceries_items(id) ON DELETE CASCADE NOT NULL,
            groceries_section_id UUID REFERENCES groceries_sections(id) ON DELETE CASCADE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (groceries_item_id, groceries_section_id)
        )
    """)
    op.execute("CREATE INDEX idx_groceries_item_sections_item ON groceries_item_sections(groceries_item_id)")
    op.execute("CREATE INDEX idx_groceries_item_sections_section ON groceries_item_sections(groceries_section_id)")
    op.execute("CREATE TRIGGER update_groceries_items_updated_at BEFORE UPDATE ON groceries_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_groceries_sections_updated_at BEFORE UPDATE ON groceries_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_groceries_list_tables() -> None:
    op.execute("""
        CREATE TABLE groceries_instance_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            feature_instance_id UUID REFERENCES projects_features(id) ON DELETE CASCADE NOT NULL,
            groceries_item_id UUID REFERENCES groceries_items(id) ON DELETE CASCADE NOT NULL,
            renewal_duration_days INTEGER NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE (feature_instance_id, groceries_item_id)
        )
    """)
    op.execute("""
        CREATE TABLE groceries_lists (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            feature_instance_id UUID REFERENCES projects_features(id) ON DELETE CASCADE NOT NULL,
            name VARCHAR(255),
            scheduled_date DATE NOT NULL,
            list_status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (list_status IN ('planned', 'done')),
            assigned_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
            force_on_dashboard BOOLEAN NOT NULL DEFAULT FALSE,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TABLE groceries_list_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            groceries_list_id UUID REFERENCES groceries_lists(id) ON DELETE CASCADE NOT NULL,
            groceries_item_id UUID REFERENCES groceries_items(id) ON DELETE CASCADE NOT NULL,
            quantity NUMERIC(10, 2) NOT NULL,
            picked_up BOOLEAN NOT NULL DEFAULT FALSE,
            picked_up_at TIMESTAMP WITH TIME ZONE,
            position INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_groceries_instance_items_feature_instance ON groceries_instance_items(feature_instance_id)")
    op.execute("CREATE INDEX idx_groceries_lists_feature_instance_id ON groceries_lists(feature_instance_id)")
    op.execute("CREATE INDEX idx_groceries_list_items_list_id ON groceries_list_items(groceries_list_id)")
    op.execute("CREATE TRIGGER update_groceries_instance_items_updated_at BEFORE UPDATE ON groceries_instance_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_groceries_lists_updated_at BEFORE UPDATE ON groceries_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_groceries_list_items_updated_at BEFORE UPDATE ON groceries_list_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def downgrade() -> None:
    tables = [
        'groceries_list_items',
        'groceries_lists',
        'groceries_instance_items',
        'groceries_item_sections',
        'groceries_sections',
        'groceries_items',
    ]
    for table in tables:
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
