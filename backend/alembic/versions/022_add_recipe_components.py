"""Add recipe_components table, linking a recipe to a reusable sub-recipe (e.g. a Tarte
using a Pâte à Tarte) with its own multiplier.

Revision ID: 022
Revises: 021
Create Date: 2026-09-10
"""
from alembic import op

revision = '022'
down_revision = '021'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE recipe_components (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            parent_recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
            component_recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
            multiplier NUMERIC(6, 2) NOT NULL DEFAULT 1 CHECK (multiplier > 0),
            position INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            CONSTRAINT recipe_components_no_self_reference CHECK (parent_recipe_id <> component_recipe_id),
            UNIQUE (parent_recipe_id, component_recipe_id)
        )
    """)
    op.execute("CREATE INDEX idx_recipe_components_parent ON recipe_components (parent_recipe_id)")
    op.execute("CREATE INDEX idx_recipe_components_component ON recipe_components (component_recipe_id)")
    op.execute(
        "CREATE TRIGGER update_recipe_components_updated_at BEFORE UPDATE ON recipe_components "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
    )


def downgrade() -> None:
    op.execute("DROP TABLE recipe_components")
