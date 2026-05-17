"""Add mails and mails_to tables

Revision ID: 008
Revises: 007
Create Date: 2026-05-17
"""

from alembic import op

revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE IF NOT EXISTS mails (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            subject VARCHAR(500) NOT NULL,
            content_html TEXT NOT NULL,
            mail_status VARCHAR(20) NOT NULL DEFAULT 'not_sent'
                CHECK (mail_status IN ('not_sent', 'sent')),
            planned_at TIMESTAMP WITH TIME ZONE NOT NULL,
            sent_at TIMESTAMP WITH TIME ZONE,
            status VARCHAR(20) NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS mails_to (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            mail_id UUID REFERENCES mails(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (mail_id, user_id)
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS idx_mails_status ON mails(status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_mails_mail_status ON mails(mail_status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_mails_planned_at ON mails(planned_at)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_mails_to_mail_id ON mails_to(mail_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_mails_to_user_id ON mails_to(user_id)")
    op.execute(
        "CREATE TRIGGER update_mails_updated_at BEFORE UPDATE ON mails "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
    )


def downgrade():
    op.execute("DROP TRIGGER IF EXISTS update_mails_updated_at ON mails")
    op.execute("DROP TABLE IF EXISTS mails_to CASCADE")
    op.execute("DROP TABLE IF EXISTS mails CASCADE")
