"""Add the Learn Language feature: a shared, app-wide word dictionary plus
per-project lessons built from it, and a private per-user test history used to
score how well each word is known.

Revision ID: 025
Revises: 024
Create Date: 2026-11-02
"""
from alembic import op

revision = '025'
down_revision = '024'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE languages (
            code VARCHAR(5) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    # One language pair per project (migration 025): set once, shared by every
    # lesson/learn/test tab added to that project.
    op.execute("""
        CREATE TABLE language_settings (
            project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
            source_language VARCHAR(5) NOT NULL REFERENCES languages(code),
            target_language VARCHAR(5) NOT NULL REFERENCES languages(code),
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            CONSTRAINT language_settings_distinct_languages CHECK (source_language <> target_language)
        )
    """)

    # The dictionary is global: a word is shared by every project, never duplicated
    # per language (enforced on the active rows only, so an archived word's text
    # can be reused).
    op.execute("""
        CREATE TABLE language_words (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            text VARCHAR(255) NOT NULL,
            language VARCHAR(5) NOT NULL REFERENCES languages(code),
            word_type VARCHAR(20) NOT NULL CHECK (word_type IN ('noun', 'adjective', 'verb')),
            article VARCHAR(20),
            plural VARCHAR(255),
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute(
        "CREATE UNIQUE INDEX idx_language_words_unique_text ON language_words (lower(text), language) "
        "WHERE status = 'active'"
    )

    # A word's optional declension, e.g. the German cases of "Mann": a free list of
    # (case label, inflected form) pairs rather than a fixed per-language structure.
    op.execute("""
        CREATE TABLE language_word_declensions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            word_id UUID REFERENCES language_words(id) ON DELETE CASCADE NOT NULL,
            case_label VARCHAR(50) NOT NULL,
            form VARCHAR(255) NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_language_word_declensions_word ON language_word_declensions (word_id)")

    # An undirected link between two words of different languages. Uniqueness is
    # enforced regardless of which side is "a" and which is "b".
    op.execute("""
        CREATE TABLE language_word_translations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            word_id_a UUID REFERENCES language_words(id) ON DELETE CASCADE NOT NULL,
            word_id_b UUID REFERENCES language_words(id) ON DELETE CASCADE NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            CONSTRAINT language_word_translations_no_self_reference CHECK (word_id_a <> word_id_b)
        )
    """)
    op.execute(
        "CREATE UNIQUE INDEX idx_language_word_translations_unique_pair ON language_word_translations "
        "(LEAST(word_id_a, word_id_b), GREATEST(word_id_a, word_id_b)) WHERE status = 'active'"
    )

    # A lesson belongs to a project (not to one tab instance), so every lesson/learn/test
    # tab added to that project reads and writes the same lessons.
    op.execute("""
        CREATE TABLE language_lessons (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
            title VARCHAR(255) NOT NULL,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_language_lessons_project ON language_lessons (project_id)")

    op.execute("""
        CREATE TABLE language_lesson_words (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            lesson_id UUID REFERENCES language_lessons(id) ON DELETE CASCADE NOT NULL,
            word_id UUID REFERENCES language_words(id) ON DELETE CASCADE NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_language_lesson_words_lesson ON language_lesson_words (lesson_id)")
    op.execute("CREATE INDEX idx_language_lesson_words_word ON language_lesson_words (word_id)")
    op.execute(
        "CREATE UNIQUE INDEX idx_language_lesson_words_unique ON language_lesson_words (lesson_id, word_id) "
        "WHERE status = 'active'"
    )

    # Append-only test history: a word's score is derived from this log (per user, not per
    # lesson), so practicing a word through one lesson also raises its score in any other
    # lesson it belongs to.
    op.execute("""
        CREATE TABLE language_word_test_attempts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            word_id UUID REFERENCES language_words(id) ON DELETE CASCADE NOT NULL,
            direction VARCHAR(20) NOT NULL CHECK (direction IN ('source_to_target', 'target_to_source')),
            mode VARCHAR(10) NOT NULL CHECK (mode IN ('free', 'choice')),
            correct BOOLEAN NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute(
        "CREATE INDEX idx_language_word_test_attempts_user_word ON language_word_test_attempts "
        "(user_id, word_id, created_at)"
    )

    for table in (
        "languages", "language_settings", "language_words", "language_word_declensions",
        "language_word_translations", "language_lessons", "language_lesson_words",
        "language_word_test_attempts",
    ):
        op.execute(
            f"CREATE TRIGGER update_{table}_updated_at BEFORE UPDATE ON {table} "
            "FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
        )


def downgrade() -> None:
    op.execute("DROP TABLE language_word_test_attempts")
    op.execute("DROP TABLE language_lesson_words")
    op.execute("DROP TABLE language_lessons")
    op.execute("DROP TABLE language_word_translations")
    op.execute("DROP TABLE language_word_declensions")
    op.execute("DROP TABLE language_words")
    op.execute("DROP TABLE language_settings")
    op.execute("DROP TABLE languages")
