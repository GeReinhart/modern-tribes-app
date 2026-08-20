from fastapi import APIRouter, Depends, HTTPException, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.features.groceries import access
from app.features.groceries.catalog import repository as catalog_repository
from app.features.groceries.lists import repository as lists_repository
from app.features.groceries.lists.models import (
    GroceriesListCreate, GroceriesListResponse, GroceriesListItemCreate, GroceriesListItemUpdate,
    GroceriesListItemResponse, GroceriesListDetailResponse, GroceriesListItemDetail, GroceriesSuggestionResponse,
)

lists_router = APIRouter(prefix="/groceries-lists", tags=["features_groceries_lists"])
list_items_router = APIRouter(prefix="/groceries-list-items", tags=["features_groceries_lists"])


def _row_to_list(row: dict) -> GroceriesListResponse:
    return GroceriesListResponse(
        id=str(row["id"]),
        feature_instance_id=str(row["feature_instance_id"]),
        name=row.get("name"),
        scheduled_date=row["scheduled_date"],
        list_status=row["list_status"],
        assigned_person_id=str(row["assigned_person_id"]) if row.get("assigned_person_id") else None,
        force_on_dashboard=row["force_on_dashboard"],
        status=row["status"],
    )


def _row_to_list_item(row: dict) -> GroceriesListItemResponse:
    return GroceriesListItemResponse(
        id=str(row["id"]),
        groceries_list_id=str(row["groceries_list_id"]),
        groceries_item_id=str(row["groceries_item_id"]),
        quantity=float(row["quantity"]),
        picked_up=row["picked_up"],
        status=row["status"],
    )


async def _require_list(pool, list_id: str) -> dict:
    row = await lists_repository.fetch_list(pool, list_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery list not found.")
    return row


@lists_router.post("/", response_model=GroceriesListResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_groceries_list(data: GroceriesListCreate, current_user: dict = Depends(get_current_user)):
    """Create a new grocery list, scheduled to a date.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    row = await lists_repository.insert_list(
        pool, data.feature_instance_id, data.name, data.scheduled_date,
        data.assigned_person_id, data.force_on_dashboard, str(current_user["id"]),
    )
    return _row_to_list(row)


@lists_router.get("/by-instance/{feature_instance_id}/suggestions", response_model=list[GroceriesSuggestionResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_suggested_items(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List catalog items due for restocking in this feature instance.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ guest
    """
    pool = get_database()
    await access.require_feature_access(pool, feature_instance_id, current_user, "guest")
    rows = await lists_repository.fetch_suggestions(pool, feature_instance_id)
    return [
        GroceriesSuggestionResponse(
            groceries_item_id=str(r["groceries_item_id"]),
            name=r["name"],
            unit=r["unit"],
            renewal_duration_days=r["renewal_duration_days"],
        )
        for r in rows
    ]


@lists_router.get("/{list_id}", response_model=GroceriesListDetailResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_groceries_list(list_id: str, current_user: dict = Depends(get_current_user)):
    """Get a grocery list with every item and its picked-up state.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ guest
    """
    pool = get_database()
    row = await _require_list(pool, list_id)
    await access.require_feature_access(pool, str(row["feature_instance_id"]), current_user, "guest")
    items = await lists_repository.fetch_list_items_detail(pool, list_id)
    return GroceriesListDetailResponse(
        **_row_to_list(row).model_dump(),
        items=[
            GroceriesListItemDetail(
                id=str(i["id"]),
                groceries_item_id=str(i["groceries_item_id"]),
                name=i["name"],
                unit=i["unit"],
                quantity=float(i["quantity"]),
                picked_up=i["picked_up"],
            )
            for i in items
        ],
    )


@lists_router.post("/{list_id}/items", response_model=GroceriesListItemResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def add_list_item(list_id: str, data: GroceriesListItemCreate, current_user: dict = Depends(get_current_user)):
    """Add a catalog item with a quantity to a grocery list.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    list_row = await _require_list(pool, list_id)
    await access.require_feature_access(pool, str(list_row["feature_instance_id"]), current_user, "member")
    item = await catalog_repository.fetch_item(pool, data.groceries_item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery item not found.")
    row = await lists_repository.insert_list_item(
        pool, list_id, data.groceries_item_id, data.quantity, str(current_user["id"]),
    )
    return _row_to_list_item(row)


@list_items_router.patch("/{list_item_id}", response_model=GroceriesListItemResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_list_item(
    list_item_id: str, data: GroceriesListItemUpdate, current_user: dict = Depends(get_current_user)
):
    """Update a grocery list item's quantity, or check it off as picked up.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    item_row = await lists_repository.fetch_list_item(pool, list_item_id)
    if not item_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery list item not found.")
    list_row = await _require_list(pool, str(item_row["groceries_list_id"]))
    await access.require_feature_access(pool, str(list_row["feature_instance_id"]), current_user, "member")
    row = await lists_repository.update_list_item(
        pool, list_item_id, data.quantity, data.picked_up, str(current_user["id"]),
    )
    return _row_to_list_item(row)
