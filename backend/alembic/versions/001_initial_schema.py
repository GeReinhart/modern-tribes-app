"""Full consolidated schema: authorization, documents, people, tribes/projects, mails,
features (todo, kanban, events, daily journal, guitar chords, guitar songs), labels, app
config, project documents/publications, search index, user preferences (tab configs,
bookmarks, dashboard pins, quick-add defaults), notifications/reminders, push subscriptions,
and the guitar chords seed data.

Squashes the entire migration history into one, since none of it had been applied outside
this development branch yet. As with the smaller squashes before it (see the guitar songs
migration's own docstring for the same reasoning), several intermediate shapes never survive
to the final state and are skipped entirely here -- most notably events_reminders (replaced by
the generic reminders table) and every ALTER TABLE dance that only existed to evolve a column
already inlined here in its final form (e.g. projects_features.icon, labels.project_id,
guitar_chords.difficulty).

Revision ID: 001
Revises: None
Create Date: 2026-06-12
"""
import json

from alembic import op

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

_BLOCK_TYPES = (
    "'title', 'author', 'tempo', 'time_signature', 'capo', 'description', 'chords', 'sections', "
    "'labels', 'custom', 'chord_grid'"
)

# Guitar chords seed data -- hand-verified authentic open/barre shapes for the 7 natural roots.
# frets: low E to high E; None = muted ("X"). Verified against standard tuning (low E=4, A=9,
# D=2, G=7, B=11, e=4 semitones from C) so every note is a real chord tone.
_ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
_ROOT_SEMITONES = {root: i for i, root in enumerate(_ROOTS)}

_HARDCODED_CHORDS = [
    # Major
    ("C", "C", [None, 3, 2, 0, 1, 0], "Open chord"),
    ("D", "D", [None, None, 0, 2, 3, 2], "Open chord"),
    ("E", "E", [0, 2, 2, 1, 0, 0], "Open chord"),
    ("F", "F", [1, 3, 3, 2, 1, 1], "Barre chord"),
    ("G", "G", [3, 2, 0, 0, 0, 3], "Open chord"),
    ("A", "A", [None, 0, 2, 2, 2, 0], "Open chord"),
    ("B", "B", [None, 2, 4, 4, 4, 2], "Barre chord"),
    # Minor
    ("Cm", "C", [None, 3, 5, 5, 4, 3], "Barre chord"),
    ("Dm", "D", [None, None, 0, 2, 3, 1], "Open chord"),
    ("Em", "E", [0, 2, 2, 0, 0, 0], "Open chord"),
    ("Fm", "F", [1, 3, 3, 1, 1, 1], "Barre chord"),
    ("Gm", "G", [3, 5, 5, 3, 3, 3], "Barre chord"),
    ("Am", "A", [None, 0, 2, 2, 1, 0], "Open chord"),
    ("Bm", "B", [None, 2, 4, 4, 3, 2], "Barre chord"),
    # Dominant 7th
    ("C7", "C", [None, 3, 2, 3, 1, 0], "Open chord"),
    ("D7", "D", [None, None, 0, 2, 1, 2], "Open chord"),
    ("E7", "E", [0, 2, 0, 1, 0, 0], "Open chord"),
    ("F7", "F", [1, 3, 1, 2, 1, 1], "Barre chord"),
    ("G7", "G", [3, 2, 0, 0, 0, 1], "Open chord"),
    ("A7", "A", [None, 0, 2, 0, 2, 0], "Open chord"),
    ("B7", "B", [None, 2, 1, 2, 0, 2], "Open chord"),
    # Major 7th
    ("Cmaj7", "C", [None, 3, 2, 0, 0, 0], "Open chord"),
    ("Dmaj7", "D", [None, None, 0, 2, 2, 2], "Open chord"),
    ("Emaj7", "E", [0, 2, 1, 1, 0, 0], "Open chord"),
    ("Fmaj7", "F", [1, 3, 2, 2, 1, 1], "Barre chord"),
    ("Gmaj7", "G", [3, 2, 0, 0, 0, 2], "Open chord"),
    ("Amaj7", "A", [None, 0, 2, 1, 2, 0], "Open chord"),
    ("Bmaj7", "B", [None, 2, 4, 3, 4, 2], "Barre chord"),
    # Minor 7th
    ("Cm7", "C", [None, 3, 5, 3, 4, 3], "Barre chord"),
    ("Dm7", "D", [None, None, 0, 2, 1, 1], "Open chord"),
    ("Em7", "E", [0, 2, 0, 0, 0, 0], "Open chord"),
    ("Fm7", "F", [1, 3, 1, 1, 1, 1], "Barre chord"),
    ("Gm7", "G", [3, 5, 3, 3, 3, 3], "Barre chord"),
    ("Am7", "A", [None, 0, 2, 0, 1, 0], "Open chord"),
    ("Bm7", "B", [None, 2, 4, 2, 3, 2], "Barre chord"),
    # Power chords (root + 5th + octave)
    ("C5", "C", [None, 3, 5, 5, None, None], "Barre chord"),
    ("D5", "D", [None, None, 0, 2, 3, None], "Open chord"),
    ("E5", "E", [0, 2, 2, None, None, None], "Open chord"),
    ("F5", "F", [1, 3, 3, None, None, None], "Barre chord"),
    ("G5", "G", [3, 5, 5, None, None, None], "Barre chord"),
    ("A5", "A", [None, 0, 2, 2, None, None], "Open chord"),
    ("B5", "B", [None, 2, 4, 4, None, None], "Barre chord"),
    # Sus4
    ("Csus4", "C", [None, 3, 3, 0, 1, 1], "Open chord"),
    ("Dsus4", "D", [None, None, 0, 2, 3, 3], "Open chord"),
    ("Esus4", "E", [0, 2, 2, 2, 0, 0], "Open chord"),
    ("Fsus4", "F", [1, 3, 3, 3, 1, 1], "Barre chord"),
    ("Gsus4", "G", [3, 3, 0, 0, 1, 3], "Open chord"),
    ("Asus4", "A", [None, 0, 2, 2, 3, 0], "Open chord"),
    ("Bsus4", "B", [None, 2, 4, 4, 5, 2], "Barre chord"),
    # Add9
    ("Cadd9", "C", [None, 3, 2, 0, 3, 0], "Open chord"),
]

