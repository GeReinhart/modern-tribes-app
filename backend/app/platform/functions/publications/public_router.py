from typing import List, Optional

from fastapi import APIRouter, Query

from app.platform.core.database import get_database
from app.platform.functions.labels.models import LabelInfo
from app.platform.functions.publications.models import PublicationDetail, PublicationSummary
from app.platform.functions.publications import service as publication_service
from app.platform.core.utils.db_helpers import resolve_url_param_id

router = APIRouter(prefix="/publications/public", tags=["platform_publications"])


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
    publication_id = await resolve_url_param_id(pool, "publications", publication_id)
    return await publication_service.get_publication(publication_id, pool)
