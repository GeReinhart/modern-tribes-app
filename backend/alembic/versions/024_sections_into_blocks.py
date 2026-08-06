"""Fold "Lyrics & Chords" section content directly onto the layout block, the same way a
chord_grid block already owns its chord_grid_rows. Previously, a 'sections'-type block was an
empty container and the real content (lyrics_text, per-word chord attachments, chord-only
sequences) lived in a separate guitar_songs_sections table (+ word/chord child tables),
cross-referenced via a nullable layout_block_id -- with an unassigned section falling back to
the first 'sections' block in the layout, and multiple sections theoretically able to share one
block.

That split was fragile: replace_row archives and re-inserts EVERY block of a row on any edit, so
a block's id churns constantly, and keeping a section attached to "the same" block across that
churn needed an ordinal-position remap (_remap_sections_across_replace) whose own docstring
warns it can silently swap or lose content once a row has been replaced more than once.

The new model is one block = one section: lyrics_text/lyrics_words live directly on the block
(JSONB, like chord_grid_rows -- see migration 020's rationale for why that survives replace_row's
id churn where a child table would not), and linked_to_block_id
replaces linked_to_section_id for the "mirror another block's content" feature (now block-to-
block instead of section-to-section). The block's own custom_title replaces the section's
separate title field.

This is a clean-slate change (still in development, confirmed no data migration needed) -- the
downgrade restores the old table SHAPE, not the data that lived in it.

Revision ID: 024
Revises: 023
Create Date: 2026-08-10
"""
from alembic import op

revision = '024'
down_revision = '023'
branch_labels = None
depends_on = None

_BLOCKS_TABLE = "guitar_songs_layout_column_blocks"


def upgrade() -> None:
    op.execute(f"""
        ALTER TABLE {_BLOCKS_TABLE}
            ADD COLUMN IF NOT EXISTS lyrics_text TEXT,
            ADD COLUMN IF NOT EXISTS lyrics_words JSONB,
            ADD COLUMN IF NOT EXISTS linked_to_block_id UUID REFERENCES {_BLOCKS_TABLE}(id) ON DELETE SET NULL
    """)
    op.execute(
        f"CREATE INDEX IF NOT EXISTS idx_{_BLOCKS_TABLE}_linked_to ON {_BLOCKS_TABLE}(linked_to_block_id)"
    )

    op.execute("DROP TABLE IF EXISTS guitar_songs_section_word_chords CASCADE")
    op.execute("DROP TABLE IF EXISTS guitar_songs_section_words CASCADE")
    op.execute("DROP TABLE IF EXISTS guitar_songs_section_chords CASCADE")
    op.execute("DROP TABLE IF EXISTS guitar_songs_sections CASCADE")


def downgrade() -> None:
    op.execute(f"DROP INDEX IF EXISTS idx_{_BLOCKS_TABLE}_linked_to")
    op.execute(f"""
        ALTER TABLE {_BLOCKS_TABLE}
            DROP COLUMN IF EXISTS lyrics_text,
            DROP COLUMN IF EXISTS lyrics_words,
            DROP COLUMN IF EXISTS linked_to_block_id
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_songs_sections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL,
            position INTEGER NOT NULL DEFAULT 1,
            title VARCHAR(255),
            content_mode VARCHAR(20) NOT NULL DEFAULT 'lyrics' CHECK (content_mode IN ('lyrics', 'chords_only')),
            lyrics_text TEXT,
            layout_block_id UUID REFERENCES guitar_songs_layout_column_blocks(id) ON DELETE SET NULL,
            linked_to_section_id UUID REFERENCES guitar_songs_sections(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute(
        "CREATE OR REPLACE TRIGGER update_guitar_songs_sections_updated_at BEFORE UPDATE ON guitar_songs_sections "
        "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_guitar_songs_sections_song ON guitar_songs_sections(song_id)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_guitar_songs_sections_linked_to ON guitar_songs_sections(linked_to_section_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_guitar_songs_sections_layout_block ON guitar_songs_sections(layout_block_id)"
    )

    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_songs_section_words (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            section_id UUID REFERENCES guitar_songs_sections(id) ON DELETE CASCADE NOT NULL,
            line_index INTEGER NOT NULL,
            word_index INTEGER NOT NULL,
            word_text VARCHAR(200) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute(
        "CREATE OR REPLACE TRIGGER update_guitar_songs_section_words_updated_at BEFORE UPDATE ON "
        "guitar_songs_section_words FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_guitar_songs_section_words_section ON guitar_songs_section_words(section_id)"
    )

    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_songs_section_word_chords (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            word_id UUID REFERENCES guitar_songs_section_words(id) ON DELETE CASCADE NOT NULL,
            position VARCHAR(10) NOT NULL CHECK (position IN ('before', 'start', 'middle', 'end', 'after')),
            chord_id UUID REFERENCES guitar_chords(id) ON DELETE CASCADE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE (word_id, position)
        )
    """)
    op.execute(
        "CREATE OR REPLACE TRIGGER update_guitar_songs_section_word_chords_updated_at BEFORE UPDATE ON "
        "guitar_songs_section_word_chords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_guitar_songs_section_word_chords_word "
        "ON guitar_songs_section_word_chords(word_id)"
    )

    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_songs_section_chords (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            section_id UUID REFERENCES guitar_songs_sections(id) ON DELETE CASCADE NOT NULL,
            chord_id UUID REFERENCES guitar_chords(id) ON DELETE CASCADE NOT NULL,
            position INTEGER NOT NULL DEFAULT 1,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute(
        "CREATE OR REPLACE TRIGGER update_guitar_songs_section_chords_updated_at BEFORE UPDATE ON "
        "guitar_songs_section_chords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_guitar_songs_section_chords_section ON guitar_songs_section_chords(section_id)"
    )
