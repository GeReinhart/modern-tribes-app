"""Track which meals have already had their ingredients added to a groceries list,
and for what headcount at the time — so the suggestions view can grey out a meal
that was already incorporated instead of suggesting it again.

Revision ID: 009
Revises: 008
Create Date: 2026-08-25
"""
from alembic import op

revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE groceries_list_meals (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            groceries_list_id UUID REFERENCES groceries_lists(id) ON DELETE CASCADE NOT NULL,
            meal_id UUID REFERENCES meals(id) ON DELETE CASCADE NOT NULL,
            headcount INTEGER NOT NULL CHECK (headcount >= 0),
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE (groceries_list_id, meal_id)
        )
    """)
    op.execute("CREATE INDEX idx_groceries_list_meals_list ON groceries_list_meals(groceries_list_id)")
    op.execute("CREATE INDEX idx_groceries_list_meals_meal ON groceries_list_meals(meal_id)")
    op.execute("CREATE TRIGGER update_groceries_list_meals_updated_at BEFORE UPDATE ON groceries_list_meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS groceries_list_meals CASCADE")
