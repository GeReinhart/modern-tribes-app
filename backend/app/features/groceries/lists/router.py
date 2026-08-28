from fastapi import APIRouter, Depends, HTTPException, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.features.groceries import access
from app.features.groceries.catalog import repository as catalog_repository
from app.features.groceries.lists import repository as lists_repository
from app.features.groceries.lists.status import effective_list_status
from app.platform.functions.people.persons import repository as persons_repository
from app.features.groceries.lists.models import (
    GroceriesListCreate, GroceriesListUpdate, GroceriesListResponse, GroceriesListItemCreate,
    GroceriesListItemUpdate, GroceriesListItemResponse, GroceriesListDetailResponse, GroceriesListItemDetail,
    GroceriesSuggestionResponse, PersonOption,
)

lists_router = APIRouter(prefix="/groceries-lists", tags=["features_groceries_lists"])
list_items_router = APIRouter(prefix="/groceries-list-items", tags=["features_groceries_lists"])


def _row_to_list(row: dict) -> GroceriesListResponse:
    return GroceriesListResponse(
        id=str(row["id"]),
        feature_instance_id=str(row["feature_instance_id"]),
        name=row.get("name"),
        scheduled_date=row["scheduled_date"],
        list_status=effective_list_status(row["list_status"], row["scheduled_date"]),
        assigned_person_id=str(row["assigned_person_id"]) if row.get("assigned_person_id") else None,
        force_on_dashboard=row["force_on_dashboard"],
        is_favorite=row["is_favorite"],
        status=row["status"],
        items_count=row["items_count"],
        picked_up_count=row["picked_up_count"],
    )


def _row_to_list_item(row: dict) -> GroceriesListItemResponse:
    return GroceriesListItemResponse(
        id=str(row["id"]),
        groceries_list_id=str(row["groceries_list_id"]),
        groceries_item_id=str(row["groceries_item_id"]) if row.get("groceries_item_id") else None,
        custom_name=row.get("custom_name"),
        custom_unit=row.get("custom_unit"),
        comment=row.get("comment"),
        quantity=float(row["quantity"]),
        picked_up=row["picked_up"],
        status=row["status"],
    )


async def _require_list(pool, list_id: str) -> dict:
    row = await lists_repository.fetch_list(pool, list_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery list not found.")
    return row


def _require_divisible_quantity(is_divisible: bool, quantity: float) -> None:
    if not is_divisible and quantity != int(quantity):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="This item can only be taken in whole quantities.",
        )


