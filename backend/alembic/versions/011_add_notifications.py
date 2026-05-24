"""Add notifications table

Revision ID: 011
Revises: 010
Create Date: 2026-05-25
"""
from alembic import op

revision = '011'
down_revision = '010'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url_param_id VARCHAR(12) UNIQUE NOT NULL,
            target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            sent_at TIMESTAMP WITH TIME ZONE NULL,
            notification_status VARCHAR(20) NOT NULL DEFAULT 'planned'
                CHECK (notification_status IN ('planned', 'sent', 'failed')),
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_notifications_target_status ON notifications(target_user_id, notification_status)")
    op.execute("CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS notifications CASCADE")
