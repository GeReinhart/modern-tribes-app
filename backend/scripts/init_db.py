import os
import asyncio
import argparse
import csv
import random
import string
from datetime import datetime, timezone
from typing import Dict, List
from dotenv import load_dotenv
import asyncpg
import sys

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password123")
POSTGRES_DB = os.getenv("POSTGRES_DB", "modern_tribes_db")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))

ALEMBIC_REVISION = "001"


_URL_PARAM_CHARS = string.ascii_letters + string.digits


def _generate_url_param_id() -> str:
    return ''.join(random.choices(_URL_PARAM_CHARS, k=6))


class DatabaseInitializer:
    def __init__(self, data_dir: str):
        self.pool = None
        self.data_dir = data_dir

    def load_csv(self, filename: str) -> List[Dict]:
        path = os.path.join(self.data_dir, filename)
        if not os.path.exists(path):
            print(f"✗ CSV file not found: {path}")
            sys.exit(1)
        with open(path, newline="", encoding="utf-8") as f:
            return list(csv.DictReader(f))

    async def connect(self):
        try:
            self.pool = await asyncpg.create_pool(
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                database=POSTGRES_DB,
                host=POSTGRES_HOST,
                port=POSTGRES_PORT,
                min_size=1,
                max_size=1,
            )
            print(f"✓ Connected to PostgreSQL: {POSTGRES_DB}")
        except Exception as e:
            print(f"✗ Failed to connect to PostgreSQL: {e}")
            sys.exit(1)

    async def init_schema(self):
        schema_file = os.path.join(os.path.dirname(__file__), "init_schema.sql")
        try:
            with open(schema_file, "r") as f:
                schema_sql = f.read()

            async with self.pool.acquire() as conn:
                await conn.execute(schema_sql)
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS alembic_version (
                        version_num VARCHAR(32) NOT NULL,
                        CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
                    )
                """)
                await conn.execute(
                    "INSERT INTO alembic_version (version_num) VALUES ($1) ON CONFLICT DO NOTHING",
                    ALEMBIC_REVISION,
                )

            print("✓ Database schema initialized")
            print(f"✓ Alembic stamped at revision {ALEMBIC_REVISION}")
        except FileNotFoundError:
            print(f"✗ Schema file not found: {schema_file}")
            sys.exit(1)
        except Exception as e:
            print(f"✗ Failed to initialize schema: {e}")
            sys.exit(1)

    async def clear_tables(self):
        tables = [
            "notifications",
            "publications",
            "document_pages",
            "document_entities",
            "label_entities",
            "mails_to",
            "mails",
            "represents",
            "user_sessions",
            "user_roles",
            "role_permissions",
            "users",
            "persons",
            "documents",
            "labels",
            "app_config",
            "roles",
            "permissions",
        ]
        async with self.pool.acquire() as conn:
            for table in tables:
                try:
                    result = await conn.execute(f"DELETE FROM {table}")
                    count = int(result.split()[-1])
                    if count > 0:
                        print(f"✓ Cleared {table} ({count} rows)")
                except Exception:
                    pass

    async def create_permissions(self) -> Dict[str, str]:
        rows = self.load_csv("permissions.csv")
        ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                r = await conn.fetchrow(
                    "INSERT INTO permissions (name, description) VALUES ($1, $2) RETURNING id",
                    row["name"], row["description"],
                )
                ids[row["name"]] = str(r["id"])
        print(f"✓ Created {len(ids)} permissions")
        return ids

    async def create_roles(self, permission_ids: Dict[str, str]) -> Dict[str, str]:
        rows = self.load_csv("roles.csv")
        ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                r = await conn.fetchrow(
                    "INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id",
                    row["name"], row["description"],
                )
                role_id = r["id"]
                ids[row["name"]] = str(role_id)
                for perm in (p.strip() for p in row["permissions"].split("|") if p.strip()):
                    if perm not in permission_ids:
                        print(f"✗ Unknown permission '{perm}' in roles.csv")
                        sys.exit(1)
                    await conn.execute(
                        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
                        role_id, permission_ids[perm],
                    )
        print(f"✓ Created {len(ids)} roles")
        return ids

    async def create_persons(self) -> Dict[str, str]:
        rows = self.load_csv("persons.csv")
        ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                r = await conn.fetchrow(
                    "INSERT INTO persons (first_name, last_name, gender) VALUES ($1, $2, $3) RETURNING id",
                    row["first_name"], row["last_name"], row["gender"],
                )
                ids[f"{row['first_name']} {row['last_name']}"] = str(r["id"])
        print(f"✓ Created {len(ids)} persons")
        return ids

    async def create_users(
        self, role_ids: Dict[str, str], person_ids: Dict[str, str]
    ) -> Dict[str, str]:
        rows = self.load_csv("users.csv")
        ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                if row["role"] not in role_ids:
                    print(f"✗ Unknown role '{row['role']}' in users.csv")
                    sys.exit(1)
                if row["person"] not in person_ids:
                    print(f"✗ Unknown person '{row['person']}' in users.csv")
                    sys.exit(1)
                r = await conn.fetchrow(
                    "INSERT INTO users (url_param_id, login, email, person_id) VALUES ($1, $2, $3, $4) RETURNING id",
                    _generate_url_param_id(), row["login"], row["email"], person_ids[row["person"]],
                )
                user_id = r["id"]
                ids[row["login"]] = str(user_id)
                await conn.execute(
                    "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
                    user_id, role_ids[row["role"]],
                )
        print(f"✓ Created {len(ids)} users")
        return ids

    async def create_labels(self) -> Dict[str, str]:
        rows = self.load_csv("labels.csv")
        ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                r = await conn.fetchrow(
                    "INSERT INTO labels (name, description) VALUES ($1, $2) RETURNING id",
                    row["name"], row.get("description") or None,
                )
                ids[row["name"]] = str(r["id"])
        print(f"✓ Created {len(ids)} labels")
        return ids

    async def create_mails(self) -> Dict[str, str]:
        rows = self.load_csv("mails.csv")
        ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                planned_at = datetime.fromisoformat(row["planned_at"]).replace(tzinfo=timezone.utc)
                sent_at_raw = row.get("sent_at") or ""
                sent_at = datetime.fromisoformat(sent_at_raw).replace(tzinfo=timezone.utc) if sent_at_raw else None
                r = await conn.fetchrow(
                    """INSERT INTO mails (subject, content_html, mail_type, mail_status, planned_at, sent_at)
                       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id""",
                    row["subject"], row["content_html"],
                    row.get("mail_type") or None, row["mail_status"],
                    planned_at, sent_at,
                )
                ids[row["subject"]] = str(r["id"])
        print(f"✓ Created {len(ids)} mails")
        return ids

    async def create_mails_to(
        self, mail_ids: Dict[str, str], user_ids: Dict[str, str]
    ) -> int:
        rows = self.load_csv("mails_to.csv")
        count = 0
        async with self.pool.acquire() as conn:
            for row in rows:
                if row["mail_subject"] not in mail_ids:
                    print(f"✗ Unknown mail subject '{row['mail_subject']}' in mails_to.csv")
                    sys.exit(1)
                if row["user_login"] not in user_ids:
                    print(f"✗ Unknown user '{row['user_login']}' in mails_to.csv")
                    sys.exit(1)
                await conn.execute(
                    "INSERT INTO mails_to (mail_id, user_id) VALUES ($1, $2)",
                    mail_ids[row["mail_subject"]], user_ids[row["user_login"]],
                )
                count += 1
        print(f"✓ Created {count} mail recipients")
        return count

    async def create_represents(
        self, person_ids: Dict[str, str], user_ids: Dict[str, str]
    ) -> int:
        rows = self.load_csv("represents.csv")
        count = 0
        async with self.pool.acquire() as conn:
            for row in rows:
                if row["user_login"] not in user_ids:
                    print(f"✗ Unknown user '{row['user_login']}' in represents.csv")
                    sys.exit(1)
                if row["person"] not in person_ids:
                    print(f"✗ Unknown person '{row['person']}' in represents.csv")
                    sys.exit(1)
                await conn.execute(
                    "INSERT INTO represents (user_id, person_id) VALUES ($1, $2)",
                    user_ids[row["user_login"]], person_ids[row["person"]],
                )
                count += 1
        print(f"✓ Created {count} represents relations")
        return count

    async def create_notifications(self, user_ids: Dict[str, str]) -> int:
        rows = self.load_csv("notifications.csv")
        count = 0
        async with self.pool.acquire() as conn:
            for row in rows:
                if row["target_user_login"] not in user_ids:
                    print(f"✗ Unknown user '{row['target_user_login']}' in notifications.csv")
                    sys.exit(1)
                sent_at_raw = row.get("sent_at") or ""
                sent_at = datetime.fromisoformat(sent_at_raw).replace(tzinfo=timezone.utc) if sent_at_raw else None
                await conn.execute(
                    """INSERT INTO notifications
                       (url_param_id, target_user_id, message, sent_at, notification_status)
                       VALUES ($1, $2, $3, $4, $5)""",
                    _generate_url_param_id(),
                    user_ids[row["target_user_login"]],
                    row["message"],
                    sent_at,
                    row.get("notification_status") or "planned",
                )
                count += 1
        print(f"✓ Created {count} notifications")
        return count

    async def create_app_config(self) -> None:
        async with self.pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO app_config (key, value, description) VALUES
                ('upload.max_files', '5', 'Maximum number of files that can be attached to a document'),
                ('upload.max_file_size_mb', '10', 'Maximum file size in megabytes for attachments'),
                ('editor.image_extensions', 'jpg,png,jpeg,gif,webp', 'Allowed image extensions in the editor (comma-separated)')
                ON CONFLICT (key) DO NOTHING
            """)
        print("✓ Created app_config defaults")

    async def run(self):
        try:
            print(f"\n🚀 Starting database initialization (data dir: {self.data_dir})...\n")

            await self.connect()
            await self.init_schema()
            await self.clear_tables()

            print("\n📝 Creating data...\n")

            permission_ids = await self.create_permissions()
            role_ids = await self.create_roles(permission_ids)
            person_ids = await self.create_persons()
            user_ids = await self.create_users(role_ids, person_ids)
            label_ids = await self.create_labels()
            mail_ids = await self.create_mails()
            mails_to_count = await self.create_mails_to(mail_ids, user_ids)
            represents_count = await self.create_represents(person_ids, user_ids)
            notifications_count = await self.create_notifications(user_ids)
            await self.create_app_config()

            print("\n✅ Database initialization completed successfully!\n")
            print("📊 Summary:")
            print(f"   • Permissions:              {len(permission_ids)}")
            print(f"   • Roles:                    {len(role_ids)}")
            print(f"   • Persons:                  {len(person_ids)}")
            print(f"   • Users:                    {len(user_ids)}")
            print(f"   • Labels:                   {len(label_ids)}")
            print(f"   • Mails:                    {len(mail_ids)}")
            print(f"   • Mail recipients:          {mails_to_count}")
            print(f"   • Represents relations:     {represents_count}")
            print(f"   • Notifications:            {notifications_count}")

        except Exception as e:
            print(f"\n✗ Error during initialization: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
        finally:
            if self.pool:
                await self.pool.close()
                print("\n🔌 PostgreSQL connection closed\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize the database with seed data from CSV files")
    parser.add_argument(
        "--data-dir",
        default=os.path.join(os.path.dirname(__file__), "data-dev"),
        help="Directory containing CSV seed files (default: ./data-dev)",
    )
    args = parser.parse_args()

    initializer = DatabaseInitializer(data_dir=args.data_dir)
    asyncio.run(initializer.run())