# Slash chords -- the harmonic root (root_note) stays the chord's own root; only the bass note
# (lowest sounding string) changes. Each shape is verified so the bass string really sounds the
# intended bass note.
_SLASH_CHORDS = [
    ("C/E", "C", [0, 3, 2, 0, 1, 0], "Slash chord — bass note E"),
    ("C/G", "C", [3, 3, 2, 0, 1, 0], "Slash chord — bass note G"),
    ("D/F#", "D", [2, None, 0, 2, 3, 2], "Slash chord — bass note F#"),
    ("D/A", "D", [None, 0, 0, 2, 3, 2], "Slash chord — bass note A"),
    ("D/G", "D", [3, None, 0, 2, 3, 2], "Slash chord — bass note G"),
    ("E/G#", "E", [4, None, 2, 1, 0, 0], "Slash chord — bass note G#"),
    ("E/B", "E", [None, 2, 2, 1, 0, 0], "Slash chord — bass note B"),
    ("G/B", "G", [None, 2, 0, 0, 0, 3], "Slash chord — bass note B"),
    ("G/D", "G", [None, None, 0, 0, 0, 3], "Slash chord — bass note D"),
    ("A/C#", "A", [None, 4, 2, 2, 2, 0], "Slash chord — bass note C#"),
    ("Am/C", "A", [None, 3, 2, 2, 1, 0], "Slash chord — bass note C"),
    ("Am/G", "A", [3, 0, 2, 2, 1, 0], "Slash chord — bass note G"),
    ("Em/D", "E", [None, 2, 0, 0, 0, 0], "Slash chord — bass note D"),
]

# Movable CAGED shapes: offsets from a barre fret `n`, low E to high E. Verified: every
# resulting note is a real chord tone (root/3rd/5th/7th as appropriate) for any root, since the
# shapes are built by transposing the standard open E-shape / A-shape chords.
_E_SHAPE_QUALITIES = {
    'major': (0, 2, 2, 1, 0, 0),
    'm': (0, 2, 2, 0, 0, 0),
    '7': (0, 2, 0, 1, 0, 0),
    'maj7': (0, 2, 1, 1, 0, 0),
    'm7': (0, 2, 0, 0, 0, 0),
    'sus4': (0, 2, 2, 2, 0, 0),
    '5': (0, 2, 2, None, None, None),
}
_A_SHAPE_QUALITIES = {
    'major': (0, 2, 2, 2, 0),
    'm': (0, 2, 2, 1, 0),
    '7': (0, 2, 0, 2, 0),
    'maj7': (0, 2, 1, 2, 0),
    'm7': (0, 2, 0, 1, 0),
    'sus4': (0, 2, 2, 3, 0),
    '5': (0, 2, 2, None, None),
}


def upgrade() -> None:
    _create_extension_and_trigger_function()
    _create_authorization_tables()
    _create_document_tables()
    _create_people_and_user_tables()
    _create_user_relation_tables()
    _create_tribes_and_project_tables()
    _create_mail_tables()
    _create_feature_container_tables()
    _create_todo_and_kanban_tables()
    _create_label_tables()
    _create_app_config_table()
    _create_project_document_tables()
    _create_search_index_table()
    _create_user_preference_tables()
    _create_reminder_and_notification_tables()
    _create_event_tables()
    _create_push_subscription_table()
    _create_journal_table()
    _create_quick_add_defaults_table()
    _create_guitar_chords_table()
    _seed_guitar_chords()
    _create_guitar_song_author()
    _create_guitar_songs()
    _create_guitar_songs_mastery()
    _create_guitar_songs_videos()
    _create_layout_settings_table()
    _create_layout_rows_table()
    _create_layout_columns_table()
    _create_layout_column_blocks_table()
    _create_layout_pdf_cache_table()
    _backfill_search_index()


