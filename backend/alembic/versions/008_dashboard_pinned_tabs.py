"""Add dashboard_pinned_tabs table

Revision ID: 008
Revises: 007
Create Date: 2026-07-02
"""
from alembic import op

revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS dashboard_pinned_tabs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            bookmark_id UUID NOT NULL REFERENCES user_bookmarks(id),
            display_order INT NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            CONSTRAINT uq_user_bookmark_pinned UNIQUE(user_id, bookmark_id)
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_dashboard_pinned_tabs_updated_at
        BEFORE UPDATE ON dashboard_pinned_tabs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS dashboard_pinned_tabs")
