"""Keep the previous refresh token of a session for a short grace window after its rotation, so two
tabs of the same device refreshing at once do not invalidate each other.

Revision ID: 031
Revises: 030
Create Date: 2026-11-03
"""
from alembic import op

revision = '031'
down_revision = '030'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE user_sessions ADD COLUMN previous_refresh_token_hash VARCHAR(255)")
    op.execute("ALTER TABLE user_sessions ADD COLUMN previous_rotated_at TIMESTAMP WITH TIME ZONE")
    op.execute(
        "CREATE INDEX idx_user_sessions_previous_refresh_token "
        "ON user_sessions(previous_refresh_token_hash) WHERE previous_refresh_token_hash IS NOT NULL"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_user_sessions_previous_refresh_token")
    op.execute("ALTER TABLE user_sessions DROP COLUMN previous_rotated_at")
    op.execute("ALTER TABLE user_sessions DROP COLUMN previous_refresh_token_hash")