def _create_extension_and_trigger_function() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql'
    """)


def _create_authorization_tables() -> None:
    op.execute("""
        CREATE TABLE permissions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID,
            updated_by UUID,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)
    op.execute("""
        CREATE TABLE roles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID,
            updated_by UUID,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)
    op.execute("""
        CREATE TABLE role_permissions (
            role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
            permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
            PRIMARY KEY (role_id, permission_id)
        )
    """)
    op.execute("CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_document_tables() -> None:
    op.execute("""
        CREATE TABLE documents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            content_html TEXT,
            content_summary TEXT,
            content_text TEXT,
            revisions JSONB NOT NULL DEFAULT '[]',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID,
            updated_by UUID,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)
    op.execute("""
        CREATE TABLE document_attachments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            file_id VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            size BIGINT NOT NULL,
            type VARCHAR(255) NOT NULL,
            url TEXT NOT NULL,
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)
    op.execute("CREATE INDEX idx_documents_created_at ON documents(created_at)")
    op.execute("CREATE INDEX idx_documents_content_fts ON documents USING GIN(to_tsvector('french', COALESCE(content_text, '')))")
    op.execute("CREATE INDEX idx_document_attachments_document_id ON document_attachments(document_id)")
    op.execute("CREATE INDEX idx_document_attachments_file_id ON document_attachments(file_id)")
    op.execute("CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_people_and_user_tables() -> None:
    op.execute("""
        CREATE TABLE persons (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            gender VARCHAR(50) NOT NULL CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID,
            updated_by UUID,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)
    op.execute("""
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            login VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
            language VARCHAR(10) NOT NULL DEFAULT 'en',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID,
            updated_by UUID,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)
    # permissions/roles/documents/persons were created before users existed, so their own
    # created_by/updated_by audit columns can only get their FK to users added now.
    for table in ('permissions', 'roles', 'documents', 'persons', 'users'):
        op.execute(
            f"ALTER TABLE {table} ADD CONSTRAINT {table}_created_by_fkey "
            f"FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL"
        )
        op.execute(
            f"ALTER TABLE {table} ADD CONSTRAINT {table}_updated_by_fkey "
            f"FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL"
        )
    op.execute("CREATE INDEX idx_users_email ON users(email)")
    op.execute("CREATE INDEX idx_users_url_param_id ON users(url_param_id)")
    op.execute("CREATE INDEX idx_users_person_id ON users(person_id)")
    op.execute("CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_user_relation_tables() -> None:
    op.execute("""
        CREATE TABLE user_roles (
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, role_id)
        )
    """)
    op.execute("""
        CREATE TABLE user_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            session_id VARCHAR(255) UNIQUE NOT NULL,
            user_agent TEXT,
            ip_address VARCHAR(45),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            refresh_token_hash VARCHAR(255),
            refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)
    op.execute("""
        CREATE TABLE represents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE (user_id, person_id)
        )
    """)
    op.execute("CREATE UNIQUE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash) WHERE refresh_token_hash IS NOT NULL")
    op.execute("CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id)")
    op.execute("CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id)")
    op.execute("CREATE INDEX idx_represents_user_id ON represents(user_id)")
    op.execute("CREATE INDEX idx_represents_person_id ON represents(person_id)")
    op.execute("CREATE TRIGGER update_represents_updated_at BEFORE UPDATE ON represents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_tribes_and_project_tables() -> None:
    op.execute("""
        CREATE TABLE projects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            theme_code VARCHAR(50) NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)
    op.execute("""
        CREATE TABLE tribes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            name VARCHAR(255) UNIQUE NOT NULL,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            theme_code VARCHAR(50) NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)
    op.execute("""
        CREATE TABLE tribes_projects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE NOT NULL,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
            relation VARCHAR(20) NOT NULL CHECK (relation IN ('manager', 'member', 'guest')),
            display_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (tribe_id, project_id)
        )
    """)
    op.execute("""
        CREATE TABLE positions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE NOT NULL,
            person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
            position VARCHAR(50) NOT NULL CHECK (position IN ('manager', 'member', 'guest')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            UNIQUE (tribe_id, person_id)
        )
    """)
    op.execute("CREATE INDEX idx_projects_url_param_id ON projects(url_param_id)")
    op.execute("CREATE INDEX idx_tribes_url_param_id ON tribes(url_param_id)")
    op.execute("CREATE INDEX idx_tribes_projects_tribe_id ON tribes_projects(tribe_id)")
    op.execute("CREATE INDEX idx_tribes_projects_project_id ON tribes_projects(project_id)")
    op.execute("CREATE INDEX idx_positions_tribe_id ON positions(tribe_id)")
    op.execute("CREATE INDEX idx_positions_person_id ON positions(person_id)")
    op.execute("CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_tribes_updated_at BEFORE UPDATE ON tribes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_mail_tables() -> None:
    op.execute("""
        CREATE TABLE mails (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            subject VARCHAR(500) NOT NULL,
            content_html TEXT NOT NULL,
            mail_type VARCHAR(50),
            mail_status VARCHAR(20) NOT NULL DEFAULT 'not_sent' CHECK (mail_status IN ('not_sent', 'sent')),
            planned_at TIMESTAMP WITH TIME ZONE NOT NULL,
            sent_at TIMESTAMP WITH TIME ZONE,
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TABLE mails_to (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            mail_id UUID REFERENCES mails(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (mail_id, user_id)
        )
    """)
    op.execute("CREATE INDEX idx_mails_status ON mails(status)")
    op.execute("CREATE INDEX idx_mails_mail_status ON mails(mail_status)")
    op.execute("CREATE INDEX idx_mails_mail_type ON mails(mail_type)")
    op.execute("CREATE INDEX idx_mails_planned_at ON mails(planned_at)")
    op.execute("CREATE INDEX idx_mails_to_mail_id ON mails_to(mail_id)")
    op.execute("CREATE INDEX idx_mails_to_user_id ON mails_to(user_id)")
    op.execute("CREATE TRIGGER update_mails_updated_at BEFORE UPDATE ON mails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_feature_container_tables() -> None:
    op.execute("""
        CREATE TABLE projects_features (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
            feature_type VARCHAR(100) NOT NULL,
            name VARCHAR(255) NULL,
            icon VARCHAR(50) NULL,
            theme_code VARCHAR(50) NULL,
            status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
            position INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            CONSTRAINT chk_projects_features_name_or_icon CHECK ((name IS NOT NULL AND name <> '') OR icon IS NOT NULL)
        )
    """)
    op.execute("CREATE INDEX idx_projects_features_project_id ON projects_features(project_id)")
    op.execute("CREATE TRIGGER update_projects_features_updated_at BEFORE UPDATE ON projects_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_todo_and_kanban_tables() -> None:
    op.execute("""
        CREATE TABLE todo_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            feature_instance_id UUID REFERENCES projects_features(id) ON DELETE CASCADE NOT NULL,
            title VARCHAR(500) NOT NULL,
            status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            todo_status VARCHAR(50) NOT NULL DEFAULT 'todo' CHECK (todo_status IN ('todo', 'done')),
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            position INTEGER DEFAULT 0,
            size INTEGER,
            assigned_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
            due_date DATE,
            force_on_dashboard BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TABLE kanban_columns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TABLE kanban_cards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
            column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
            parent_card_id UUID REFERENCES kanban_cards(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            assigned_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            position INTEGER NOT NULL DEFAULT 0,
            size INTEGER,
            due_date DATE,
            force_on_dashboard BOOLEAN NOT NULL DEFAULT FALSE,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_todo_items_feature_instance_id ON todo_items(feature_instance_id)")
    op.execute("CREATE INDEX idx_kanban_columns_feature_instance ON kanban_columns(feature_instance_id)")
    op.execute("CREATE INDEX idx_kanban_columns_position ON kanban_columns(feature_instance_id, position)")
    op.execute("CREATE INDEX idx_kanban_cards_feature_instance ON kanban_cards(feature_instance_id)")
    op.execute("CREATE INDEX idx_kanban_cards_column ON kanban_cards(column_id)")
    op.execute("CREATE INDEX idx_kanban_cards_parent ON kanban_cards(parent_card_id)")
    op.execute("CREATE TRIGGER update_todo_items_updated_at BEFORE UPDATE ON todo_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_kanban_columns_updated_at BEFORE UPDATE ON kanban_columns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_kanban_cards_updated_at BEFORE UPDATE ON kanban_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_label_tables() -> None:
    """Labels are shared by global admin lists, feature-instance-scoped lists (kanban/todo),
    and project-scoped lists (entities shared across a project's tabs, e.g. guitar songs)."""
    op.execute("""
        CREATE TABLE labels (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            feature_instance_id UUID REFERENCES projects_features(id) ON DELETE CASCADE,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            color VARCHAR(20) NOT NULL DEFAULT '#6b7280',
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)
    op.execute("CREATE UNIQUE INDEX labels_name_global_unique ON labels (name) WHERE feature_instance_id IS NULL AND project_id IS NULL")
    op.execute("CREATE UNIQUE INDEX labels_name_feature_unique ON labels (name, feature_instance_id) WHERE feature_instance_id IS NOT NULL")
    op.execute("CREATE UNIQUE INDEX labels_name_project_unique ON labels (name, project_id) WHERE project_id IS NOT NULL")
    op.execute("CREATE INDEX idx_labels_feature_instance ON labels(feature_instance_id)")
    op.execute("CREATE INDEX idx_labels_project ON labels(project_id)")

    op.execute("""
        CREATE TABLE label_entities (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            label_id UUID REFERENCES labels(id) ON DELETE CASCADE NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (label_id, entity_type, entity_id)
        )
    """)
    op.execute("""
        CREATE TABLE document_entities (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id UUID NOT NULL,
            file_path VARCHAR(500),
            file_type VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (document_id, entity_type, entity_id)
        )
    """)
    op.execute("CREATE INDEX idx_label_entities_label_id ON label_entities(label_id)")
    op.execute("CREATE INDEX idx_label_entities_entity ON label_entities(entity_type, entity_id)")
    op.execute("CREATE INDEX idx_document_entities_document_id ON document_entities(document_id)")
    op.execute("CREATE INDEX idx_document_entities_entity ON document_entities(entity_type, entity_id)")
    op.execute("CREATE TRIGGER update_labels_updated_at BEFORE UPDATE ON labels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_app_config_table() -> None:
    op.execute("""
        CREATE TABLE app_config (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            key VARCHAR(255) UNIQUE NOT NULL,
            value TEXT NOT NULL DEFAULT '',
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        INSERT INTO app_config (key, value, description) VALUES
        ('upload.max_files', '5', 'Maximum number of files that can be attached to a document'),
        ('upload.max_file_size_mb', '10', 'Maximum file size in megabytes for attachments'),
        ('editor.image_extensions', 'jpg,png,jpeg,gif,webp', 'Allowed image extensions in the editor (comma-separated)')
    """)
    op.execute("CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON app_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_project_document_tables() -> None:
    op.execute("""
        CREATE TABLE projects_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            toc_depth INTEGER NOT NULL DEFAULT 4,
            status VARCHAR(50) NOT NULL DEFAULT 'active'
                CONSTRAINT projects_documents_status_check CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id),
            updated_by UUID REFERENCES users(id)
        )
    """)
    op.execute("""
        CREATE TABLE document_pages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            project_document_id UUID NOT NULL REFERENCES projects_documents(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            content_html TEXT NOT NULL DEFAULT '',
            content_summary TEXT,
            content_text TEXT,
            attachments JSONB NOT NULL DEFAULT '[]',
            revisions JSONB NOT NULL DEFAULT '[]',
            order_index INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(50) NOT NULL DEFAULT 'active'
                CONSTRAINT document_pages_status_check CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TABLE publications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            document_id UUID NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
            project_document_id UUID NOT NULL REFERENCES projects_documents(id) ON DELETE CASCADE,
            status VARCHAR(50) NOT NULL DEFAULT 'active'
                CONSTRAINT publications_status_check CHECK (status IN ('pending', 'active', 'archived')),
            published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            published_by UUID REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id),
            updated_by UUID REFERENCES users(id)
        )
    """)
    op.execute("CREATE INDEX idx_projects_documents_project_id ON projects_documents(project_id)")
    op.execute("CREATE INDEX idx_projects_documents_document_id ON projects_documents(document_id)")
    op.execute("CREATE INDEX idx_projects_documents_status ON projects_documents(status)")
    op.execute("CREATE INDEX idx_projects_documents_url_param_id ON projects_documents(url_param_id)")
    op.execute("CREATE INDEX idx_document_pages_project_document_id ON document_pages(project_document_id)")
    op.execute("CREATE INDEX idx_document_pages_status ON document_pages(project_document_id, status)")
    op.execute("CREATE INDEX idx_document_pages_content_fts ON document_pages USING GIN(to_tsvector('french', COALESCE(content_text, '')))")
    op.execute("CREATE INDEX idx_publications_document_id ON publications(document_id)")
    op.execute("CREATE INDEX idx_publications_project_document_id ON publications(project_document_id)")
    op.execute("CREATE INDEX idx_publications_published_at ON publications(published_at DESC)")
    op.execute("CREATE INDEX idx_publications_url_param_id ON publications(url_param_id)")
    op.execute("CREATE TRIGGER update_projects_documents_updated_at BEFORE UPDATE ON projects_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_document_pages_updated_at BEFORE UPDATE ON document_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_publications_updated_at BEFORE UPDATE ON publications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_search_index_table() -> None:
    op.execute("""
        CREATE TABLE search_index (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_type VARCHAR(100) NOT NULL,
            entity_id UUID NOT NULL,
            content_text TEXT,
            content_summary TEXT,
            routing_path TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CONSTRAINT search_index_status_check CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE (entity_type, entity_id)
        )
    """)
    op.execute("CREATE INDEX idx_search_index_entity ON search_index(entity_type, entity_id)")
    op.execute("CREATE INDEX idx_search_index_routing_path ON search_index(routing_path)")
    op.execute("CREATE INDEX idx_search_index_content_fts ON search_index USING GIN(to_tsvector('french', COALESCE(content_text, '')))")
    op.execute("CREATE TRIGGER update_search_index_updated_at BEFORE UPDATE ON search_index FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_user_preference_tables() -> None:
    op.execute("""
        CREATE TABLE user_tab_configs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            context_key VARCHAR(100) NOT NULL,
            tab_configs JSONB NOT NULL DEFAULT '[]',
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(user_id, context_key)
        )
    """)
    op.execute("""
        CREATE TABLE user_bookmarks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            page_path VARCHAR(500) NOT NULL,
            page_title VARCHAR(200) NOT NULL,
            description TEXT,
            color_text VARCHAR(50),
            color_background VARCHAR(50),
            display_order INT NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(user_id, page_path)
        )
    """)
    op.execute("""
        CREATE TABLE dashboard_pinned_tabs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            bookmark_id UUID NOT NULL REFERENCES user_bookmarks(id),
            display_order INT NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            CONSTRAINT uq_user_bookmark_pinned UNIQUE(user_id, bookmark_id)
        )
    """)
    op.execute("CREATE TRIGGER update_user_tab_configs_updated_at BEFORE UPDATE ON user_tab_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_user_bookmarks_updated_at BEFORE UPDATE ON user_bookmarks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_dashboard_pinned_tabs_updated_at BEFORE UPDATE ON dashboard_pinned_tabs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_reminder_and_notification_tables() -> None:
    """Generic reminders for any entity (event, todo_item, kanban_card). Notifications carry
    their own optional link to the reminder that scheduled them."""
    op.execute("""
        CREATE TABLE reminders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_type VARCHAR(50) NOT NULL
                CHECK (entity_type IN ('event', 'todo_item', 'kanban_card')),
            entity_id UUID NOT NULL,
            remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
            reminder_type VARCHAR(20) NOT NULL DEFAULT 'notification'
                CHECK (reminder_type IN ('notification', 'mail')),
            sent BOOLEAN NOT NULL DEFAULT FALSE,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url_param_id VARCHAR(12) UNIQUE NOT NULL,
            target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            sent_at TIMESTAMP WITH TIME ZONE NULL,
            notification_status VARCHAR(20) NOT NULL DEFAULT 'planned'
                CHECK (notification_status IN ('planned', 'sent', 'failed')),
            scheduled_for TIMESTAMP WITH TIME ZONE NULL,
            reminder_id UUID NULL REFERENCES reminders(id),
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_reminders_entity ON reminders(entity_type, entity_id)")
    op.execute("CREATE INDEX idx_reminders_remind_at ON reminders(remind_at) WHERE sent = FALSE")
    op.execute("CREATE INDEX idx_notifications_target_status ON notifications(target_user_id, notification_status)")
    op.execute("CREATE INDEX idx_notifications_reminder_id ON notifications(reminder_id)")
    op.execute("CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_event_tables() -> None:
    op.execute("""
        CREATE TABLE events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            start_at TIMESTAMP WITH TIME ZONE NOT NULL,
            end_at TIMESTAMP WITH TIME ZONE NOT NULL,
            all_day BOOLEAN NOT NULL DEFAULT FALSE,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            size INTEGER CHECK (size > 0),
            color VARCHAR(20) NOT NULL DEFAULT '#6b7280',
            force_on_dashboard BOOLEAN NOT NULL DEFAULT FALSE,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TABLE events_participants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(event_id, person_id)
        )
    """)
    op.execute("CREATE INDEX idx_events_feature_instance ON events(feature_instance_id)")
    op.execute("CREATE INDEX idx_events_start_at ON events(start_at)")
    op.execute("CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_events_participants_updated_at BEFORE UPDATE ON events_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_push_subscription_table() -> None:
    op.execute("""
        CREATE TABLE push_subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            endpoint TEXT NOT NULL,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(user_id, endpoint)
        )
    """)
    op.execute("CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id) WHERE status = 'active'")
    op.execute("CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_journal_table() -> None:
    op.execute("""
        CREATE TABLE journal_blocks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            position INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE INDEX idx_journal_blocks_feature_date ON journal_blocks(feature_instance_id, date)")
    op.execute("CREATE INDEX idx_journal_blocks_feature_status ON journal_blocks(feature_instance_id, status)")
    op.execute("CREATE TRIGGER update_journal_blocks_updated_at BEFORE UPDATE ON journal_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_quick_add_defaults_table() -> None:
    op.execute("""
        CREATE TABLE user_quick_add_defaults (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            quick_add_type VARCHAR(20) NOT NULL CHECK (quick_add_type IN ('task', 'event')),
            feature_instance_id UUID REFERENCES projects_features(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(user_id, quick_add_type)
        )
    """)
    op.execute("CREATE TRIGGER update_user_quick_add_defaults_updated_at BEFORE UPDATE ON user_quick_add_defaults FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _create_guitar_chords_table() -> None:
    op.execute("""
        CREATE TABLE guitar_chords (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(50) NOT NULL,
            root_note VARCHAR(3) NOT NULL,
            description TEXT,
            frets JSONB NOT NULL,
            -- How hard this chord shape is to play: 0 (easiest) to 5 (hardest), optional.
            difficulty SMALLINT NULL CHECK (difficulty BETWEEN 0 AND 5),
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("CREATE TRIGGER update_guitar_chords_updated_at BEFORE UPDATE ON guitar_chords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def _shift(n: int, offsets: tuple) -> list:
    return [n + o if o is not None else None for o in offsets]


def _generate_barre_chords() -> list:
    chords = []
    for root in _ROOTS:
        target = _ROOT_SEMITONES[root]
        n_e = (target - _ROOT_SEMITONES['E']) % 12
        n_a = (target - _ROOT_SEMITONES['A']) % 12
        if n_e != 0:  # n_e == 0 means root == E, already covered by _HARDCODED_CHORDS
            for quality, offsets in _E_SHAPE_QUALITIES.items():
                name = f"{root}{quality if quality != 'major' else ''}"
                frets = _shift(n_e, offsets)
                chords.append((name, root, frets, f"E-shape barre chord (fret {n_e})"))
        if n_a != 0:  # n_a == 0 means root == A, already covered by _HARDCODED_CHORDS
            for quality, offsets in _A_SHAPE_QUALITIES.items():
                name = f"{root}{quality if quality != 'major' else ''}"
                frets = [None] + _shift(n_a, offsets)
                chords.append((name, root, frets, f"A-shape barre chord (fret {n_a})"))
    return chords


def _chord_values_row(name: str, root_note: str, frets: list, description: str) -> str:
    frets_json = json.dumps(['X' if f is None else f for f in frets])
    description_sql = "'" + description.replace("'", "''") + "'"
    return f"('{name}', '{root_note}', {description_sql}, '{frets_json}'::jsonb)"


def _deduplicate_chords(chords: list) -> list:
    seen = set()
    result = []
    for chord in chords:
        key = (chord[0], chord[1], tuple(chord[2]))
        if key in seen:
            continue
        seen.add(key)
        result.append(chord)
    return result


def _seed_guitar_chords() -> None:
    """Seed the guitar chords inventory with ~200 popular chords, in several neck positions."""
    all_chords = _deduplicate_chords(_HARDCODED_CHORDS + _SLASH_CHORDS + _generate_barre_chords())
    values_clause = ",\n        ".join(_chord_values_row(*chord) for chord in all_chords)
    op.execute(f"""
        INSERT INTO guitar_chords (name, root_note, description, frets)
        VALUES {values_clause}
    """)


def _create_guitar_song_author() -> None:
    op.execute("""
        CREATE TABLE guitar_song_author (
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
        CREATE TRIGGER update_guitar_song_author_updated_at
        BEFORE UPDATE ON guitar_song_author FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX idx_guitar_song_author_project ON guitar_song_author(project_id)")


def _create_guitar_songs() -> None:
    op.execute("""
        CREATE TABLE guitar_songs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
            title VARCHAR(255) NOT NULL,
            author_id UUID REFERENCES guitar_song_author(id) ON DELETE SET NULL,
            tempo_bpm INTEGER NOT NULL DEFAULT 120 CHECK (tempo_bpm BETWEEN 20 AND 300),
            beats_per_bar INTEGER NOT NULL DEFAULT 4 CHECK (beats_per_bar BETWEEN 2 AND 8),
            capo INTEGER NOT NULL DEFAULT 0 CHECK (capo BETWEEN 0 AND 12),
            chord_diagram_style VARCHAR(20) NOT NULL DEFAULT 'full' CHECK (chord_diagram_style IN ('full', 'simple')),
            chord_diagram_size VARCHAR(20) NOT NULL DEFAULT 'm'
                CHECK (chord_diagram_size IN ('xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl')),
            lyrics_line_spacing_px INTEGER NOT NULL DEFAULT 10 CHECK (lyrics_line_spacing_px BETWEEN 0 AND 60),
            lyrics_text_size_px INTEGER NOT NULL DEFAULT 16 CHECK (lyrics_text_size_px BETWEEN 8 AND 40),
            lyrics_chord_size_px INTEGER NOT NULL DEFAULT 18 CHECK (lyrics_chord_size_px BETWEEN 8 AND 40),
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            -- Editorial state: a completed song locks its content and only shows the read-only
            -- presentation screen, distinct from the generic status column below.
            song_state VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (song_state IN ('draft', 'completed')),
            -- How hard the song is to play: 0 (easiest) to 5 (hardest), optional. Independent of
            -- any of its chords' own difficulty.
            difficulty SMALLINT NULL CHECK (difficulty BETWEEN 0 AND 5),
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TRIGGER update_guitar_songs_updated_at
        BEFORE UPDATE ON guitar_songs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX idx_guitar_songs_project ON guitar_songs(project_id)")


def _create_guitar_songs_mastery() -> None:
    """Each user's own private rating of how well they personally know a song: 0 (unknown) to 5
    (perfectly mastered), one row per (song, user) pair."""
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
    op.execute("""
        CREATE TRIGGER update_guitar_songs_mastery_updated_at
        BEFORE UPDATE ON guitar_songs_mastery FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX idx_guitar_songs_mastery_song ON guitar_songs_mastery(song_id)")
    op.execute("CREATE INDEX idx_guitar_songs_mastery_user ON guitar_songs_mastery(user_id)")


def _create_guitar_songs_videos() -> None:
    """Ordered list of videos attached to a song. Pure metadata -- never placeable in the
    layout, since a video can't be printed to PDF anyway."""
    op.execute("""
        CREATE TABLE guitar_songs_videos (
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
        CREATE TRIGGER update_guitar_songs_videos_updated_at
        BEFORE UPDATE ON guitar_songs_videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX idx_guitar_songs_videos_song ON guitar_songs_videos(song_id)")


def _create_layout_settings_table() -> None:
    """Page margins and footer spacing for a song's presentation/print layout, one row per
    song. footer_spacing_mm (the printed footer's clearance from the page's true bottom edge)
    is independent of margin_bottom_mm (the content's own clearance above the footer)."""
    op.execute("""
        CREATE TABLE guitar_songs_layout_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL UNIQUE,
            margin_top_mm NUMERIC(5,1) NOT NULL DEFAULT 15.0 CHECK (margin_top_mm BETWEEN 0 AND 100),
            margin_right_mm NUMERIC(5,1) NOT NULL DEFAULT 15.0 CHECK (margin_right_mm BETWEEN 0 AND 100),
            margin_bottom_mm NUMERIC(5,1) NOT NULL DEFAULT 15.0 CHECK (margin_bottom_mm BETWEEN 0 AND 100),
            margin_left_mm NUMERIC(5,1) NOT NULL DEFAULT 15.0 CHECK (margin_left_mm BETWEEN 0 AND 100),
            footer_spacing_mm NUMERIC(5,1) NOT NULL DEFAULT 5.0 CHECK (footer_spacing_mm BETWEEN 0 AND 100),
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TRIGGER update_guitar_songs_layout_settings_updated_at
        BEFORE UPDATE ON guitar_songs_layout_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)


def _create_layout_rows_table() -> None:
    op.execute("""
        CREATE TABLE guitar_songs_layout_rows (
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
        CREATE TRIGGER update_guitar_songs_layout_rows_updated_at
        BEFORE UPDATE ON guitar_songs_layout_rows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX idx_guitar_songs_layout_rows_song ON guitar_songs_layout_rows(song_id)")


def _create_layout_columns_table() -> None:
    """Columns within a layout row; widths in twelfths of the row (twelfths split cleanly into
    halves, thirds AND quarters). separator_left/right draw a subtle vertical rule on either
    edge of the column, independent of its own padding/align."""
    op.execute("""
        CREATE TABLE guitar_songs_layout_columns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            row_id UUID REFERENCES guitar_songs_layout_rows(id) ON DELETE CASCADE NOT NULL,
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL,
            position INTEGER NOT NULL DEFAULT 1,
            width_twelfths INTEGER NOT NULL CHECK (width_twelfths BETWEEN 1 AND 12),
            align VARCHAR(10) NOT NULL DEFAULT 'left' CHECK (align IN ('left', 'center', 'right')),
            padding_top_mm NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (padding_top_mm BETWEEN 0 AND 100),
            padding_right_mm NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (padding_right_mm BETWEEN 0 AND 100),
            padding_bottom_mm NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (padding_bottom_mm BETWEEN 0 AND 100),
            padding_left_mm NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (padding_left_mm BETWEEN 0 AND 100),
            separator_left BOOLEAN NOT NULL DEFAULT FALSE,
            separator_right BOOLEAN NOT NULL DEFAULT FALSE,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TRIGGER update_guitar_songs_layout_columns_updated_at
        BEFORE UPDATE ON guitar_songs_layout_columns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute("CREATE INDEX idx_guitar_songs_layout_columns_row ON guitar_songs_layout_columns(row_id)")


def _create_layout_column_blocks_table() -> None:
    """A column holds one or more stacked content blocks (e.g. Title + Author), in order. A
    'custom' block carries its own title + rich-text document, a 'chord_grid' block its own
    free-form chord/text grid (chord_grid_rows), a 'sections' block its own "Lyrics & Chords"
    text with per-word chord attachments (lyrics_text/lyrics_words, or linked_to_block_id to
    mirror another block's content so a repeated chorus is authored once), and a 'chords' block
    its own ordered chord list (chords) -- unlike every other block type, each of these four may
    repeat within the same song. Every block can be zoomed (30-200%), padded and optionally
    framed in a card, independent of its type."""
    op.execute(f"""
        CREATE TABLE guitar_songs_layout_column_blocks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            column_id UUID REFERENCES guitar_songs_layout_columns(id) ON DELETE CASCADE NOT NULL,
            song_id UUID REFERENCES guitar_songs(id) ON DELETE CASCADE NOT NULL,
            position INTEGER NOT NULL DEFAULT 1,
            block_type VARCHAR(20) NOT NULL CHECK (block_type IN ({_BLOCK_TYPES})),
            width_twelfths SMALLINT NOT NULL DEFAULT 12 CHECK (width_twelfths BETWEEN 1 AND 12),
            zoom_percent SMALLINT NOT NULL DEFAULT 100 CHECK (zoom_percent BETWEEN 30 AND 200),
            show_card BOOLEAN NOT NULL DEFAULT FALSE,
            -- H5 is a deliberately toned-down option: non-bold, italic, unlike H1-H4.
            title_heading_level VARCHAR(2) NOT NULL DEFAULT 'h3' CHECK (title_heading_level IN ('h1', 'h2', 'h3', 'h4', 'h5')),
            padding_top_mm NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (padding_top_mm BETWEEN 0 AND 100),
            padding_right_mm NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (padding_right_mm BETWEEN 0 AND 100),
            padding_bottom_mm NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (padding_bottom_mm BETWEEN 0 AND 100),
            padding_left_mm NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (padding_left_mm BETWEEN 0 AND 100),
            custom_title VARCHAR(255),
            custom_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            chord_grid_rows JSONB,
            chord_grid_chord_size_px SMALLINT NOT NULL DEFAULT 18 CHECK (chord_grid_chord_size_px BETWEEN 8 AND 40),
            lyrics_text TEXT,
            lyrics_words JSONB,
            linked_to_block_id UUID REFERENCES guitar_songs_layout_column_blocks(id) ON DELETE SET NULL,
            chords JSONB,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE TRIGGER update_guitar_songs_layout_column_blocks_updated_at
        BEFORE UPDATE ON guitar_songs_layout_column_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)
    op.execute(
        "CREATE INDEX idx_guitar_songs_layout_column_blocks_column "
        "ON guitar_songs_layout_column_blocks(column_id)"
    )
    op.execute(
        "CREATE INDEX idx_guitar_songs_layout_column_blocks_linked_to "
        "ON guitar_songs_layout_column_blocks(linked_to_block_id)"
    )
    op.execute("""
        CREATE UNIQUE INDEX guitar_songs_layout_column_blocks_unique
        ON guitar_songs_layout_column_blocks (song_id, block_type)
        WHERE status = 'active' AND block_type NOT IN ('custom', 'sections', 'chord_grid', 'chords')
    """)


def _create_layout_pdf_cache_table() -> None:
    """The rendered PDF of a song's layout is expensive to build, so only one copy is kept per
    song. It's regenerated only when the content_hash (of the fully-resolved HTML that would be
    rendered) no longer matches what's stored, so an unchanged song is served its already-
    rendered PDF instead of re-running WeasyPrint on every download."""
    op.execute("""
        CREATE TABLE guitar_songs_layout_pdf_cache (
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
        CREATE TRIGGER update_guitar_songs_layout_pdf_cache_updated_at
        BEFORE UPDATE ON guitar_songs_layout_pdf_cache FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    """)


def _backfill_search_index() -> None:
    op.execute("""
        INSERT INTO search_index (
            entity_type, entity_id, content_text, content_summary,
            routing_path, status, created_at, updated_at, created_by, updated_by
        )
        SELECT
            'todo_item',
            ti.id,
            TRIM(CONCAT_WS(' ',
                ti.title,
                (SELECT string_agg(l.name, ' ' ORDER BY l.name)
                 FROM label_entities le
                 JOIN labels l ON l.id = le.label_id
                 WHERE le.entity_id = ti.id
                   AND le.entity_type = 'todo_item'
                   AND l.status = 'active'),
                d.content_text
            )),
            ti.title,
            '/app/tribes/' || t.url_param_id
                || '/projects/' || p.url_param_id
                || '/' || pf.id::text
                || '?taskId=' || ti.id::text,
            'active',
            NOW(),
            NOW(),
            NULL,
            NULL
        FROM todo_items ti
        JOIN projects_features pf ON pf.id = ti.feature_instance_id AND pf.status = 'active'
        JOIN projects p ON p.id = pf.project_id AND p.status = 'active'
        JOIN tribes_projects tp ON tp.project_id = p.id
        JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
        LEFT JOIN documents d ON d.id = ti.document_id AND d.status = 'active'
        WHERE ti.status != 'archived'
        ON CONFLICT (entity_type, entity_id) DO NOTHING
    """)
    op.execute("""
        INSERT INTO search_index (
            entity_type, entity_id, content_text, content_summary,
            routing_path, status, created_at, updated_at, created_by, updated_by
        )
        SELECT
            'kanban_card',
            kc.id,
            TRIM(CONCAT_WS(' ',
                kc.title,
                (SELECT string_agg(l.name, ' ' ORDER BY l.name)
                 FROM label_entities le
                 JOIN labels l ON l.id = le.label_id
                 WHERE le.entity_id = kc.id
                   AND le.entity_type = 'kanban_card'
                   AND l.status = 'active'),
                d.content_text
            )),
            kc.title,
            '/app/tribes/' || t.url_param_id
                || '/projects/' || p.url_param_id
                || '/' || pf.id::text
                || '?taskId=' || kc.id::text,
            'active',
            NOW(),
            NOW(),
            NULL,
            NULL
        FROM kanban_cards kc
        JOIN projects_features pf ON pf.id = kc.feature_instance_id AND pf.status = 'active'
        JOIN projects p ON p.id = pf.project_id AND p.status = 'active'
        JOIN tribes_projects tp ON tp.project_id = p.id
        JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
        LEFT JOIN documents d ON d.id = kc.document_id AND d.status = 'active'
        WHERE kc.status != 'archived'
        ON CONFLICT (entity_type, entity_id) DO NOTHING
    """)


def downgrade() -> None:
    tables = [
        'guitar_songs_layout_pdf_cache',
        'guitar_songs_layout_column_blocks',
        'guitar_songs_layout_columns',
        'guitar_songs_layout_rows',
        'guitar_songs_layout_settings',
        'guitar_songs_videos',
        'guitar_songs_mastery',
        'guitar_songs',
        'guitar_song_author',
        'guitar_chords',
        'user_quick_add_defaults',
        'journal_blocks',
        'push_subscriptions',
        'events_participants',
        'events',
        'notifications',
        'reminders',
        'dashboard_pinned_tabs',
        'user_bookmarks',
        'user_tab_configs',
        'search_index',
        'publications',
        'document_pages',
        'projects_documents',
        'app_config',
        'document_entities',
        'label_entities',
        'labels',
        'kanban_cards',
        'kanban_columns',
        'todo_items',
        'projects_features',
        'mails_to',
        'mails',
        'positions',
        'tribes_projects',
        'tribes',
        'projects',
        'represents',
        'user_sessions',
        'user_roles',
        'users',
        'persons',
        'document_attachments',
        'documents',
        'role_permissions',
        'roles',
        'permissions',
    ]
    for table in tables:
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE")
