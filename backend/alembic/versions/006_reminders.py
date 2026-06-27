"""Replace events_reminders with generic reminders table (entity_type/entity_id)

Revision ID: 006
Revises: 005
Create Date: 2026-07-01
"""
from alembic import op

revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        CREATE TABLE reminders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_type VARCHAR(50) NOT NULL
                CHECK (entity_type IN ('event', 'todo_item', 'kanban_card')),
            entity_id UUID NOT NULL,
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
    op.execute("CREATE INDEX idx_reminders_entity ON reminders(entity_type, entity_id)")
    op.execute("CREATE INDEX idx_reminders_remind_at ON reminders(remind_at) WHERE sent = FALSE")
    op.execute("""
        CREATE OR REPLACE TRIGGER update_reminders_updated_at
        BEFORE UPDATE ON reminders
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)

    op.execute("""
        INSERT INTO reminders (id, entity_type, entity_id, remind_at, reminder_type,
                               sent, status, created_at, updated_at, created_by, updated_by)
        SELECT id, 'event', event_id, remind_at, reminder_type,
               sent, status, created_at, updated_at, created_by, updated_by
        FROM events_reminders
    """)

    op.drop_constraint('fk_notifications_reminder_id', 'notifications', type_='foreignkey')
    op.create_foreign_key(
        'fk_notifications_reminder_id',
        'notifications', 'reminders',
        ['reminder_id'], ['id'],
    )

    op.execute("DROP INDEX IF EXISTS idx_events_reminders_remind_at")
    op.drop_table('events_reminders')


def downgrade():
    op.execute("""
        CREATE TABLE events_reminders (
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
    op.execute(
        "CREATE INDEX idx_events_reminders_remind_at ON events_reminders(remind_at) WHERE sent = FALSE"
    )
    op.execute("""
        INSERT INTO events_reminders (id, event_id, remind_at, reminder_type,
                                      sent, status, created_at, updated_at, created_by, updated_by)
        SELECT id, entity_id, remind_at, reminder_type,
               sent, status, created_at, updated_at, created_by, updated_by
        FROM reminders WHERE entity_type = 'event'
    """)

    op.drop_constraint('fk_notifications_reminder_id', 'notifications', type_='foreignkey')
    op.create_foreign_key(
        'fk_notifications_reminder_id',
        'notifications', 'events_reminders',
        ['reminder_id'], ['id'],
    )

    op.execute("DROP INDEX IF EXISTS idx_reminders_remind_at")
    op.execute("DROP INDEX IF EXISTS idx_reminders_entity")
    op.drop_table('reminders')
