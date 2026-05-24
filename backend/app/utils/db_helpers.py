from fastapi import HTTPException
from typing import Optional, Dict, Any, List
from datetime import datetime
import asyncpg
import random
import string
from uuid import UUID
import json


TABLES_WITH_STATUS = frozenset({
    'permissions', 'roles', 'documents', 'persons',
    'users', 'projects', 'tribes', 'positions', 'labels'
})

URL_PARAM_ID_TABLES = frozenset({
    'users', 'tribes', 'projects', 'projects_documents', 'publications', 'document_pages'
})


def generate_url_param_id() -> str:
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=6))


async def resolve_url_param_id(pool: asyncpg.Pool, table: str, id_param: str) -> str:
    """Convert a url_param_id (6-char short ID) to the entity's UUID.
    If id_param is already a valid UUID, returns it unchanged.
    Raises 404 if url_param_id is not found."""
    try:
        UUID(id_param)
        return id_param
    except (ValueError, AttributeError):
        if table not in URL_PARAM_ID_TABLES:
            raise HTTPException(status_code=400, detail="Invalid ID format")
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                f"SELECT id FROM {table} WHERE url_param_id = $1", id_param
            )
        if not row:
            raise HTTPException(status_code=404, detail="Not found")
        return str(row['id'])


def uuid_to_str_recursively(data: Any) -> Any:
    """Convert UUID to string recursively"""
    if isinstance(data, UUID):
        return str(data)
    elif isinstance(data, dict):
        return {key: uuid_to_str_recursively(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [uuid_to_str_recursively(item) for item in data]
    return data


def row_to_dict(row: asyncpg.Record) -> Dict[str, Any]:
    """Convert asyncpg Record to dict with UUID as string (handles nested lists)"""
    if not row:
        return None
    return {key: uuid_to_str_recursively(value) for key, value in dict(row).items()}

def row_with_json_to_dict(row):
    """Convert asyncpg row to dict, convert UUIDs to strings, and parse JSON fields"""
    data = dict(row)

    for key, value in data.items():
        # Convert UUID objects to strings
        if isinstance(value, UUID):
            data[key] = str(value)
        # Parse JSON strings
        elif isinstance(value, str) and value.startswith('['):
            try:
                data[key] = json.loads(value)
            except (json.JSONDecodeError, TypeError):
                pass

    return data

def validate_uuid(id_str: str, field_name: str = "ID") -> str:
    """Validate UUID string format"""
    try:
        UUID(id_str)
        return id_str
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name} format"
        )


async def check_document_exists(
        pool: asyncpg.Pool,
        table: str,
        doc_id: str,
        entity_name: str = "Document"
) -> Dict[str, Any]:
    """Check if a document exists and return it"""
    validate_uuid(doc_id, entity_name)

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"SELECT * FROM {table} WHERE id = $1",
            UUID(doc_id)
        )

    if not row:
        raise HTTPException(
            status_code=404,
            detail=f"{entity_name} not found"
        )

    return row_to_dict(row)


async def check_unique_field(
        pool: asyncpg.Pool,
        table: str,
        field: str,
        value: Any,
        exclude_id: Optional[str] = None,
        error_message: Optional[str] = None
) -> None:
    """Check if a field value is unique in a table"""
    async with pool.acquire() as conn:
        if exclude_id:
            row = await conn.fetchrow(
                f"SELECT id FROM {table} WHERE {field} = $1 AND id != $2",
                value, UUID(exclude_id)
            )
        else:
            row = await conn.fetchrow(
                f"SELECT id FROM {table} WHERE {field} = $1",
                value
            )

    if row:
        message = error_message or f"{field} already exists"
        raise HTTPException(status_code=400, detail=message)


async def _fetch_reference_row(pool: asyncpg.Pool, table: str, ref_id: str) -> bool:
    if table in TABLES_WITH_STATUS:
        query = f"SELECT id FROM {table} WHERE id = $1 AND status = 'active'"
    else:
        query = f"SELECT id FROM {table} WHERE id = $1"
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, UUID(ref_id))
    return bool(row)


async def validate_reference(
        pool: asyncpg.Pool,
        table: str,
        ref_id: Optional[str],
        field_name: str
) -> None:
    """Validate a foreign key reference"""
    if not ref_id:
        return
    validate_uuid(ref_id, field_name)
    try:
        if not await _fetch_reference_row(pool, table, ref_id):
            raise HTTPException(status_code=400, detail=f"{field_name} with ID {ref_id} not found")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid {field_name} ID: {ref_id}")


