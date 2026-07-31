"""Add guitar_chords table

Revision ID: 012
Revises: 011
Create Date: 2026-07-31
"""
from alembic import op

revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_chords (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(50) NOT NULL,
            root_note VARCHAR(3) NOT NULL,
            description TEXT,
            frets JSONB NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_chords_updated_at
        BEFORE UPDATE ON guitar_chords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS guitar_chords")
