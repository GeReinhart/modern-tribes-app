"""Add refresh token and missing columns to user_sessions

Revision ID: 003
Revises: 002
Create Date: 2026-05-13

"""
from alembic import op

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add columns that may be missing from initial schema
    op.execute("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT")
    op.execute("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45)")
    op.execute("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP")

    # Add refresh token support
    op.execute("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR(255)")
    op.execute("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP WITH TIME ZONE")

    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash) WHERE refresh_token_hash IS NOT NULL")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_user_sessions_refresh_token")
    op.execute("ALTER TABLE user_sessions DROP COLUMN IF EXISTS refresh_token_expires_at")
    op.execute("ALTER TABLE user_sessions DROP COLUMN IF EXISTS refresh_token_hash")
    op.execute("ALTER TABLE user_sessions DROP COLUMN IF EXISTS last_activity")
    op.execute("ALTER TABLE user_sessions DROP COLUMN IF EXISTS ip_address")
    op.execute("ALTER TABLE user_sessions DROP COLUMN IF EXISTS user_agent")