async def get_all_documents(
        pool: asyncpg.Pool,
        table: str,
        filter_query: Optional[str] = None,
        params: Optional[List] = None,
        any_status: bool = False,
) -> List[Dict[str, Any]]:
    """Get all documents from a table"""
    status_clause = "status = 'active'" if (table in TABLES_WITH_STATUS and not any_status) else None

    if filter_query and status_clause:
        query = f"SELECT * FROM {table} WHERE ({filter_query}) AND {status_clause}"
    elif filter_query:
        query = f"SELECT * FROM {table} WHERE {filter_query}"
    elif status_clause:
        query = f"SELECT * FROM {table} WHERE {status_clause}"
    else:
        query = f"SELECT * FROM {table}"

    query += " ORDER BY created_at DESC"

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *(params or []))

    return [row_to_dict(row) for row in rows]


async def get_document_by_id(
        pool: asyncpg.Pool,
        table: str,
        doc_id: str,
        entity_name: str = "Document"
) -> Dict[str, Any]:
    """Get a single document by ID, filtering inactive entities"""
    validate_uuid(doc_id, entity_name)
    if table in TABLES_WITH_STATUS:
        query = f"SELECT * FROM {table} WHERE id = $1 AND status = 'active'"
    else:
        query = f"SELECT * FROM {table} WHERE id = $1"
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, UUID(doc_id))
    if not row:
        raise HTTPException(status_code=404, detail=f"{entity_name} not found")
    return row_to_dict(row)


async def create_document(
        pool: asyncpg.Pool,
        table: str,
        data: Dict[str, Any]
) -> Dict[str, Any]:
    """Create a new document"""
    if table in URL_PARAM_ID_TABLES and 'url_param_id' not in data:
        data = dict(data)
        data['url_param_id'] = generate_url_param_id()
    columns = list(data.keys())
    placeholders = [f"${i+1}" for i in range(len(columns))]
    values = [data[col] for col in columns]

    query = f"""
        INSERT INTO {table} ({', '.join(columns)})
        VALUES ({', '.join(placeholders)})
        RETURNING *
    """

    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *values)

    return row_to_dict(row)


def _build_update_query(table: str, doc_id: str, data: Dict[str, Any]) -> tuple[str, list]:
    set_parts = []
    values = [UUID(doc_id)]
    for i, (key, value) in enumerate(data.items()):
        if isinstance(value, (list, dict)):
            set_parts.append(f"{key} = ${i+2}::jsonb")
            values.append(json.dumps(value))
        else:
            set_parts.append(f"{key} = ${i+2}")
            values.append(value)
    query = f"UPDATE {table} SET {', '.join(set_parts)} WHERE id = $1 RETURNING *"
    return query, values


async def update_document(
        pool: asyncpg.Pool,
        table: str,
        doc_id: str,
        data: Dict[str, Any],
        entity_name: str = "Document"
) -> Dict[str, Any]:
    """Update an existing document"""
    validate_uuid(doc_id, entity_name)
    await check_document_exists(pool, table, doc_id, entity_name)
    query, values = _build_update_query(table, doc_id, data)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *values)
    if not row:
        raise HTTPException(status_code=404, detail=f"{entity_name} not found")
    return row_to_dict(row)


async def delete_document(
        pool: asyncpg.Pool,
        table: str,
        doc_id: str,
        entity_name: str = "Document"
) -> None:
    """Delete a document"""
    validate_uuid(doc_id, entity_name)

    async with pool.acquire() as conn:
        result = await conn.execute(
            f"DELETE FROM {table} WHERE id = $1",
            UUID(doc_id)
        )

    if result == "DELETE 0":
        raise HTTPException(
            status_code=404,
            detail=f"{entity_name} not found"
        )


async def check_cascade_constraint(
        pool: asyncpg.Pool,
        table: str,
        field: str,
        value: str,
        entity_name: str,
        dependent_entity: str
) -> None:
    """Check if deleting would violate referential integrity"""
    async with pool.acquire() as conn:
        count = await conn.fetchval(
            f"SELECT COUNT(*) FROM {table} WHERE {field} = $1",
            UUID(value)
        )

    if count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete {entity_name}. {count} {dependent_entity}(s) are using this {entity_name}. Please update or remove these {dependent_entity}s first."
        )


async def validate_references_list(
        pool: asyncpg.Pool,
        table: str,
        ref_ids: List[str],
        field_name: str
) -> None:
    """Validate a list of foreign key references"""
    if not ref_ids:
        return

    for ref_id in ref_ids:
        if ref_id:  # Skip empty strings
            await validate_reference(pool, table, ref_id, field_name)
