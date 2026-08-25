"""Recipes: a per-project-tab recipe book with a serving count and an ingredient list
(catalog articles with a quantity, or one-off custom ingredients — same shape as a
groceries list item).

Meals: a per-project-tab planning entry with a date range, a headcount and named
participants, optionally linking 0..N recipes. Meals is the bridge to groceries:
it reads groceries_lists/groceries_items directly (read-only) to compute shopping
suggestions, so groceries and recipes stay untouched by this feature.

Revision ID: 008
Revises: 007
Create Date: 2026-08-25
"""
from alembic import op

revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    _create_recipes_tables()
    _create_meals_tables()


def _create_recipes_tables() -> None:
    op.execute("""
        CREATE TABLE recipes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            feature_instance_id UUID REFERENCES projects_features(id) ON DELETE CASCADE NOT NULL,
            name VARCHAR(255) NOT NULL,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            servings INTEGER NOT NULL CHECK (servings > 0),
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TABLE recipe_ingredients (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
            groceries_item_id UUID REFERENCES groceries_items(id) ON DELETE CASCADE,
            custom_name VARCHAR(255),
            custom_unit VARCHAR(50),
            quantity NUMERIC(10, 2) NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            CONSTRAINT recipe_ingredients_source_check CHECK (groceries_item_id IS NOT NULL OR custom_name IS NOT NULL)
        )
    """)
    op.execute("CREATE INDEX idx_recipes_feature_instance ON recipes(feature_instance_id)")
    op.execute("CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id)")
    op.execute("CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_recipe_ingredients_updated_at BEFORE UPDATE ON recipe_ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_meals_tables() -> None:
    op.execute("""
        CREATE TABLE meals (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            feature_instance_id UUID REFERENCES projects_features(id) ON DELETE CASCADE NOT NULL,
            title VARCHAR(500) NOT NULL,
            start_at TIMESTAMP WITH TIME ZONE NOT NULL,
            end_at TIMESTAMP WITH TIME ZONE NOT NULL,
            headcount INTEGER NOT NULL CHECK (headcount >= 0),
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TABLE meal_participants (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            meal_id UUID REFERENCES meals(id) ON DELETE CASCADE NOT NULL,
            person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE (meal_id, person_id)
        )
    """)
    op.execute("""
        CREATE TABLE meal_recipes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            meal_id UUID REFERENCES meals(id) ON DELETE CASCADE NOT NULL,
            recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (meal_id, recipe_id)
        )
    """)
    op.execute("CREATE INDEX idx_meals_feature_instance ON meals(feature_instance_id)")
    op.execute("CREATE INDEX idx_meals_start_at ON meals(start_at)")
    op.execute("CREATE INDEX idx_meal_participants_meal ON meal_participants(meal_id)")
    op.execute("CREATE INDEX idx_meal_recipes_meal ON meal_recipes(meal_id)")
    op.execute("CREATE INDEX idx_meal_recipes_recipe ON meal_recipes(recipe_id)")
    op.execute("CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_meal_participants_updated_at BEFORE UPDATE ON meal_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def downgrade() -> None:
    tables = [
        'meal_recipes',
        'meal_participants',
        'meals',
        'recipe_ingredients',
        'recipes',
    ]
    for table in tables:
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
