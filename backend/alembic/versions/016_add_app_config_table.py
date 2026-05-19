"""Add app_config table for runtime configuration

Revision ID: 016
Revises: 015
Create Date: 2026-05-19

"""
from alembic import op

revision = '016'
down_revision = '015'
branch_labels = None
depends_on = None


def upgrade() -> None:
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

    op.execute("CREATE TRIGGER update_app_config_updated_at BEFORE UPDATE ON app_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()")

    op.execute("""
        INSERT INTO app_config (key, value, description) VALUES
        ('upload.max_files', '5', 'Maximum number of files that can be attached to a document'),
        ('upload.max_file_size_mb', '10', 'Maximum file size in megabytes for attachments'),
        ('editor.image_extensions', 'jpg,png,jpeg,gif,webp', 'Allowed image extensions in the editor (comma-separated)')
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS update_app_config_updated_at ON app_config")
    op.execute("DROP TABLE IF EXISTS app_config")
