# Database Migrations Guide

This project uses **Alembic** for managing database schema changes. Alembic provides a systematic way to evolve your database schema over time without losing data.

## Overview

Alembic allows you to:
- Track schema changes in version control
- Apply changes incrementally (upgrade)
- Rollback changes if needed (downgrade)
- Keep production and development databases in sync

## Directory Structure

```
backend/
├── alembic/
│   ├── versions/           # Migration files
│   │   └── 001_initial_schema.py
│   ├── env.py             # Alembic environment configuration
│   └── script.py.mako     # Template for new migrations
├── alembic.ini            # Alembic configuration
└── MIGRATIONS.md          # This file
```

## Initial Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Make sure your `.env` file has the correct PostgreSQL credentials:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password123
POSTGRES_DB=modern_tribes_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:password123@localhost:5432/modern_tribes_db
```

## Common Commands

### View Current Migration Status

```bash
cd backend
alembic current
```

### View Migration History

```bash
alembic history --verbose
```

### Apply All Pending Migrations (Upgrade to Latest)

```bash
alembic upgrade head
```

### Apply Migrations to a Specific Revision

```bash
alembic upgrade <revision_id>
# Example: alembic upgrade 001
```

### Rollback Last Migration

```bash
alembic downgrade -1
```

### Rollback to a Specific Revision

```bash
alembic downgrade <revision_id>
# Example: alembic downgrade base  # Removes all migrations
```

### Show SQL Without Executing (Dry Run)

```bash
alembic upgrade head --sql
```

## Creating New Migrations

### Option 1: Manual Migration (Recommended for PostgreSQL without ORM)

When you need to modify the schema:

1. **Create a new migration file:**

```bash
cd backend
alembic revision -m "add_column_to_users"
```

This creates a new file in `alembic/versions/` like `abc123_add_column_to_users.py`

2. **Edit the migration file:**

```python
def upgrade() -> None:
    """Add new column"""
    op.execute("""
        ALTER TABLE users
        ADD COLUMN phone VARCHAR(20)
    """)

def downgrade() -> None:
    """Remove column"""
    op.execute("""
        ALTER TABLE users
        DROP COLUMN phone
    """)
```

3. **Test the migration:**

```bash
# Test upgrade
alembic upgrade head

# Test downgrade
alembic downgrade -1

# Re-apply
alembic upgrade head
```

### Option 2: Auto-generate Migration (If using SQLAlchemy models)

If you decide to use SQLAlchemy ORM models in the future:

```bash
alembic revision --autogenerate -m "description"
```

**Note:** Currently, this project uses raw SQL, so manual migrations are recommended.

## Migration Examples

### Example 1: Adding a New Column

```python
"""Add phone to users

Revision ID: 002
Revises: 001
"""

def upgrade() -> None:
    op.execute("""
        ALTER TABLE users
        ADD COLUMN phone VARCHAR(20)
    """)

def downgrade() -> None:
    op.execute("""
        ALTER TABLE users
        DROP COLUMN phone
    """)
```

### Example 2: Creating a New Table

```python
"""Add notifications table

Revision ID: 003
Revises: 002
"""

def upgrade() -> None:
    op.execute("""
        CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    op.execute("""
        CREATE INDEX idx_notifications_user_id ON notifications(user_id)
    """)

def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS notifications CASCADE")
```

### Example 3: Adding an Index

```python
"""Add index on users.email

Revision ID: 004
Revises: 003
"""

def upgrade() -> None:
    op.execute("""
        CREATE INDEX idx_users_email_lower ON users(LOWER(email))
    """)

def downgrade() -> None:
    op.execute("""
        DROP INDEX IF EXISTS idx_users_email_lower
    """)
```

### Example 4: Modifying a Column Type

```python
"""Change user login to text

Revision ID: 005
Revises: 004
"""

def upgrade() -> None:
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN login TYPE TEXT
    """)

def downgrade() -> None:
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN login TYPE VARCHAR(255)
    """)
```

## Best Practices

### 1. **Always Test Migrations**

Test both upgrade and downgrade paths:

```bash
# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1

# Re-apply
alembic upgrade head
```

### 2. **Use Transactions**

Alembic automatically wraps migrations in transactions. If a migration fails, changes are rolled back.

### 3. **Keep Migrations Small**

Create focused migrations that do one thing. This makes them easier to understand and rollback if needed.

### 4. **Document Complex Migrations**

Add comments explaining why a change is needed:

```python
def upgrade() -> None:
    """
    Add composite index on positions table to improve query performance
    for tribe member lookups. This addresses the slow performance reported
    in ticket #123.
    """
    op.execute(...)
```

### 5. **Data Migrations**

When you need to transform data:

```python
def upgrade() -> None:
    # Add new column
    op.execute("ALTER TABLE users ADD COLUMN full_name TEXT")

    # Migrate data
    op.execute("""
        UPDATE users
        SET full_name = first_name || ' ' || last_name
        WHERE full_name IS NULL
    """)

    # Make it NOT NULL after data is migrated
    op.execute("ALTER TABLE users ALTER COLUMN full_name SET NOT NULL")

def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN full_name")
```

### 6. **Backup Before Production Migrations**

Always backup production database before running migrations:

```bash
pg_dump -U postgres -d modern_tribes_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Deployment Workflow

### Development

```bash
# Create migration
alembic revision -m "add_new_feature"

# Edit migration file
# ... add your SQL ...

# Test locally
alembic upgrade head

# Commit to git
git add alembic/versions/*.py
git commit -m "Add migration: add_new_feature"
```

### Production

```bash
# Pull latest code
git pull

# Backup database
pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > backup.sql

# Check current status
alembic current

# Apply migrations
alembic upgrade head

# Verify
psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\dt"
```

## Integration with init_db.py

The `scripts/init_db.py` script is for **development only**. It:
- Drops all data
- Runs migrations via `init_schema.sql`
- Seeds with test data

**For production**, use Alembic migrations instead:

```bash
# Don't use init_db.py in production!
# Use Alembic:
alembic upgrade head
```

## Troubleshooting

### "Target database is not up to date"

Your database has migrations that aren't tracked. Either:

```bash
# Stamp current database as up-to-date
alembic stamp head

# Or start fresh (development only!)
dropdb modern_tribes_db
createdb modern_tribes_db
alembic upgrade head
```

### "Can't locate revision"

The `alembic_version` table is out of sync:

```bash
# Check current stamp
psql -d modern_tribes_db -c "SELECT * FROM alembic_version;"

# Re-stamp if needed
alembic stamp 001  # or whatever revision you're at
```

### "Migration failed halfway"

Alembic uses transactions, so partial failures are rolled back. But if your migration has multiple `op.execute()` calls outside a transaction:

```python
def upgrade() -> None:
    # Wrap everything in explicit transaction if needed
    op.execute("BEGIN")
    try:
        op.execute("ALTER TABLE...")
        op.execute("CREATE INDEX...")
        op.execute("COMMIT")
    except:
        op.execute("ROLLBACK")
        raise
```

## Additional Resources

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [FastAPI + Alembic Tutorial](https://fastapi.tiangolo.com/tutorial/sql-databases/)

## Summary

1. **Creating migrations**: `alembic revision -m "description"`
2. **Applying migrations**: `alembic upgrade head`
3. **Rolling back**: `alembic downgrade -1`
4. **Checking status**: `alembic current`
5. **Viewing history**: `alembic history`

For any questions or issues, check the Alembic logs or consult the team lead.
