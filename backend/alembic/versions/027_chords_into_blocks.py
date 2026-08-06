"""Fold a song's chord list directly onto its 'chords' layout block(s), the same way a chord
grid already owns its chord_grid_rows and a section already owns its lyrics_words. Previously
'chords' was a song-wide singleton block, its content coming from a separate guitar_songs_chords
table keyed by song_id -- a flat, one-chord-per-song-at-most list.

A song can now have more than one 'chords' block (e.g. "Main chords", "Alternative chords",
"Outro chords"), each with its own ordered chord list (chord_id + its own comment) stored
directly on the block as JSONB, so the same chord can appear in more than one block. The same
churn reasoning as migration 020 (chord grids) and 024 (sections) applies: replace_row archives
and re-inserts EVERY block of a row on any edit, so a block's id is not stable across edits -- a
child table keyed by block_id would dangle constantly, while content living on the block itself
survives for free (the client resends it unchanged). The song's own overall chord list is now the
deduplicated union of every 'chords' block's own list (see layout.service.collect_song_chords_union).

This is a clean-slate change (still in development, confirmed no data migration needed) -- the
downgrade restores the old table SHAPE, not the data that lived in it.

Revision ID: 027
Revises: 026
Create Date: 2026-08-10
"""
from alembic import op

revision = '027'
down_revision = '026'
branch_labels = None
depends_on = None

_BLOCKS_TABLE = "guitar_songs_layout_column_blocks"


_UNIQUE_INDEX = "guitar_songs_layout_column_blocks_unique"


def upgrade() -> None:
    op.execute(f"ALTER TABLE {_BLOCKS_TABLE} ADD COLUMN IF NOT EXISTS chords JSONB")
    op.execute(f"DROP INDEX IF EXISTS {_UNIQUE_INDEX}")
    op.execute(
        f"CREATE UNIQUE INDEX {_UNIQUE_INDEX} ON {_BLOCKS_TABLE} "
        "(song_id, block_type) WHERE status = 'active' AND block_type NOT IN ('custom', 'sections', 'chord_grid', 'chords')"
    )
    op.execute("DROP TABLE IF EXISTS guitar_songs_chords CASCADE")


def downgrade() -> None:
    op.execute(f"DROP INDEX IF EXISTS {_UNIQUE_INDEX}")
    op.execute(
        f"CREATE UNIQUE INDEX {_UNIQUE_INDEX} ON {_BLOCKS_TABLE} "
        "(song_id, block_type) WHERE status = 'active' AND block_type NOT IN ('custom', 'sections', 'chord_grid')"
    )
    op.execute(f"ALTER TABLE {_BLOCKS_TABLE} DROP COLUMN IF EXISTS chords")

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
    op.execute(
        "CREATE OR REPLACE TRIGGER update_guitar_songs_chords_updated_at BEFORE UPDATE ON guitar_songs_chords "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_guitar_songs_chords_song ON guitar_songs_chords(song_id)")
