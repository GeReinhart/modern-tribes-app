"""Add user_bookmarks table

Revision ID: 008
Revises: 007
Create Date: 2026-05-23
"""
from alembic import op

revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE user_bookmarks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            page_path VARCHAR(500) NOT NULL,
            page_title VARCHAR(200) NOT NULL,
            display_order INT NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(user_id, page_path)
        )
    """)
    op.execute(
        "CREATE TRIGGER update_user_bookmarks_updated_at "
        "BEFORE UPDATE ON user_bookmarks "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_user_bookmarks_updated_at ON user_bookmarks")
    op.execute("DROP TABLE IF EXISTS user_bookmarks")
