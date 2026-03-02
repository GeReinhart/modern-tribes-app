import os
import asyncio
from datetime import datetime
from typing import List
from dotenv import load_dotenv
import asyncpg
import sys

# Load environment variables
load_dotenv()

POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password123")
POSTGRES_DB = os.getenv("POSTGRES_DB", "modern_tribes_db")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))

class DatabaseInitializer:
    def __init__(self):
        self.pool = None

    async def connect(self):
        """Connect to PostgreSQL"""
        try:
            self.pool = await asyncpg.create_pool(
                user=POSTGRES_USER,
                password=POSTGRES_PASSWORD,
                database=POSTGRES_DB,
                host=POSTGRES_HOST,
                port=POSTGRES_PORT
            )
            print(f"✓ Connected to PostgreSQL: {POSTGRES_DB}")
        except Exception as e:
            print(f"✗ Failed to connect to PostgreSQL: {e}")
            sys.exit(1)

    async def init_schema(self):
        """Initialize database schema from SQL file"""
        schema_file = os.path.join(os.path.dirname(__file__), "init_schema.sql")

        try:
            with open(schema_file, 'r') as f:
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
                    VALUES ('001')
                    ON CONFLICT DO NOTHING
                """)

            print("✓ Database schema initialized")
            print("✓ Alembic stamped at revision 001")
        except FileNotFoundError:
            print(f"✗ Schema file not found: {schema_file}")
            sys.exit(1)
        except Exception as e:
            print(f"✗ Failed to initialize schema: {e}")
            sys.exit(1)

    async def clear_tables(self):
        """Clear all tables"""
        tables = [
            "document_entities",
            "label_entities",
            "tribe_projects",
            "positions",
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
            "permissions"
        ]

        async with self.pool.acquire() as conn:
            for table in tables:
                result = await conn.execute(f"DELETE FROM {table}")
                count = int(result.split()[-1])
                if count > 0:
                    print(f"✓ Cleared {table} table ({count} rows)")

    async def create_permissions(self) -> List[str]:
        """Create 4 permissions"""
        permissions = [
            ("admin", "Full administrative access"),
            ("can_create_own_tribes", "Can create tribes"),
            ("can_access_attached_tribes", "Can access to all elements of its tribes given its position"),
            ("can_manage_own_profile", "Can update its own profile")
        ]

        permission_ids = []
        async with self.pool.acquire() as conn:
            for name, description in permissions:
                row = await conn.fetchrow("""
                    INSERT INTO permissions (name, description)
                    VALUES ($1, $2)
                    RETURNING id
                """, name, description)
                permission_ids.append(str(row['id']))

        print(f"✓ Created {len(permission_ids)} permissions")
        return permission_ids

    async def create_roles(self, permission_ids: List[str]) -> List[str]:
        """Create 3 roles with different permissions"""
        roles_data = [
            ("Admin", "Administrator role with full access", [permission_ids[0]]),
            ("Advanced user", "Can create tribes and have access to all elements of its tribes given its position",
             [permission_ids[1], permission_ids[2], permission_ids[3]]),
            ("User", "Can access to all elements of its tribes given its position",
             [permission_ids[2], permission_ids[3]])
        ]

        role_ids = []
        async with self.pool.acquire() as conn:
            for name, description, perm_ids in roles_data:
                # Insert role
                row = await conn.fetchrow("""
                    INSERT INTO roles (name, description)
                    VALUES ($1, $2)
                    RETURNING id
                """, name, description)
                role_id = row['id']
                role_ids.append(str(role_id))

                # Insert role-permission relationships
                for perm_id in perm_ids:
                    await conn.execute("""
                        INSERT INTO role_permissions (role_id, permission_id)
                        VALUES ($1, $2)
                    """, role_id, perm_id)

        print(f"✓ Created {len(role_ids)} roles")
        return role_ids

    async def create_persons(self, count: int = 40) -> List[str]:
        """Create 40 persons with realistic names"""
        first_names = [
            "John", "Jane", "Michael", "Emma", "David", "Sarah", "Robert", "Lisa",
            "James", "Maria", "William", "Anna", "Richard", "Jennifer", "Joseph",
            "Patricia", "Thomas", "Barbara", "Charles", "Susan", "Christopher", "Jessica",
            "Daniel", "Michelle", "Matthew", "Deborah", "Mark", "Melissa", "Donald",
            "Karen", "George", "Nancy", "Kenneth", "Lauren", "Steven", "Rebecca",
            "Edward", "Helen", "Brian", "Sandra", "Ronald", "Ashley"
        ]

        last_names = [
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
            "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
            "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
            "Lee", "Harris", "Clark", "Lewis", "Walker", "Hall", "Young",
            "King", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams",
            "Nelson", "Carter", "Roberts", "Phillips", "Campbell", "Parker", "Evans"
        ]

        genders = ["male", "female", "other", "prefer_not_to_say"]

        person_ids = []
        async with self.pool.acquire() as conn:
            for i in range(count):
                first_name = first_names[i % len(first_names)]
                last_name = last_names[i % len(last_names)]
                gender = genders[i % len(genders)]

                row = await conn.fetchrow("""
                    INSERT INTO persons (first_name, last_name, gender)
                    VALUES ($1, $2, $3)
                    RETURNING id
                """, first_name, last_name, gender)
                person_ids.append(str(row['id']))

        print(f"✓ Created {len(person_ids)} persons")
        return person_ids

    async def create_users(self, role_ids: List[str], person_ids: List[str]) -> List[str]:
        """Create 10 users (1 with admin role, rest distributed)"""
        users_data = [
            ("admin", "admin@modern-tribes.com", [role_ids[0]], person_ids[0])
        ]

        # Regular users
        for i in range(1, 10):
            role_idx = 1 if i <= 5 else 2
            users_data.append((
                f"user{i}",
                f"user{i}@modern-tribes.com",
                [role_ids[role_idx]],
                person_ids[i % len(person_ids)]
            ))

        user_ids = []
        async with self.pool.acquire() as conn:
            for login, email, role_id_list, person_id in users_data:
                # Insert user
                row = await conn.fetchrow("""
                    INSERT INTO users (login, email, person_id)
                    VALUES ($1, $2, $3)
                    RETURNING id
                """, login, email, person_id)
                user_id = row['id']
                user_ids.append(str(user_id))

                # Insert user-role relationships
                for role_id in role_id_list:
                    await conn.execute("""
                        INSERT INTO user_roles (user_id, role_id)
                        VALUES ($1, $2)
                    """, user_id, role_id)

        print(f"✓ Created {len(user_ids)} users (1 admin, 5 tribe chiefs, 4 members)")
        return user_ids

    async def create_tribes(self) -> List[str]:
        """Create 10 tribes themed as families and friend groups"""
        tribes_data = [
            ("The Smith Family", "A close-knit family"),
            ("Downtown Friends", "College friends living in the city"),
            ("The Johnson Clan", "Extended family gatherings"),
            ("Game Night Crew", "Friends who meet every Friday"),
            ("The Williams Dynasty", "Multi-generational family"),
            ("Hiking Buddies", "Adventure seeking friend group"),
            ("The Brown Household", "Modern blended family"),
            ("Book Club Circle", "Friends bonded over literature"),
            ("The Martinez Family", "Family with cultural traditions"),
            ("Sports Enthusiasts", "Friends passionate about sports")
        ]

        tribe_ids = []
        async with self.pool.acquire() as conn:
            for name, description in tribes_data:
                row = await conn.fetchrow("""
                    INSERT INTO tribes (name)
                    VALUES ($1)
                    RETURNING id
                """, name)
                tribe_ids.append(str(row['id']))

        print(f"✓ Created {len(tribe_ids)} tribes (families and friend groups)")
        return tribe_ids

    async def create_positions(self, tribe_ids: List[str], person_ids: List[str]) -> List[str]:
        """
        Create positions attaching persons to tribes with various roles.
        Distribute 40 persons across 10 tribes (avg 4 per tribe).
        Each tribe has: 1 chief, 1-2 members, 1 guest
        """
        positions = []
        persons_per_tribe = 4
        person_idx = 0

        for tribe_id in tribe_ids:
            for pos_in_tribe in range(persons_per_tribe):
                if person_idx >= len(person_ids):
                    person_idx = 0

                if pos_in_tribe == 0:
                    position = "chief"
                elif pos_in_tribe == persons_per_tribe - 1:
                    position = "guest"
                else:
                    position = "member"

                positions.append((tribe_id, person_ids[person_idx], position))
                person_idx += 1

        position_ids = []
        async with self.pool.acquire() as conn:
            for tribe_id, person_id, position in positions:
                row = await conn.fetchrow("""
                    INSERT INTO positions (tribe_id, person_id, position)
                    VALUES ($1, $2, $3)
                    RETURNING id
                """, tribe_id, person_id, position)
                position_ids.append(str(row['id']))

        print(f"✓ Created {len(position_ids)} positions")
        print(f"   └─ Distribution: 10 chiefs, 20 members, 10 guests across tribes")
        return position_ids

    async def run(self):
        """Run the full initialization"""
        try:
            print("\n🚀 Starting database initialization...\n")

            await self.connect()
            await self.init_schema()
            await self.clear_tables()

            print("\n📝 Creating data...\n")

            # Create data in order
            permission_ids = await self.create_permissions()
            role_ids = await self.create_roles(permission_ids)
            person_ids = await self.create_persons(40)
            user_ids = await self.create_users(role_ids, person_ids)
            tribe_ids = await self.create_tribes()
            position_ids = await self.create_positions(tribe_ids, person_ids)

            print("\n✅ Database initialization completed successfully!\n")
            print("📊 Summary:")
            print(f"   • Permissions: 4")
            print(f"   • Roles: 3")
            print(f"   • Users: 10 (1 admin, 5 advanced users, 4 basic users)")
            print(f"   • Persons: 40")
            print(f"   • Tribes: 10 (families and friend groups)")
            print(f"   • Positions: 40 (persons assigned to tribes)")
            print(f"\n👥 User Accounts:")
            print(f"   • Admin: admin@modern-tribes.com")
            print(f"   • Users: user1-9@modern-tribes.com\n")

        except Exception as e:
            print(f"\n✗ Error during initialization: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
        finally:
            if self.pool:
                await self.pool.close()
                print("🔌 PostgreSQL connection closed\n")


if __name__ == "__main__":
    initializer = DatabaseInitializer()
    asyncio.run(initializer.run())
