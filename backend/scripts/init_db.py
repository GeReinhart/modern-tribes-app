import os
import re
import asyncio
import argparse
import csv
import json
import random
import string
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dotenv import load_dotenv
import asyncpg

sys.path.append(str(Path(__file__).resolve().parents[1]))
from app.features.guitar.song.layout.default_template import DEFAULT_LAYOUT_ROWS  # noqa: E402
from app.features.guitar.song.layout.lyrics_words import rebuild_words, tokenize_lyrics  # noqa: E402

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
            "groceries_list_meals",
            "meal_recipes",
            "meal_participants",
            "meals",
            "recipe_ingredients",
            "recipes",
            "guitar_songs_layout_column_blocks",
            "guitar_songs_layout_columns",
            "guitar_songs_layout_rows",
            "guitar_songs_layout_settings",
            "guitar_songs_videos",
            "guitar_songs",
            "guitar_song_author",
            "groceries_list_items",
            "groceries_lists",
            "groceries_instance_items",
            "groceries_item_sections",
            "groceries_sections",
            "groceries_items",
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

    async def create_groceries_items(self) -> Dict[str, str]:
        rows = self.load_csv("groceries_items.csv")
        ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                r = await conn.fetchrow(
                    """INSERT INTO groceries_items (name, description, unit, icon)
                       VALUES ($1, $2, $3, $4) RETURNING id""",
                    row["name"], row.get("description") or "", row["unit"], row.get("icon") or None,
                )
                ids[row["name"]] = str(r["id"])
        print(f"✓ Created {len(ids)} groceries items")
        return ids

    async def create_groceries_sections(self) -> Dict[str, str]:
        rows = self.load_csv("groceries_sections.csv")
        ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for position, row in enumerate(rows):
                r = await conn.fetchrow(
                    "INSERT INTO groceries_sections (name, icon, position) VALUES ($1, $2, $3) RETURNING id",
                    row["name"], row.get("icon") or None, position,
                )
                ids[row["name"]] = str(r["id"])
        print(f"✓ Created {len(ids)} groceries sections")
        return ids

    async def create_groceries_item_sections(
        self, groceries_item_ids: Dict[str, str], groceries_section_ids: Dict[str, str]
    ) -> int:
        rows = self.load_csv("groceries_item_sections.csv")
        count = 0
        async with self.pool.acquire() as conn:
            for row in rows:
                if row["item"] not in groceries_item_ids:
                    print(f"✗ Unknown item '{row['item']}' in groceries_item_sections.csv")
                    sys.exit(1)
                if row["section"] not in groceries_section_ids:
                    print(f"✗ Unknown section '{row['section']}' in groceries_item_sections.csv")
                    sys.exit(1)
                await conn.execute(
                    """INSERT INTO groceries_item_sections (groceries_item_id, groceries_section_id)
                       VALUES ($1, $2)""",
                    groceries_item_ids[row["item"]], groceries_section_ids[row["section"]],
                )
                count += 1
        print(f"✓ Created {count} groceries item-section links")
        return count

    async def create_groceries_instance_items(
        self, feature_ids: Dict[str, str], groceries_item_ids: Dict[str, str]
    ) -> int:
        rows = self.load_csv("groceries_instance_items.csv")
        count = 0
        async with self.pool.acquire() as conn:
            for row in rows:
                key = f"{row['project']}|{row['feature_name']}"
                if key not in feature_ids:
                    print(f"✗ Unknown feature '{key}' in groceries_instance_items.csv")
                    sys.exit(1)
                if row["item"] not in groceries_item_ids:
                    print(f"✗ Unknown item '{row['item']}' in groceries_instance_items.csv")
                    sys.exit(1)
                await conn.execute(
                    """INSERT INTO groceries_instance_items (feature_instance_id, groceries_item_id, renewal_duration_days)
                       VALUES ($1, $2, $3)""",
                    feature_ids[key], groceries_item_ids[row["item"]], int(row["renewal_duration_days"]),
                )
                count += 1
        print(f"✓ Created {count} groceries instance items")
        return count

    async def create_groceries_lists(
        self, feature_ids: Dict[str, str], person_ids: Dict[str, str], user_ids: Dict[str, str]
    ) -> Dict[str, str]:
        rows = self.load_csv("groceries_lists.csv")
        ids: Dict[str, str] = {}
        admin_id = user_ids.get("admin")
        async with self.pool.acquire() as conn:
            for row in rows:
                key = f"{row['project']}|{row['feature_name']}"
                if key not in feature_ids:
                    print(f"✗ Unknown feature '{key}' in groceries_lists.csv")
                    sys.exit(1)
                assigned_person = row.get("assigned_person")
                if assigned_person and assigned_person not in person_ids:
                    print(f"✗ Unknown person '{assigned_person}' in groceries_lists.csv")
                    sys.exit(1)
                r = await conn.fetchrow(
                    """INSERT INTO groceries_lists
                           (feature_instance_id, name, scheduled_date, list_status, assigned_person_id,
                            force_on_dashboard, is_favorite, status, created_by, updated_by)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) RETURNING id""",
                    feature_ids[key], row.get("name") or None, row["scheduled_date"],
                    row.get("list_status") or "planned",
                    person_ids[assigned_person] if assigned_person else None,
                    (row.get("force_on_dashboard") or "false").lower() == "true",
                    (row.get("is_favorite") or "false").lower() == "true",
                    row.get("status") or "active",
                    admin_id,
                )
                ids[f"{key}|{row['name']}"] = str(r["id"])
        print(f"✓ Created {len(ids)} groceries lists")
        return ids

    async def create_groceries_list_items(
        self, groceries_list_ids: Dict[str, str], groceries_item_ids: Dict[str, str]
    ) -> int:
        rows = self.load_csv("groceries_list_items.csv")
        count = 0
        async with self.pool.acquire() as conn:
            for row in rows:
                list_key = f"{row['project']}|{row['feature_name']}|{row['list_name']}"
                if list_key not in groceries_list_ids:
                    print(f"✗ Unknown list '{list_key}' in groceries_list_items.csv")
                    sys.exit(1)
                item_name = row.get("item")
                custom_name = row.get("custom_name")
                if item_name and item_name not in groceries_item_ids:
                    print(f"✗ Unknown item '{item_name}' in groceries_list_items.csv")
                    sys.exit(1)
                if not item_name and not custom_name:
                    print(f"✗ Row in groceries_list_items.csv has neither 'item' nor 'custom_name'")
                    sys.exit(1)
                await conn.execute(
                    """INSERT INTO groceries_list_items
                           (groceries_list_id, groceries_item_id, custom_name, custom_unit, comment, quantity,
                            picked_up, position)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
                    groceries_list_ids[list_key], groceries_item_ids[item_name] if item_name else None,
                    custom_name or None, row.get("custom_unit") or None, row.get("comment") or None,
                    row["quantity"], row.get("picked_up", "false").lower() == "true", int(row.get("position") or 0),
                )
                count += 1
        print(f"✓ Created {count} groceries list items")
        return count

    async def _find_or_create_guitar_song_author(self, conn, project_id: str, name: str | None) -> str | None:
        if not name:
            return None
        row = await conn.fetchrow(
            "SELECT id FROM guitar_song_author WHERE project_id = $1 AND name = $2", project_id, name
        )
        if row:
            return str(row["id"])
        row = await conn.fetchrow(
            "INSERT INTO guitar_song_author (project_id, name) VALUES ($1, $2) RETURNING id", project_id, name
        )
        return str(row["id"])

    async def create_guitar_songs(self, project_ids: Dict[str, str], user_ids: Dict[str, str]) -> Dict[str, str]:
        rows = self.load_csv("guitar_songs.csv")
        ids: Dict[str, str] = {}
        admin_id = user_ids.get("admin")
        async with self.pool.acquire() as conn:
            for row in rows:
                if row["project"] not in project_ids:
                    print(f"✗ Unknown project '{row['project']}' in guitar_songs.csv")
                    sys.exit(1)
                document_id = None
                description_html = row.get("description_html") or ""
                if description_html:
                    doc_r = await conn.fetchrow(
                        "INSERT INTO documents (content_html, content_summary, content_text) VALUES ($1, $2, $3) RETURNING id",
                        description_html, description_html[:30], _strip_html(description_html),
                    )
                    document_id = str(doc_r["id"])
                project_id = project_ids[row["project"]]
                author_id = await self._find_or_create_guitar_song_author(conn, project_id, row.get("author") or None)
                difficulty = row.get("difficulty")
                r = await conn.fetchrow(
                    """INSERT INTO guitar_songs (
                           project_id, url_param_id, title, author_id, tempo_bpm, beats_per_bar, capo,
                           chord_diagram_style, chord_diagram_size, document_id, song_state, difficulty,
                           created_by, updated_by
                       )
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13) RETURNING id""",
                    project_id, _generate_url_param_id(), row["title"], author_id,
                    int(row.get("tempo_bpm") or 120), int(row.get("beats_per_bar") or 4),
                    int(row.get("capo") or 0), row.get("chord_diagram_style") or "full",
                    row.get("chord_diagram_size") or "m", document_id, row.get("song_state") or "draft",
                    int(difficulty) if difficulty else None, admin_id,
                )
                ids[f"{row['project']}|{row['title']}"] = str(r["id"])
        print(f"✓ Created {len(ids)} guitar songs")
        return ids

    def _group_song_chords_by_song(self) -> Dict[str, List[Dict]]:
        """A 'chords' block's own chord list is now seeded straight onto the block itself (see
        create_guitar_song_layouts), not into a separate table -- grouped here the same way
        _group_lyrics_blocks_by_song groups guitar_song_lyrics_blocks.csv."""
        rows = self.load_csv("guitar_songs_chords.csv")
        grouped: Dict[str, List[Dict]] = {}
        for row in rows:
            key = f"{row['project']}|{row['song_title']}"
            grouped.setdefault(key, []).append(row)
        for rows_for_song in grouped.values():
            rows_for_song.sort(key=lambda r: int(r.get("position") or 1))
        return grouped

    async def _resolve_song_chords_json(self, conn, song_key: str, chord_rows_by_song: Dict[str, List[Dict]]) -> Optional[str]:
        rows = chord_rows_by_song.get(song_key)
        if not rows:
            return None
        entries = []
        for row in rows:
            chord = await conn.fetchrow("SELECT id FROM guitar_chords WHERE name = $1 LIMIT 1", row["chord_name"])
            if not chord:
                print(f"✗ Unknown chord '{row['chord_name']}' in guitar_songs_chords.csv")
                sys.exit(1)
            entries.append({"chord_id": str(chord["id"]), "comment": row.get("comment") or None})
        return json.dumps(entries)

    def _group_lyrics_blocks_by_song(self) -> Dict[str, List[Dict]]:
        rows = self.load_csv("guitar_song_lyrics_blocks.csv")
        grouped: Dict[str, List[Dict]] = {}
        for row in rows:
            key = f"{row['project']}|{row['song_title']}"
            grouped.setdefault(key, []).append(row)
        for rows_for_song in grouped.values():
            rows_for_song.sort(key=lambda r: int(r["position"]))
        return grouped

    def _group_lyrics_word_chords_by_block(self) -> Dict[Tuple[str, str], List[Dict]]:
        rows = self.load_csv("guitar_song_lyrics_word_chords.csv")
        grouped: Dict[Tuple[str, str], List[Dict]] = {}
        for row in rows:
            key = (f"{row['project']}|{row['song_title']}", row["block_position"])
            grouped.setdefault(key, []).append(row)
        return grouped

    async def _seed_lyrics_words(self, conn, lyrics_text: str, word_chord_rows: List[Dict]) -> list:
        """Tokenizes lyrics_text and attaches each CSV-specified chord at its (line_index,
        word_index, position) coordinate, then hands both to rebuild_words -- the same
        reconciliation the app itself runs on every lyrics edit -- so seeded data exercises
        exactly the code path real content goes through, rather than a hand-built shortcut."""
        old_words_by_line: Dict[int, List[Dict]] = {}
        for line_index, _word_index, word_text in tokenize_lyrics(lyrics_text):
            old_words_by_line.setdefault(line_index, []).append({"text": word_text, "chords": {}})
        for row in word_chord_rows:
            chord = await conn.fetchrow("SELECT id FROM guitar_chords WHERE name = $1 LIMIT 1", row["chord_name"])
            if not chord:
                print(f"✗ Unknown chord '{row['chord_name']}' in guitar_song_lyrics_word_chords.csv")
                sys.exit(1)
            line_index, word_index = int(row["line_index"]), int(row["word_index"])
            if line_index not in old_words_by_line or word_index >= len(old_words_by_line[line_index]):
                print(f"✗ Unknown word at line {line_index}, index {word_index} in guitar_song_lyrics_word_chords.csv")
                sys.exit(1)
            old_words_by_line[line_index][word_index]["chords"][row["position"]] = str(chord["id"])
        old_words = [old_words_by_line[key] for key in sorted(old_words_by_line.keys())]
        return rebuild_words(lyrics_text, old_words)

    async def _insert_lyrics_block(
        self, conn, column_id: str, song_id: str, block_position: int, lyrics_row: Dict,
        word_chord_rows: List[Dict], admin_id: str,
    ) -> str:
        """Inserts one 'sections' block with its content inline -- a link block
        (linked_to_block_position set) gets none of these; its content is another block's,
        wired up by the caller once every block in the song has an id."""
        is_link = bool(lyrics_row.get("linked_to_block_position"))
        lyrics_text = None
        lyrics_words = None
        if not is_link:
            lyrics_text = lyrics_row.get("lyrics_text") or ""
            lyrics_words = json.dumps(await self._seed_lyrics_words(conn, lyrics_text, word_chord_rows))
        row = await conn.fetchrow(
            """INSERT INTO guitar_songs_layout_column_blocks
                   (column_id, song_id, position, block_type, custom_title, lyrics_text,
                    lyrics_words, created_by, updated_by)
               VALUES ($1, $2, $3, 'sections', $4, $5, $6::jsonb, $7, $7) RETURNING id""",
            column_id, song_id, block_position, lyrics_row.get("block_title") or None,
            lyrics_text, lyrics_words, admin_id,
        )
        return row["id"]

    async def create_guitar_song_videos(self, song_ids: Dict[str, str], user_ids: Dict[str, str]) -> int:
        rows = self.load_csv("guitar_song_videos.csv")
        count = 0
        admin_id = user_ids.get("admin")
        async with self.pool.acquire() as conn:
            for row in rows:
                key = f"{row['project']}|{row['song_title']}"
                if key not in song_ids:
                    print(f"✗ Unknown song '{key}' in guitar_song_videos.csv")
                    sys.exit(1)
                await conn.execute(
                    """INSERT INTO guitar_songs_videos (song_id, title, url, position, created_by, updated_by)
                       VALUES ($1, $2, $3, $4, $5, $5)""",
                    song_ids[key], row.get("title") or None, row["url"], int(row.get("position") or 1), admin_id,
                )
                count += 1
        print(f"✓ Created {count} guitar song videos")
        return count

    async def create_guitar_song_layouts(self, song_ids: Dict[str, str], user_ids: Dict[str, str]) -> int:
        """Builds each song's default row/column template. A column whose block_types includes
        'sections' gets one "Lyrics & Chords" block per row of guitar_song_lyrics_blocks.csv for
        that song (in position order), content inserted inline -- or a single bare block if the
        song has no lyrics content at all, showing off the setup picker (e.g. this project's
        other two demo songs, which have no CSV rows)."""
        admin_id = user_ids.get("admin")
        lyrics_rows_by_song = self._group_lyrics_blocks_by_song()
        word_chords_by_block = self._group_lyrics_word_chords_by_block()
        chord_rows_by_song = self._group_song_chords_by_song()
        count = 0
        async with self.pool.acquire() as conn:
            for song_key, song_id in song_ids.items():
                await conn.execute(
                    "INSERT INTO guitar_songs_layout_settings (song_id, created_by, updated_by) VALUES ($1, $2, $2)",
                    song_id, admin_id,
                )
                lyrics_rows = lyrics_rows_by_song.get(song_key, [])
                # linked_to_block_position (a lyrics-block CSV position) -> the real block id it
                # should mirror, resolved after every block in the song has one.
                block_id_by_lyrics_position: Dict[str, str] = {}
                pending_links: List[Tuple[str, str]] = []
                for position, row in enumerate(DEFAULT_LAYOUT_ROWS, start=1):
                    row_r = await conn.fetchrow(
                        """INSERT INTO guitar_songs_layout_rows (song_id, position, page_break_before, created_by, updated_by)
                           VALUES ($1, $2, $3, $4, $4) RETURNING id""",
                        song_id, position, row["page_break_before"], admin_id,
                    )
                    row_id = row_r["id"]
                    for col_position, column in enumerate(row["columns"], start=1):
                        col_r = await conn.fetchrow(
                            """INSERT INTO guitar_songs_layout_columns
                                   (row_id, song_id, position, width_twelfths, align, created_by, updated_by)
                               VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING id""",
                            row_id, song_id, col_position, column["width_twelfths"], column["align"], admin_id,
                        )
                        column_id = col_r["id"]
                        block_position = 0
                        for block_type in column["block_types"]:
                            if block_type != "sections":
                                block_position += 1
                                chords_json = (
                                    await self._resolve_song_chords_json(conn, song_key, chord_rows_by_song)
                                    if block_type == "chords" else None
                                )
                                await conn.execute(
                                    """INSERT INTO guitar_songs_layout_column_blocks
                                           (column_id, song_id, position, block_type, chords, created_by, updated_by)
                                       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $6)""",
                                    column_id, song_id, block_position, block_type, chords_json, admin_id,
                                )
                                continue
                            if not lyrics_rows:
                                block_position += 1
                                await conn.execute(
                                    """INSERT INTO guitar_songs_layout_column_blocks
                                           (column_id, song_id, position, block_type, created_by, updated_by)
                                       VALUES ($1, $2, $3, $4, $5, $5)""",
                                    column_id, song_id, block_position, block_type, admin_id,
                                )
                                continue
                            for lyrics_row in lyrics_rows:
                                block_position += 1
                                word_chord_rows = word_chords_by_block.get((song_key, lyrics_row["position"]), [])
                                block_id = await self._insert_lyrics_block(
                                    conn, column_id, song_id, block_position, lyrics_row, word_chord_rows, admin_id,
                                )
                                block_id_by_lyrics_position[lyrics_row["position"]] = block_id
                                if lyrics_row.get("linked_to_block_position"):
                                    pending_links.append((block_id, lyrics_row["linked_to_block_position"]))
                    count += 1
                for block_id, linked_to_position in pending_links:
                    target_id = block_id_by_lyrics_position.get(linked_to_position)
                    if not target_id:
                        print(f"✗ Unknown linked_to_block_position '{linked_to_position}' for song '{song_key}'")
                        sys.exit(1)
                    await conn.execute(
                        "UPDATE guitar_songs_layout_column_blocks SET linked_to_block_id = $1 WHERE id = $2",
                        target_id, block_id,
                    )
        print(f"✓ Created default layout templates for {len(song_ids)} guitar songs ({count} rows)")
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
            groceries_item_ids = await self.create_groceries_items()
            groceries_section_ids = await self.create_groceries_sections()
            groceries_item_sections_count = await self.create_groceries_item_sections(groceries_item_ids, groceries_section_ids)
            groceries_instance_items_count = await self.create_groceries_instance_items(feature_ids, groceries_item_ids)
            groceries_list_ids = await self.create_groceries_lists(feature_ids, person_ids, user_ids)
            groceries_list_items_count = await self.create_groceries_list_items(groceries_list_ids, groceries_item_ids)
            song_ids = await self.create_guitar_songs(project_ids, user_ids)
            video_count = await self.create_guitar_song_videos(song_ids, user_ids)
            layout_row_count = await self.create_guitar_song_layouts(song_ids, user_ids)
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
            print(f"   • Groceries items:          {len(groceries_item_ids)}")
            print(f"   • Groceries sections:       {len(groceries_section_ids)}")
            print(f"   • Groceries item-sections:  {groceries_item_sections_count}")
            print(f"   • Groceries instance items: {groceries_instance_items_count}")
            print(f"   • Groceries lists:          {len(groceries_list_ids)}")
            print(f"   • Groceries list items:     {groceries_list_items_count}")
            print(f"   • Guitar songs:             {len(song_ids)}")
            print(f"   • Guitar song videos:       {video_count}")
            print(f"   • Guitar song layout rows:  {layout_row_count}")
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
