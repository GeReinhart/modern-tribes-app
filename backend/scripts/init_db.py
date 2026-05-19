import os
import asyncio
import argparse
import csv
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
                await conn.execute("""
                    INSERT INTO alembic_version (version_num)
                    VALUES ('012')
                    ON CONFLICT DO NOTHING
                """)

            print("✓ Database schema initialized")
            print("✓ Alembic stamped at revision 012")
        except FileNotFoundError:
            print(f"✗ Schema file not found: {schema_file}")
            sys.exit(1)
        except Exception as e:
            print(f"✗ Failed to initialize schema: {e}")
            sys.exit(1)

    async def clear_tables(self):
        tables = [
            "document_entities",
            "label_entities",
            "mails_to",
            "mails",
            "tribes_projects",
            "tribe_projects",
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
            "roles",
            "permissions",
        ]
        async with self.pool.acquire() as conn:
            for table in tables:
                try:
                    result = await conn.execute(f"DELETE FROM {table}")
                    count = int(result.split()[-1])
                    if count > 0:
                        print(f"✓ Cleared {table} table ({count} rows)")
                except Exception:
                    pass  # table may not exist in current schema version

    async def create_permissions(self) -> Dict[str, str]:
        rows = self.load_csv("permissions.csv")
        permission_ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                r = await conn.fetchrow(
                    "INSERT INTO permissions (name, description) VALUES ($1, $2) RETURNING id",
                    row["name"],
                    row["description"],
                )
                permission_ids[row["name"]] = str(r["id"])
        print(f"✓ Created {len(permission_ids)} permissions")
        return permission_ids

    async def create_roles(self, permission_ids: Dict[str, str]) -> Dict[str, str]:
        rows = self.load_csv("roles.csv")
        role_ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                r = await conn.fetchrow(
                    "INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id",
                    row["name"],
                    row["description"],
                )
                role_id = r["id"]
                role_ids[row["name"]] = str(role_id)

                for perm_name in (p.strip() for p in row["permissions"].split("|") if p.strip()):
                    if perm_name not in permission_ids:
                        print(f"✗ Unknown permission '{perm_name}' in roles.csv")
                        sys.exit(1)
                    await conn.execute(
                        "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
                        role_id,
                        permission_ids[perm_name],
                    )
        print(f"✓ Created {len(role_ids)} roles")
        return role_ids

    async def create_persons(self) -> Dict[str, str]:
        rows = self.load_csv("persons.csv")
        person_ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                r = await conn.fetchrow(
                    "INSERT INTO persons (first_name, last_name, gender) VALUES ($1, $2, $3) RETURNING id",
                    row["first_name"],
                    row["last_name"],
                    row["gender"],
                )
                key = f"{row['first_name']} {row['last_name']}"
                person_ids[key] = str(r["id"])
        print(f"✓ Created {len(person_ids)} persons")
        return person_ids

    async def create_tribes(self) -> Dict[str, str]:
        rows = self.load_csv("tribes.csv")
        tribe_ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                r = await conn.fetchrow(
                    "INSERT INTO tribes (name) VALUES ($1) RETURNING id",
                    row["name"],
                )
                tribe_ids[row["name"]] = str(r["id"])
        print(f"✓ Created {len(tribe_ids)} tribes")
        return tribe_ids

    async def create_users(
        self, role_ids: Dict[str, str], person_ids: Dict[str, str]
    ) -> List[str]:
        rows = self.load_csv("users.csv")
        user_ids: List[str] = []
        async with self.pool.acquire() as conn:
            for row in rows:
                role_name = row["role"]
                person_name = row["person"]
                if role_name not in role_ids:
                    print(f"✗ Unknown role '{role_name}' in users.csv")
                    sys.exit(1)
                if person_name not in person_ids:
                    print(f"✗ Unknown person '{person_name}' in users.csv")
                    sys.exit(1)

                r = await conn.fetchrow(
                    "INSERT INTO users (login, email, person_id) VALUES ($1, $2, $3) RETURNING id",
                    row["login"],
                    row["email"],
                    person_ids[person_name],
                )
                user_id = r["id"]
                user_ids.append(str(user_id))

                await conn.execute(
                    "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
                    user_id,
                    role_ids[role_name],
                )
        print(f"✓ Created {len(user_ids)} users")
        return user_ids

    async def create_projects(self) -> Dict[str, str]:
        rows = self.load_csv("projects.csv")
        project_ids: Dict[str, str] = {}
        async with self.pool.acquire() as conn:
            for row in rows:
                r = await conn.fetchrow(
                    "INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING id",
                    row["name"],
                    row.get("description") or None,
                )
                project_ids[row["name"]] = str(r["id"])
        print(f"✓ Created {len(project_ids)} projects")
        return project_ids

    async def create_tribes_projects(
        self, tribe_ids: Dict[str, str], project_ids: Dict[str, str]
    ) -> int:
        rows = self.load_csv("tribes_projects.csv")
        count = 0
        async with self.pool.acquire() as conn:
            for row in rows:
                tribe_name = row["tribe"]
                project_name = row["project"]
                if tribe_name not in tribe_ids:
                    print(f"✗ Unknown tribe '{tribe_name}' in tribes_projects.csv")
                    sys.exit(1)
                if project_name not in project_ids:
                    print(f"✗ Unknown project '{project_name}' in tribes_projects.csv")
                    sys.exit(1)
                await conn.execute(
                    "INSERT INTO tribes_projects (tribe_id, project_id, relation) VALUES ($1, $2, $3)",
                    tribe_ids[tribe_name],
                    project_ids[project_name],
                    row["relation"],
                )
                count += 1
        print(f"✓ Created {count} tribe-project relations")
        return count

    async def create_positions(
        self, tribe_ids: Dict[str, str], person_ids: Dict[str, str]
    ) -> List[str]:
        rows = self.load_csv("positions.csv")
        position_ids: List[str] = []
        async with self.pool.acquire() as conn:
            for row in rows:
                tribe_name = row["tribe"]
                person_name = row["person"]
                if tribe_name not in tribe_ids:
                    print(f"✗ Unknown tribe '{tribe_name}' in positions.csv")
                    sys.exit(1)
                if person_name not in person_ids:
                    print(f"✗ Unknown person '{person_name}' in positions.csv")
                    sys.exit(1)

                r = await conn.fetchrow(
                    "INSERT INTO positions (tribe_id, person_id, position) VALUES ($1, $2, $3) RETURNING id",
                    tribe_ids[tribe_name],
                    person_ids[person_name],
                    row["position"],
                )
                position_ids.append(str(r["id"]))
        print(f"✓ Created {len(position_ids)} positions")
        return position_ids

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
            position_ids = await self.create_positions(tribe_ids, person_ids)
            tribes_projects_count = await self.create_tribes_projects(tribe_ids, project_ids)

            print("\n✅ Database initialization completed successfully!\n")
            print("📊 Summary:")
            print(f"   • Permissions: {len(permission_ids)}")
            print(f"   • Roles: {len(role_ids)}")
            print(f"   • Persons: {len(person_ids)}")
            print(f"   • Tribes: {len(tribe_ids)}")
            print(f"   • Projects: {len(project_ids)}")
            print(f"   • Users: {len(user_ids)}")
            print(f"   • Positions: {len(position_ids)}")
            print(f"   • Tribe-project relations: {tribes_projects_count}")

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
