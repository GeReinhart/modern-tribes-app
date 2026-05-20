from fastapi import APIRouter, Query
from typing import List, Optional

from ...models.app.publication import PublicationSummary, PublicationDetail
from ...models.app.project_document import LabelInfo
from ...core.database import get_database
from ...services import publication_service

router = APIRouter(prefix="/public/publications", tags=["public_publications"])


@router.get("/labels", response_model=List[LabelInfo])
async def list_publication_labels():
    pool = get_database()
    return await publication_service.list_publication_labels(pool)


@router.get("/", response_model=List[PublicationSummary])
async def list_publications(
    q: Optional[str] = Query(None),
    label_id: Optional[str] = Query(None),
):
    pool = get_database()
    return await publication_service.list_publications(pool, q, label_id)


@router.get("/{publication_id}", response_model=PublicationDetail)
async def get_publication(publication_id: str):
    pool = get_database()
    return await publication_service.get_publication(publication_id, pool)
