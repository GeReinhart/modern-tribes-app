"""Track each user's own mastery of a song (0=unknown to 5=perfectly mastered), private to that
user -- a many-to-many rating between guitar_songs and users, one row per (song, user) pair.

Revision ID: 032
Revises: 031
Create Date: 2026-08-11
"""
from alembic import op

revision = '032'
down_revision = '031'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE guitar_songs_mastery (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            mastery_level SMALLINT NOT NULL CHECK (mastery_level BETWEEN 0 AND 5),
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE (song_id, user_id)
        )
    """)
    op.execute("CREATE INDEX idx_guitar_songs_mastery_song ON guitar_songs_mastery(song_id)")
    op.execute("CREATE INDEX idx_guitar_songs_mastery_user ON guitar_songs_mastery(user_id)")
    op.execute(
        "CREATE OR REPLACE TRIGGER update_guitar_songs_mastery_updated_at "
        "BEFORE UPDATE ON guitar_songs_mastery FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
    )


def downgrade() -> None:
    op.execute("DROP TABLE guitar_songs_mastery")
