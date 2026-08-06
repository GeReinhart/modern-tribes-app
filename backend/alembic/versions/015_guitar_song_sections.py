"""Guitar song sections (lyrics + chords-only), author entity, videos, project-scoped labels,
presentation/print layout templates (rows of columns, each with one or more content blocks,
each block zoomable and optionally card-framed), a cached rendered PDF per song, and a
'very_small' chord diagram size option

Squashes what were originally migrations 015-019 into one, since none of them had been
applied outside this development branch yet.

Revision ID: 015
Revises: 014
Create Date: 2026-08-05
"""
from alembic import op

revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None

_BLOCK_TYPES = (
    "'title', 'author', 'tempo', 'time_signature', 'capo', 'description', "
    "'chords', 'sections', 'videos', 'labels', 'custom'"
)

_CHORD_DIAGRAM_SIZE_CONSTRAINT = "guitar_songs_chord_diagram_size_check"


def upgrade() -> None:
    _create_sections_tables()
    _create_author_entity()
    _create_videos_table()
    _add_project_scoped_labels()
    _create_layout_settings_table()
    _create_layout_rows_table()
    _create_layout_columns_table()
    _create_layout_column_blocks_table()
    _create_layout_pdf_cache_table()
    _widen_chord_diagram_size_options()


def _create_sections_tables() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_songs_sections (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL,
            position INTEGER NOT NULL DEFAULT 1,
            type_label VARCHAR(100) NOT NULL,
            custom_label VARCHAR(200),
            content_mode VARCHAR(20) NOT NULL DEFAULT 'lyrics' CHECK (content_mode IN ('lyrics', 'chords_only')),
            lyrics_text TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_songs_sections_updated_at
        BEFORE UPDATE ON guitar_songs_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_guitar_songs_sections_song ON guitar_songs_sections(song_id)")

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
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_songs_section_words_updated_at
        BEFORE UPDATE ON guitar_songs_section_words FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
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
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_songs_section_word_chords_updated_at
        BEFORE UPDATE ON guitar_songs_section_word_chords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
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
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_songs_section_chords_updated_at
        BEFORE UPDATE ON guitar_songs_section_chords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_guitar_songs_section_chords_section ON guitar_songs_section_chords(section_id)"
    )


def _create_author_entity() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_song_author (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
            name VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_song_author_updated_at
        BEFORE UPDATE ON guitar_song_author FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_guitar_song_author_project ON guitar_song_author(project_id)")

    op.execute("ALTER TABLE guitar_songs ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES guitar_song_author(id) ON DELETE SET NULL")
    op.execute("""
        INSERT INTO guitar_song_author (project_id, name)
        SELECT DISTINCT project_id, author FROM guitar_songs WHERE author IS NOT NULL AND author != ''
    """)
    op.execute("""
        UPDATE guitar_songs s SET author_id = a.id
        FROM guitar_song_author a
        WHERE a.project_id = s.project_id AND a.name = s.author
    """)
    op.execute("ALTER TABLE guitar_songs DROP COLUMN IF EXISTS author")


def _create_videos_table() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_songs_videos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL,
            title VARCHAR(255),
            url TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 1,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_songs_videos_updated_at
        BEFORE UPDATE ON guitar_songs_videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_guitar_songs_videos_song ON guitar_songs_videos(song_id)")


def _add_project_scoped_labels() -> None:
    op.execute("ALTER TABLE labels ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE")
    # A project-scoped label has feature_instance_id NULL too, so the old "global" unique index
    # (keyed only on feature_instance_id IS NULL) must also require project_id IS NULL now,
    # otherwise two project-scoped labels of the same name in different projects would collide.
    op.execute("DROP INDEX IF EXISTS labels_name_global_unique")
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS labels_name_global_unique
        ON labels (name) WHERE feature_instance_id IS NULL AND project_id IS NULL
    """)
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS labels_name_project_unique
        ON labels (name, project_id) WHERE project_id IS NOT NULL
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_labels_project ON labels (project_id)")


def _create_layout_settings_table() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_songs_layout_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL UNIQUE,
            margin_top_mm NUMERIC(5,1) NOT NULL DEFAULT 15.0 CHECK (margin_top_mm BETWEEN 0 AND 100),
            margin_right_mm NUMERIC(5,1) NOT NULL DEFAULT 15.0 CHECK (margin_right_mm BETWEEN 0 AND 100),
            margin_bottom_mm NUMERIC(5,1) NOT NULL DEFAULT 15.0 CHECK (margin_bottom_mm BETWEEN 0 AND 100),
            margin_left_mm NUMERIC(5,1) NOT NULL DEFAULT 15.0 CHECK (margin_left_mm BETWEEN 0 AND 100),
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_songs_layout_settings_updated_at
        BEFORE UPDATE ON guitar_songs_layout_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)


def _create_layout_rows_table() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_songs_layout_rows (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL,
            position INTEGER NOT NULL DEFAULT 1,
            page_break_before BOOLEAN NOT NULL DEFAULT FALSE,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_songs_layout_rows_updated_at
        BEFORE UPDATE ON guitar_songs_layout_rows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_guitar_songs_layout_rows_song ON guitar_songs_layout_rows(song_id)")


def _create_layout_columns_table() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_songs_layout_columns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            row_id UUID REFERENCES guitar_songs_layout_rows(id) ON DELETE CASCADE NOT NULL,
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL,
            position INTEGER NOT NULL DEFAULT 1,
            width_eighths INTEGER NOT NULL CHECK (width_eighths BETWEEN 1 AND 8),
            align VARCHAR(10) NOT NULL DEFAULT 'left' CHECK (align IN ('left', 'center', 'right')),
            padding_top_mm NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (padding_top_mm BETWEEN 0 AND 100),
            padding_right_mm NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (padding_right_mm BETWEEN 0 AND 100),
            padding_bottom_mm NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (padding_bottom_mm BETWEEN 0 AND 100),
            padding_left_mm NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (padding_left_mm BETWEEN 0 AND 100),
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_songs_layout_columns_updated_at
        BEFORE UPDATE ON guitar_songs_layout_columns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_guitar_songs_layout_columns_row ON guitar_songs_layout_columns(row_id)")


def _create_layout_column_blocks_table() -> None:
    """A column holds one or more stacked content blocks (e.g. Title + Author), in order.
    A 'custom' block carries its own title + rich-text document instead of being derived from
    the song's own fields, and unlike every other block type, several 'custom' blocks may
    coexist in the same song (each with distinct content). Every block can be zoomed (30-200%)
    and optionally framed in a card, independent of its type."""
    op.execute(f"""
        CREATE TABLE IF NOT EXISTS guitar_songs_layout_column_blocks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            column_id UUID REFERENCES guitar_songs_layout_columns(id) ON DELETE CASCADE NOT NULL,
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL,
            position INTEGER NOT NULL DEFAULT 1,
            block_type VARCHAR(20) NOT NULL CHECK (block_type IN ({_BLOCK_TYPES})),
            width_eighths SMALLINT NOT NULL DEFAULT 8 CHECK (width_eighths BETWEEN 1 AND 8),
            zoom_percent SMALLINT NOT NULL DEFAULT 100 CHECK (zoom_percent BETWEEN 30 AND 200),
            show_card BOOLEAN NOT NULL DEFAULT FALSE,
            custom_title VARCHAR(255),
            custom_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_songs_layout_column_blocks_updated_at
        BEFORE UPDATE ON guitar_songs_layout_column_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_guitar_songs_layout_column_blocks_column "
        "ON guitar_songs_layout_column_blocks(column_id)"
    )
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS guitar_songs_layout_column_blocks_unique
        ON guitar_songs_layout_column_blocks (song_id, block_type)
        WHERE status = 'active' AND block_type != 'custom'
    """)


def _create_layout_pdf_cache_table() -> None:
    """The rendered PDF of a song's layout is expensive to build, so only one copy is kept
    per song. It's regenerated only when the content_hash (of the fully-resolved HTML that
    would be rendered) no longer matches what's stored, so an unchanged song is served its
    already-rendered PDF instead of re-running WeasyPrint on every download."""
    op.execute("""
        CREATE TABLE IF NOT EXISTS guitar_songs_layout_pdf_cache (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL UNIQUE,
            content_hash VARCHAR(64) NOT NULL,
            pdf_bytes BYTEA NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE OR REPLACE TRIGGER update_guitar_songs_layout_pdf_cache_updated_at
        BEFORE UPDATE ON guitar_songs_layout_pdf_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)


