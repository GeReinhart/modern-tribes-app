"""Add journal_blocks table

Revision ID: 007
Revises: 006
Create Date: 2026-07-01
"""
from alembic import op

revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS journal_blocks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            position INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_journal_blocks_feature_date ON journal_blocks(feature_instance_id, date)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_journal_blocks_feature_status ON journal_blocks(feature_instance_id, status)")
    op.execute("""
        CREATE OR REPLACE TRIGGER update_journal_blocks_updated_at
        BEFORE UPDATE ON journal_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS journal_blocks")
