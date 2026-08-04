"""Add guitar_songs and guitar_songs_chords tables

Revision ID: 014
Revises: 013
Create Date: 2026-08-03
"""
from alembic import op

revision = '014'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_songs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
            title VARCHAR(255) NOT NULL,
            author VARCHAR(255),
            tempo_bpm INTEGER NOT NULL DEFAULT 120 CHECK (tempo_bpm BETWEEN 20 AND 300),
            beats_per_bar INTEGER NOT NULL DEFAULT 4 CHECK (beats_per_bar BETWEEN 2 AND 8),
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_songs_updated_at
        BEFORE UPDATE ON guitar_songs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_guitar_songs_project ON guitar_songs(project_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_songs_chords (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL,
            chord_id UUID REFERENCES guitar_chords(id) ON DELETE CASCADE NOT NULL,
            position INTEGER NOT NULL DEFAULT 1,
            comment TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE (song_id, chord_id)
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_songs_chords_updated_at
        BEFORE UPDATE ON guitar_songs_chords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_guitar_songs_chords_song ON guitar_songs_chords(song_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS guitar_songs_chords")
    op.execute("DROP TABLE IF EXISTS guitar_songs")
