"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-20

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create initial database schema"""

    # Enable UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # Permissions table
    op.execute("""
        CREATE TABLE IF NOT EXISTS permissions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Roles table
    op.execute("""
        CREATE TABLE IF NOT EXISTS roles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Role-Permission junction table
    op.execute("""
        CREATE TABLE IF NOT EXISTS role_permissions (
            role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
            permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
            PRIMARY KEY (role_id, permission_id)
        )
    """)

    # Documents table
    op.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Persons table
    op.execute("""
        CREATE TABLE IF NOT EXISTS persons (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            gender VARCHAR(50) NOT NULL CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Users table
    op.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            login VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # User-Role junction table
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, role_id)
        )
    """)

    # User sessions table
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            session_id VARCHAR(255) UNIQUE NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Projects table
    op.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Tribes table
    op.execute("""
        CREATE TABLE IF NOT EXISTS tribes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) UNIQUE NOT NULL,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Tribe-Project junction table
    op.execute("""
        CREATE TABLE IF NOT EXISTS tribe_projects (
            tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            PRIMARY KEY (tribe_id, project_id)
        )
    """)

    # Positions table
    op.execute("""
        CREATE TABLE IF NOT EXISTS positions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE NOT NULL,
            person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
            position VARCHAR(50) NOT NULL CHECK (position IN ('chief', 'member', 'guest')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (tribe_id, person_id)
        )
    """)

    # Labels table
    op.execute("""
        CREATE TABLE IF NOT EXISTS labels (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Label entities table
    op.execute("""
        CREATE TABLE IF NOT EXISTS label_entities (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            label_id UUID REFERENCES labels(id) ON DELETE CASCADE NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (label_id, entity_type, entity_id)
        )
    """)

    # Document entities table
    op.execute("""
        CREATE TABLE IF NOT EXISTS document_entities (
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

    # Create indexes
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_person_id ON users(person_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_positions_tribe_id ON positions(tribe_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_positions_person_id ON positions(person_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_label_entities_label_id ON label_entities(label_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_label_entities_entity ON label_entities(entity_type, entity_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_document_entities_document_id ON document_entities(document_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_document_entities_entity ON document_entities(entity_type, entity_id)")

    # Create trigger function
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql'
    """)

    # Create triggers
    op.execute("CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_tribes_updated_at BEFORE UPDATE ON tribes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")
    op.execute("CREATE TRIGGER update_labels_updated_at BEFORE UPDATE ON labels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")


def downgrade() -> None:
    """Drop all tables and extensions"""

    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS update_labels_updated_at ON labels")
    op.execute("DROP TRIGGER IF EXISTS update_positions_updated_at ON positions")
    op.execute("DROP TRIGGER IF EXISTS update_tribes_updated_at ON tribes")
    op.execute("DROP TRIGGER IF EXISTS update_projects_updated_at ON projects")
    op.execute("DROP TRIGGER IF EXISTS update_users_updated_at ON users")
    op.execute("DROP TRIGGER IF EXISTS update_persons_updated_at ON persons")
    op.execute("DROP TRIGGER IF EXISTS update_documents_updated_at ON documents")
    op.execute("DROP TRIGGER IF EXISTS update_roles_updated_at ON roles")
    op.execute("DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions")

    # Drop function
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column()")

    # Drop tables in reverse order
    op.execute("DROP TABLE IF EXISTS document_entities CASCADE")
    op.execute("DROP TABLE IF EXISTS label_entities CASCADE")
    op.execute("DROP TABLE IF EXISTS labels CASCADE")
    op.execute("DROP TABLE IF EXISTS positions CASCADE")
    op.execute("DROP TABLE IF EXISTS tribe_projects CASCADE")
    op.execute("DROP TABLE IF EXISTS tribes CASCADE")
    op.execute("DROP TABLE IF EXISTS projects CASCADE")
    op.execute("DROP TABLE IF EXISTS user_sessions CASCADE")
    op.execute("DROP TABLE IF EXISTS user_roles CASCADE")
    op.execute("DROP TABLE IF EXISTS users CASCADE")
    op.execute("DROP TABLE IF EXISTS persons CASCADE")
    op.execute("DROP TABLE IF EXISTS documents CASCADE")
    op.execute("DROP TABLE IF EXISTS role_permissions CASCADE")
    op.execute("DROP TABLE IF EXISTS roles CASCADE")
    op.execute("DROP TABLE IF EXISTS permissions CASCADE")

    # Drop extension
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp"')
