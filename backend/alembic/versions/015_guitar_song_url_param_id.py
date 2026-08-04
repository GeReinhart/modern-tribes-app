"""Add url_param_id to guitar_songs, so a song can have its own page

Revision ID: 015
Revises: 014
Create Date: 2026-08-04
"""
import random
import string

import sqlalchemy as sa
from alembic import op

revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None

_CHARS = string.ascii_letters + string.digits


def _generate_url_param_id() -> str:
    return ''.join(random.choices(_CHARS, k=6))


def upgrade() -> None:
    op.execute("ALTER TABLE guitar_songs ADD COLUMN IF NOT EXISTS url_param_id VARCHAR(6)")

    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id FROM guitar_songs WHERE url_param_id IS NULL")).fetchall()
    for row in rows:
        candidate = _generate_url_param_id()
        while conn.execute(
            sa.text("SELECT 1 FROM guitar_songs WHERE url_param_id = :v"), {"v": candidate}
        ).fetchone():
            candidate = _generate_url_param_id()
        conn.execute(
            sa.text("UPDATE guitar_songs SET url_param_id = :v WHERE id = :id"),
            {"v": candidate, "id": row[0]},
        )

    op.execute("ALTER TABLE guitar_songs ALTER COLUMN url_param_id SET NOT NULL")
    op.execute(
        "ALTER TABLE guitar_songs ADD CONSTRAINT guitar_songs_url_param_id_key UNIQUE (url_param_id)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs DROP CONSTRAINT IF EXISTS guitar_songs_url_param_id_key")
    op.execute("ALTER TABLE guitar_songs DROP COLUMN IF EXISTS url_param_id")
