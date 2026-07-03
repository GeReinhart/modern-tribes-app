"""Add user_quick_add_defaults table

Revision ID: 010
Revises: 009
Create Date: 2026-07-03
"""
from alembic import op

revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_quick_add_defaults (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            quick_add_type VARCHAR(20) NOT NULL CHECK (quick_add_type IN ('task', 'event')),
            feature_instance_id UUID REFERENCES projects_features(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(user_id, quick_add_type)
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_user_quick_add_defaults_updated_at
        BEFORE UPDATE ON user_quick_add_defaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS user_quick_add_defaults")
