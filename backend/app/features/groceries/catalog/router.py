from fastapi import APIRouter, Depends, HTTPException, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.features.groceries import access
from app.features.groceries.catalog import repository as catalog_repository
from app.features.groceries.catalog.models import (
    GroceriesItemCreate, GroceriesItemRenewalUpdate, GroceriesItemResponse, GroceriesItemSuggestedQuantityUpdate,
    GroceriesItemUpdate, GroceriesSectionCreate, GroceriesSectionResponse, GroceriesSectionsReorderRequest,
    GroceriesSectionUpdate,
)

items_router = APIRouter(prefix="/groceries-items", tags=["features_groceries_catalog"])
sections_router = APIRouter(prefix="/groceries-sections", tags=["features_groceries_catalog"])


def _row_to_item(row: dict) -> GroceriesItemResponse:
    return GroceriesItemResponse(
        id=str(row["id"]),
        name=row["name"],
        description=row["description"],
        unit=row["unit"],
        icon=row.get("icon"),
        is_divisible=row.get("is_divisible", True),
        status=row["status"],
        section_ids=list(row.get("section_ids") or []),
        renewal_duration_days=row.get("renewal_duration_days"),
        suggested_quantity=(
            float(row["suggested_quantity"]) if row.get("suggested_quantity") is not None else None
        ),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _row_to_section(row: dict) -> GroceriesSectionResponse:
    return GroceriesSectionResponse(
        id=str(row["id"]),
        name=row["name"],
        icon=row.get("icon"),
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@items_router.get("/", response_model=list[GroceriesItemResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_groceries_items(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List the shared groceries catalog items.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ guest
    """
    pool = get_database()
    await access.require_feature_access(pool, feature_instance_id, current_user, "guest")
    rows = await catalog_repository.fetch_items(pool, feature_instance_id)
    return [_row_to_item(r) for r in rows]


@items_router.post("/", response_model=GroceriesItemResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_groceries_item(data: GroceriesItemCreate, current_user: dict = Depends(get_current_user)):
    """Add a new item to the shared groceries catalog.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    row = await catalog_repository.insert_item(
        pool, data.name, data.description, data.unit, data.icon, data.is_divisible, str(current_user["id"]),
    )
    return _row_to_item(row)


@items_router.patch("/{item_id}", response_model=GroceriesItemResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_groceries_item(item_id: str, data: GroceriesItemUpdate, current_user: dict = Depends(get_current_user)):
    """Update a catalog item's name, description, unit, icon, divisibility and/or archive it.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    item = await catalog_repository.fetch_item(pool, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")
    await catalog_repository.update_item(
        pool, item_id, data.name, data.description, data.unit, data.icon, data.is_divisible, data.status,
        str(current_user["id"]),
    )
    row = await catalog_repository.fetch_item_with_sections(pool, item_id, data.feature_instance_id)
    return _row_to_item(row)


@items_router.put("/{item_id}/renewal", response_model=GroceriesItemResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def set_groceries_item_renewal(
    item_id: str, data: GroceriesItemRenewalUpdate, current_user: dict = Depends(get_current_user)
):
    """Opt an item into (or out of) restock-suggestion tracking for this feature instance.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    item = await catalog_repository.fetch_item(pool, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")
    await catalog_repository.upsert_instance_item_renewal(
        pool, data.feature_instance_id, item_id, data.renewal_duration_days, str(current_user["id"]),
    )
    row = await catalog_repository.fetch_item_with_sections(pool, item_id, data.feature_instance_id)
    return _row_to_item(row)


@items_router.put("/{item_id}/suggested-quantity", response_model=GroceriesItemResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def set_groceries_item_suggested_quantity(
    item_id: str, data: GroceriesItemSuggestedQuantityUpdate, current_user: dict = Depends(get_current_user)
):
    """Set (or clear) the quantity pre-filled when this item is added to a list, for this
    feature instance.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    item = await catalog_repository.fetch_item(pool, item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")
    await catalog_repository.upsert_instance_item_suggested_quantity(
        pool, data.feature_instance_id, item_id, data.suggested_quantity, str(current_user["id"]),
    )
    row = await catalog_repository.fetch_item_with_sections(pool, item_id, data.feature_instance_id)
    return _row_to_item(row)


@items_router.post("/{item_id}/sections/{section_id}", response_model=list[str])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def toggle_groceries_item_section(
    item_id: str, section_id: str, feature_instance_id: str, current_user: dict = Depends(get_current_user)
):
    """Toggle a section on a catalog item (add if absent, remove if present).

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, feature_instance_id, current_user, "member")
    return await catalog_repository.toggle_item_section(pool, item_id, section_id)


@sections_router.get("/", response_model=list[GroceriesSectionResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_groceries_sections(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List the shared groceries catalog sections.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ guest
    """
    pool = get_database()
    await access.require_feature_access(pool, feature_instance_id, current_user, "guest")
    rows = await catalog_repository.fetch_sections(pool)
    return [_row_to_section(r) for r in rows]


@sections_router.post("/", response_model=GroceriesSectionResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_groceries_section(data: GroceriesSectionCreate, current_user: dict = Depends(get_current_user)):
    """Add a new section to the shared groceries catalog.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    row = await catalog_repository.insert_section(pool, data.name, data.icon, str(current_user["id"]))
    return _row_to_section(row)


@sections_router.put("/reorder", response_model=list[GroceriesSectionResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def reorder_groceries_sections(
    data: GroceriesSectionsReorderRequest, current_user: dict = Depends(get_current_user)
):
    """Reorder the shared groceries catalog sections.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    rows = await catalog_repository.reorder_sections(pool, data.ordered_ids, str(current_user["id"]))
    return [_row_to_section(r) for r in rows]


@sections_router.patch("/{section_id}", response_model=GroceriesSectionResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_groceries_section(
    section_id: str, data: GroceriesSectionUpdate, current_user: dict = Depends(get_current_user)
):
    """Rename a groceries catalog section.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    section = await catalog_repository.fetch_section(pool, section_id)
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found.")
    row = await catalog_repository.update_section(pool, section_id, data.name, data.icon, str(current_user["id"]))
    return _row_to_section(row)


@sections_router.delete("/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_groceries_section(
    section_id: str, feature_instance_id: str, current_user: dict = Depends(get_current_user)
):
    """Delete a groceries catalog section, if no item is assigned to it.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position ≥ member
    """
    pool = get_database()
    await access.require_feature_access(pool, feature_instance_id, current_user, "member")
    section = await catalog_repository.fetch_section(pool, section_id)
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found.")
    item_count = await catalog_repository.count_section_items(pool, section_id)
    if item_count > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Section is not empty.")
    await catalog_repository.delete_section(pool, section_id)
