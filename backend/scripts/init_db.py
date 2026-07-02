import os
import re
import asyncio
import argparse
import csv
import random
import string
from datetime import datetime, timezone
from typing import Dict, List, Tuple
from dotenv import load_dotenv
import asyncpg
import sys

load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password123")
POSTGRES_DB = os.getenv("POSTGRES_DB", "modern_tribes_db")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))

ALEMBIC_REVISION = "003"


_URL_PARAM_CHARS = string.ascii_letters + string.digits


def _generate_url_param_id() -> str:
    return ''.join(random.choices(_URL_PARAM_CHARS, k=6))


def _strip_html(html: str) -> str:
    return re.sub(r'<[^>]+>', ' ', html or '').strip()


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
            "push_subscriptions",
            "notifications",
            "publications",
            "document_pages",
            "projects_documents",
            "todo_items",
            "projects_features",
            "document_entities",
            "label_entities",
            "mails_to",
            "mails",
            "tribes_projects",
            "positions",
            "represents",
            "user_sessions",
            "user_roles",
            "role_permissions",
            "users",
            "persons",
            "tribes",
            "projects",
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

    async def create_tribes(self) -> Dict[str, str]:
        rows = self.load_csv("tribes.csv")
        ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                r = await conn.fetchrow(
                    "INSERT INTO tribes (url_param_id, name) VALUES ($1, $2) RETURNING id",
                    _generate_url_param_id(), row["name"],
                )
                ids[row["name"]] = str(r["id"])
        print(f"✓ Created {len(ids)} tribes")
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

    async def create_projects(self) -> Dict[str, str]:
        rows = self.load_csv("projects.csv")
        ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                r = await conn.fetchrow(
                    "INSERT INTO projects (url_param_id, name, description) VALUES ($1, $2, $3) RETURNING id",
                    _generate_url_param_id(), row["name"], row.get("description") or None,
                )
                ids[row["name"]] = str(r["id"])
        print(f"✓ Created {len(ids)} projects")
        return ids

    async def create_tribes_projects(
        self, tribe_ids: Dict[str, str], project_ids: Dict[str, str]
    ) -> int:
        rows = self.load_csv("tribes_projects.csv")
        count = 0
        async with self.pool.acquire() as conn:
            for row in rows:
                if row["tribe"] not in tribe_ids:
                    print(f"✗ Unknown tribe '{row['tribe']}' in tribes_projects.csv")
                    sys.exit(1)
                if row["project"] not in project_ids:
                    print(f"✗ Unknown project '{row['project']}' in tribes_projects.csv")
                    sys.exit(1)
                await conn.execute(
                    "INSERT INTO tribes_projects (tribe_id, project_id, relation) VALUES ($1, $2, $3)",
                    tribe_ids[row["tribe"]], project_ids[row["project"]], row["relation"],
                )
                count += 1
        print(f"✓ Created {count} tribe-project relations")
        return count

    async def create_positions(
        self, tribe_ids: Dict[str, str], person_ids: Dict[str, str]
    ) -> int:
        rows = self.load_csv("positions.csv")
        count = 0
        async with self.pool.acquire() as conn:
            for row in rows:
                if row["tribe"] not in tribe_ids:
                    print(f"✗ Unknown tribe '{row['tribe']}' in positions.csv")
                    sys.exit(1)
                if row["person"] not in person_ids:
                    print(f"✗ Unknown person '{row['person']}' in positions.csv")
                    sys.exit(1)
                await conn.fetchrow(
                    "INSERT INTO positions (tribe_id, person_id, position) VALUES ($1, $2, $3) RETURNING id",
                    tribe_ids[row["tribe"]], person_ids[row["person"]], row["position"],
                )
                count += 1
        print(f"✓ Created {count} positions")
        return count

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

    async def create_project_documents(
        self, project_ids: Dict[str, str], label_ids: Dict[str, str], user_ids: Dict[str, str]
    ) -> Tuple[Dict[str, str], Dict[str, str]]:
        rows = self.load_csv("project_documents.csv")
        pd_ids: Dict[str, str] = {}
        doc_ids: Dict[str, str] = {}
        label_count = 0
        admin_id = user_ids.get("admin")
        async with self.pool.acquire() as conn:
            for row in rows:
                project = row["project"]
                title = row["title"]
                summary = row.get("content_summary") or None
                labels_str = row.get("labels") or ""
                if project not in project_ids:
                    print(f"✗ Unknown project '{project}' in project_documents.csv")
                    sys.exit(1)
                content_html = f"<h2>{title}</h2><p>{summary}</p>" if summary else f"<h2>{title}</h2>"
                content_text = _strip_html(content_html)
                doc_r = await conn.fetchrow(
                    "INSERT INTO documents (content_html, content_summary, content_text) VALUES ($1, $2, $3) RETURNING id",
                    content_html, summary, content_text,
                )
                doc_id = str(doc_r["id"])
                pd_r = await conn.fetchrow(
                    "INSERT INTO projects_documents (url_param_id, project_id, document_id, title, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $5) RETURNING id",
                    _generate_url_param_id(), project_ids[project], doc_id, title, admin_id,
                )
                pd_id = str(pd_r["id"])
                key = f"{project}|{title}"
                pd_ids[key] = pd_id
                doc_ids[key] = doc_id
                for label in (l.strip() for l in labels_str.split("|") if l.strip()):
                    if label not in label_ids:
                        print(f"✗ Unknown label '{label}' in project_documents.csv")
                        sys.exit(1)
                    await conn.execute(
                        "INSERT INTO label_entities (label_id, entity_type, entity_id) VALUES ($1, $2, $3)",
                        label_ids[label], "project_document", pd_id,
                    )
                    label_count += 1
        print(f"✓ Created {len(pd_ids)} project documents with {label_count} label associations")
        return pd_ids, doc_ids

    async def create_publications(
        self, pd_ids: Dict[str, str], doc_ids: Dict[str, str]
    ) -> int:
        rows = self.load_csv("publications.csv")
        count = 0
        async with self.pool.acquire() as conn:
            for row in rows:
                key = f"{row['project']}|{row['document_title']}"
                if key not in pd_ids:
                    print(f"✗ Unknown project document '{key}' in publications.csv")
                    sys.exit(1)
                await conn.execute(
                    "INSERT INTO publications (url_param_id, document_id, project_document_id, status) VALUES ($1, $2, $3, 'active')",
                    _generate_url_param_id(), doc_ids[key], pd_ids[key],
                )
                count += 1
        print(f"✓ Created {count} publications")
        return count

    async def create_document_pages(self, pd_ids: Dict[str, str], user_ids: Dict[str, str]) -> int:
        rows = self.load_csv("document_pages.csv")
        count = 0
        admin_id = user_ids.get("admin")
        async with self.pool.acquire() as conn:
            for row in rows:
                key = f"{row['project']}|{row['document_title']}"
                if key not in pd_ids:
                    print(f"✗ Unknown project document '{key}' in document_pages.csv")
                    sys.exit(1)
                summary = row.get("content_summary") or None
                content_html = f"<p>{summary}</p>" if summary else ""
                content_text = summary or ""
                await conn.execute(
                    """INSERT INTO document_pages
                       (url_param_id, project_document_id, title, content_html,
                        content_summary, content_text, order_index, created_by, updated_by)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)""",
                    _generate_url_param_id(), pd_ids[key],
                    row["title"], content_html, summary, content_text,
                    int(row.get("order_index") or 0), admin_id,
                )
                count += 1
        print(f"✓ Created {count} document pages")
        return count

    async def create_projects_features(
        self, project_ids: Dict[str, str]
    ) -> Dict[str, str]:
        rows = self.load_csv("projects_features.csv")
        ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                if row["project"] not in project_ids:
                    print(f"✗ Unknown project '{row['project']}' in projects_features.csv")
                    sys.exit(1)
                r = await conn.fetchrow(
                    """INSERT INTO projects_features (project_id, feature_type, name, icon, position)
                       VALUES ($1, $2, $3, $4, $5) RETURNING id""",
                    project_ids[row["project"]], row["feature_type"],
                    row["name"], row.get("icon") or None, int(row.get("position") or 0),
                )
                ids[f"{row['project']}|{row['name']}"] = str(r["id"])
        print(f"✓ Created {len(ids)} project features")
        return ids

    async def create_todo_items(self, feature_ids: Dict[str, str], user_ids: Dict[str, str]) -> int:
        rows = self.load_csv("todo_items.csv")
        count = 0
        admin_id = user_ids.get("admin")
        async with self.pool.acquire() as conn:
            for row in rows:
                key = f"{row['project']}|{row['feature_name']}"
                if key not in feature_ids:
                    print(f"✗ Unknown feature '{key}' in todo_items.csv")
                    sys.exit(1)
                await conn.execute(
                    """INSERT INTO todo_items (feature_instance_id, title, todo_status, position, created_by, updated_by)
                       VALUES ($1, $2, $3, $4, $5, $5)""",
                    feature_ids[key], row["title"],
                    row.get("todo_status") or "todo", int(row.get("position") or 0), admin_id,
                )
                count += 1
        print(f"✓ Created {count} todo items")
        return count

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
            tribe_ids = await self.create_tribes()
            project_ids = await self.create_projects()
            user_ids = await self.create_users(role_ids, person_ids)
            await self.create_positions(tribe_ids, person_ids)
            tribes_projects_count = await self.create_tribes_projects(tribe_ids, project_ids)
            label_ids = await self.create_labels()
            pd_ids, doc_ids = await self.create_project_documents(project_ids, label_ids, user_ids)
            publications_count = await self.create_publications(pd_ids, doc_ids)
            pages_count = await self.create_document_pages(pd_ids, user_ids)
            feature_ids = await self.create_projects_features(project_ids)
            todo_count = await self.create_todo_items(feature_ids, user_ids)
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
            print(f"   • Tribes:                   {len(tribe_ids)}")
            print(f"   • Projects:                 {len(project_ids)}")
            print(f"   • Users:                    {len(user_ids)}")
            print(f"   • Tribe-project relations:  {tribes_projects_count}")
            print(f"   • Labels:                   {len(label_ids)}")
            print(f"   • Project documents:        {len(pd_ids)}")
            print(f"   • Publications:             {publications_count}")
            print(f"   • Document pages:           {pages_count}")
            print(f"   • Project features:         {len(feature_ids)}")
            print(f"   • Todo items:               {todo_count}")
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
