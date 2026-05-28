"""Add user_tab_configs table

Revision ID: 007
Revises: 006
Create Date: 2026-05-23
"""
from alembic import op

revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE user_tab_configs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            context_key VARCHAR(100) NOT NULL,
            tab_configs JSONB NOT NULL DEFAULT '[]',
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(user_id, context_key)
        )
    """)
    op.execute(
        "CREATE TRIGGER update_user_tab_configs_updated_at "
        "BEFORE UPDATE ON user_tab_configs "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_user_tab_configs_updated_at ON user_tab_configs")
    op.execute("DROP TABLE IF EXISTS user_tab_configs")
