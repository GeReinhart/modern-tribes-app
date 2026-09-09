from datetime import date
from fastapi import APIRouter, Depends, Response

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.features.meals import access
from app.features.meals.pdf import service as pdf_service

router = APIRouter(prefix="/meals", tags=["features_meals_pdf"])


@router.get("/pdf/{feature_instance_id}")
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def download_meals_pdf(
    feature_instance_id: str, start_date: date, end_date: date, current_user: dict = Depends(get_current_user),
):
    """Download the planned meals for a date range as a printable PDF: a day x slot table on
    the first page, then a card per linked recipe on the following pages.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.require_feature_access(pool, feature_instance_id, current_user, "guest")
    pdf_bytes = await pdf_service.build_meals_pdf(pool, feature_instance_id, start_date, end_date)
    filename = f"meals-{start_date.isoformat()}-to-{end_date.isoformat()}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
