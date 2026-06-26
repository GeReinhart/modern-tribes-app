"""Add events, events_participants, events_reminders tables

Revision ID: 002
Revises: 001
Create Date: 2026-06-23
"""
from alembic import op

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            start_at TIMESTAMP WITH TIME ZONE NOT NULL,
            end_at TIMESTAMP WITH TIME ZONE NOT NULL,
            all_day BOOLEAN NOT NULL DEFAULT FALSE,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            size INTEGER CHECK (size > 0),
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_feature_instance ON events(feature_instance_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at)")
    op.execute("""
        CREATE OR REPLACE TRIGGER update_events_updated_at
        BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS events_participants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(event_id, person_id)
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_events_participants_updated_at
        BEFORE UPDATE ON events_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS events_reminders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
            reminder_type VARCHAR(20) NOT NULL DEFAULT 'notification'
                CHECK (reminder_type IN ('notification', 'mail')),
            sent BOOLEAN NOT NULL DEFAULT FALSE,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_events_reminders_remind_at
        ON events_reminders(remind_at) WHERE sent = FALSE
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_events_reminders_updated_at
        BEFORE UPDATE ON events_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS events_reminders")
    op.execute("DROP TABLE IF EXISTS events_participants")
    op.execute("DROP TABLE IF EXISTS events")
