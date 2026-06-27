"""Add scheduled_for and reminder_id to notifications

Revision ID: 005
Revises: 004
Create Date: 2026-06-29
"""
from alembic import op
import sqlalchemy as sa

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('notifications',
        sa.Column('scheduled_for', sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.add_column('notifications',
        sa.Column('reminder_id', sa.UUID(), nullable=True)
    )
    op.create_foreign_key(
        'fk_notifications_reminder_id',
        'notifications', 'events_reminders',
        ['reminder_id'], ['id']
    )
    op.create_index('idx_notifications_reminder_id', 'notifications', ['reminder_id'])


def downgrade():
    op.drop_index('idx_notifications_reminder_id', 'notifications')
    op.drop_constraint('fk_notifications_reminder_id', 'notifications', type_='foreignkey')
    op.drop_column('notifications', 'reminder_id')
    op.drop_column('notifications', 'scheduled_for')