def _widen_chord_diagram_size_options() -> None:
    op.execute(f"ALTER TABLE guitar_songs DROP CONSTRAINT IF EXISTS {_CHORD_DIAGRAM_SIZE_CONSTRAINT}")
    op.execute(
        f"ALTER TABLE guitar_songs ADD CONSTRAINT {_CHORD_DIAGRAM_SIZE_CONSTRAINT} "
        "CHECK (chord_diagram_size IN ('very_small', 'small', 'medium', 'large'))"
    )


def downgrade() -> None:
    op.execute(f"ALTER TABLE guitar_songs DROP CONSTRAINT IF EXISTS {_CHORD_DIAGRAM_SIZE_CONSTRAINT}")
    op.execute(
        f"ALTER TABLE guitar_songs ADD CONSTRAINT {_CHORD_DIAGRAM_SIZE_CONSTRAINT} "
        "CHECK (chord_diagram_size IN ('small', 'medium', 'large'))"
    )

    op.execute("DROP TABLE IF EXISTS guitar_songs_layout_pdf_cache")
    op.execute("DROP TABLE IF EXISTS guitar_songs_layout_column_blocks")
    op.execute("DROP TABLE IF EXISTS guitar_songs_layout_columns")
    op.execute("DROP TABLE IF EXISTS guitar_songs_layout_rows")
    op.execute("DROP TABLE IF EXISTS guitar_songs_layout_settings")

    op.execute("DROP INDEX IF EXISTS idx_labels_project")
    op.execute("DROP INDEX IF EXISTS labels_name_project_unique")
    op.execute("DROP INDEX IF EXISTS labels_name_global_unique")
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS labels_name_global_unique
        ON labels (name) WHERE feature_instance_id IS NULL
    """)
    op.execute("ALTER TABLE labels DROP COLUMN IF EXISTS project_id")

    op.execute("DROP TABLE IF EXISTS guitar_songs_videos")

    op.execute("ALTER TABLE guitar_songs ADD COLUMN IF NOT EXISTS author VARCHAR(255)")
    op.execute("""
        UPDATE guitar_songs s SET author = a.name
        FROM guitar_song_author a
        WHERE a.id = s.author_id
    """)
    op.execute("ALTER TABLE guitar_songs DROP COLUMN IF EXISTS author_id")
    op.execute("DROP TABLE IF EXISTS guitar_song_author")

    op.execute("DROP TABLE IF EXISTS guitar_songs_section_chords")
    op.execute("DROP TABLE IF EXISTS guitar_songs_section_word_chords")
    op.execute("DROP TABLE IF EXISTS guitar_songs_section_words")
    op.execute("DROP TABLE IF EXISTS guitar_songs_sections")
