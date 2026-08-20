from fastapi import APIRouter, Depends, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.features.groceries import access
from app.features.groceries.catalog import repository as catalog_repository
from app.features.groceries.catalog.models import (
    GroceriesItemCreate, GroceriesItemResponse, GroceriesSectionCreate, GroceriesSectionResponse,
)

items_router = APIRouter(prefix="/groceries-items", tags=["features_groceries_catalog"])
sections_router = APIRouter(prefix="/groceries-sections", tags=["features_groceries_catalog"])


def _row_to_item(row: dict) -> GroceriesItemResponse:
    return GroceriesItemResponse(
        id=str(row["id"]),
        name=row["name"],
        description=row["description"],
        unit=row["unit"],
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _row_to_section(row: dict) -> GroceriesSectionResponse:
    return GroceriesSectionResponse(
        id=str(row["id"]),
        name=row["name"],
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@items_router.post("/", response_model=GroceriesItemResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_groceries_item(data: GroceriesItemCreate, current_user: dict = Depends(get_current_user)):
    """Add a new item to the shared groceries catalog.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    row = await catalog_repository.insert_item(pool, data.name, data.description, data.unit, str(current_user["id"]))
    return _row_to_item(row)


@sections_router.post("/", response_model=GroceriesSectionResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_groceries_section(data: GroceriesSectionCreate, current_user: dict = Depends(get_current_user)):
    """Add a new section to the shared groceries catalog.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    row = await catalog_repository.insert_section(pool, data.name, str(current_user["id"]))
    return _row_to_section(row)
