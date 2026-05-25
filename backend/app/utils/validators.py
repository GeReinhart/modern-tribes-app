import re
from typing import Dict, List, Optional

import asyncpg
from fastapi import HTTPException

from app.utils.db_helpers import validate_reference, validate_references_list


class EntityValidator:
    """Validator for entity relationships"""

    def __init__(self, pool: asyncpg.Pool):
        self.pool = pool

    async def validate_references(
            self,
            references: List[Dict[str, Optional[str]]]
    ) -> None:
        """
        Validate multiple references at once

        Args:
            references: List of dicts with 'table', 'id', 'name' keys
        """
        for ref in references:
            await validate_reference(
                self.pool,
                ref['table'],
                ref['id'],
                ref['name']
            )

    async def validate_reference_lists(
            self,
            reference_lists: List[Dict[str, any]]
    ) -> None:
        """
        Validate multiple reference lists at once

        Args:
            reference_lists: List of dicts with 'table', 'ids', 'name' keys
        """
        for ref in reference_lists:
            await validate_references_list(
                self.pool,
                ref['table'],
                ref['ids'],
                ref['name']
            )



def validate_content(content: str) -> str:
    """Validate and sanitize content"""
    if not content or not content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")

    # Remove potentially dangerous scripts (basic sanitization)
    # In production, use a proper HTML sanitization library like bleach
    content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)

    return content


def validate_uuid_format(id: str) -> str:
    """Validate UUID format"""
    from uuid import UUID
    try:
        UUID(id)
        return id
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail="Invalid UUID format")