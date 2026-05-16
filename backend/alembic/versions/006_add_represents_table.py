"""Add represents table

Revision ID: 006
Revises: 005
Create Date: 2026-05-16
"""

from alembic import op

revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS represents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE (user_id),
            UNIQUE (person_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_represents_user_id ON represents(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_represents_person_id ON represents(person_id)")
    op.execute(
        "CREATE TRIGGER update_represents_updated_at BEFORE UPDATE ON represents "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
    )


def downgrade():
    op.execute("DROP TRIGGER IF EXISTS update_represents_updated_at ON represents")
    op.execute("DROP TABLE IF EXISTS represents CASCADE")