@lists_router.post("/", response_model=GroceriesListResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_groceries_list(data: GroceriesListCreate, current_user: dict = Depends(get_current_user)):
    """Create a new grocery list, scheduled to a date.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    if data.copy_from_list_id:
        source_row = await _require_list(pool, data.copy_from_list_id)
        if str(source_row["feature_instance_id"]) != data.feature_instance_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery list not found.")
    row = await lists_repository.insert_list(
        pool, data.feature_instance_id, data.name, data.scheduled_date,
        data.assigned_person_id, data.force_on_dashboard, str(current_user["id"]),
    )
    if data.copy_from_list_id:
        await lists_repository.copy_list_items(pool, data.copy_from_list_id, str(row["id"]), str(current_user["id"]))
        row = await lists_repository.fetch_list(pool, str(row["id"]))
    return _row_to_list(row)


@lists_router.patch("/{list_id}", response_model=GroceriesListResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_groceries_list(
    list_id: str, data: GroceriesListUpdate, current_user: dict = Depends(get_current_user)
):
    """Rename a grocery list, reschedule its date, archive/restore it, or (un)mark it as favorite.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    list_row = await _require_list(pool, list_id)
    await access.require_feature_access(pool, str(list_row["feature_instance_id"]), current_user, "member")
    row = await lists_repository.update_list(
        pool, list_id, data.name, data.scheduled_date, data.status, data.is_favorite, str(current_user["id"]),
    )
    return _row_to_list(row)


@lists_router.get("/by-instance/{feature_instance_id}", response_model=list[GroceriesListResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_groceries_lists(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List all grocery lists for a feature instance.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ guest
    """
    pool = get_database()
    await access.require_feature_access(pool, feature_instance_id, current_user, "guest")
    rows = await lists_repository.fetch_lists_for_instance(pool, feature_instance_id)
    return [_row_to_list(r) for r in rows]


@lists_router.get("/persons/{feature_instance_id}", response_model=list[PersonOption])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_persons(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List persons available for assignment on a grocery list.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ guest
    """
    pool = get_database()
    await access.require_feature_access(pool, feature_instance_id, current_user, "guest")
    rows = await persons_repository.fetch_persons_for_feature(pool, feature_instance_id, str(current_user["id"]))
    return [PersonOption(id=str(r["id"]), name=r["name"]) for r in rows]


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
            icon=r.get("icon"),
            renewal_duration_days=r["renewal_duration_days"],
            suggested_quantity=(
                float(r["suggested_quantity"]) if r.get("suggested_quantity") is not None else None
            ),
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
                groceries_item_id=str(i["groceries_item_id"]) if i.get("groceries_item_id") else None,
                name=i["name"],
                unit=i.get("unit"),
                icon=i.get("icon"),
                is_divisible=i.get("is_divisible", True),
                comment=i.get("comment"),
                quantity=float(i["quantity"]),
                picked_up=i["picked_up"],
                section_ids=list(i.get("section_ids") or []),
            )
            for i in items
        ],
    )


@lists_router.post("/{list_id}/items", response_model=GroceriesListItemResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def add_list_item(list_id: str, data: GroceriesListItemCreate, current_user: dict = Depends(get_current_user)):
    """Add an item to a grocery list, either a catalog item or a one-off item just for this list.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    list_row = await _require_list(pool, list_id)
    await access.require_feature_access(pool, str(list_row["feature_instance_id"]), current_user, "member")
    is_divisible = False
    if data.groceries_item_id:
        item = await catalog_repository.fetch_item(pool, data.groceries_item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery item not found.")
        is_divisible = item.get("is_divisible", True)
    _require_divisible_quantity(is_divisible, data.quantity)
    row = await lists_repository.insert_list_item(
        pool, list_id, data.groceries_item_id, data.custom_name, data.custom_unit, data.quantity,
        str(current_user["id"]),
    )
    return _row_to_list_item(row)


@list_items_router.patch("/{list_item_id}", response_model=GroceriesListItemResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_list_item(
    list_item_id: str, data: GroceriesListItemUpdate, current_user: dict = Depends(get_current_user)
):
    """Update a grocery list item's quantity or comment, or check it off as picked up.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    item_row = await lists_repository.fetch_list_item(pool, list_item_id)
    if not item_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery list item not found.")
    list_row = await _require_list(pool, str(item_row["groceries_list_id"]))
    await access.require_feature_access(pool, str(list_row["feature_instance_id"]), current_user, "member")
    if data.quantity is not None:
        is_divisible = False
        if item_row.get("groceries_item_id"):
            catalog_item = await catalog_repository.fetch_item(pool, str(item_row["groceries_item_id"]))
            is_divisible = catalog_item.get("is_divisible", True)
        _require_divisible_quantity(is_divisible, data.quantity)
    row = await lists_repository.update_list_item(
        pool, list_item_id, data.quantity, data.picked_up, data.comment, str(current_user["id"]),
    )
    return _row_to_list_item(row)


@list_items_router.delete("/{list_item_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_list_item(list_item_id: str, current_user: dict = Depends(get_current_user)):
    """Remove an item from a grocery list.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    item_row = await lists_repository.fetch_list_item(pool, list_item_id)
    if not item_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery list item not found.")
    list_row = await _require_list(pool, str(item_row["groceries_list_id"]))
    await access.require_feature_access(pool, str(list_row["feature_instance_id"]), current_user, "member")
    await lists_repository.delete_list_item(pool, list_item_id)
