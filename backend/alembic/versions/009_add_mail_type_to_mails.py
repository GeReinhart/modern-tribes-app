"""add mail_type to mails

Revision ID: 009
Revises: 008
Create Date: 2026-05-17
"""
from alembic import op
import sqlalchemy as sa

revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('mails', sa.Column('mail_type', sa.String(50), nullable=True))
    op.create_index('ix_mails_mail_type', 'mails', ['mail_type'])


def downgrade():
    op.drop_index('ix_mails_mail_type', table_name='mails')
    op.drop_column('mails', 'mail_type')
