from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.platform.functions.people.persons import repository as persons_repository
from app.features.meals import access
from app.features.meals import repository as meals_repository
from app.features.meals import service as meals_service
from app.features.meals.models import (
    MealCreate, MealUpdate, MealResponse, MealParticipantInfo,
    MealGrocerySuggestion, MealGrocerySuggestionIngredient, MealAddedToGroceriesList,
)
from app.features.tasks.models import PersonOption

router = APIRouter(prefix="/meals", tags=["features_meals"])


def _row_to_meal(row: dict) -> MealResponse:
    return MealResponse(
        id=str(row["id"]),
        feature_instance_id=str(row["feature_instance_id"]),
        title=row["title"],
        start_at=row["start_at"],
        end_at=row["end_at"],
        headcount=row["headcount"],
        document_id=str(row["document_id"]) if row.get("document_id") else None,
        document_content_html=row.get("document_content_html"),
        status=row["status"],
        participant_ids=list(row.get("participant_ids") or []),
        participants=[MealParticipantInfo(**p) for p in (row.get("participants") or [])],
        recipe_ids=list(row.get("recipe_ids") or []),
    )


async def _require_meal(pool, meal_id: str) -> dict:
    row = await meals_repository.fetch_meal(pool, meal_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found.")
    return row


@router.post("/", response_model=MealResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_meal(data: MealCreate, current_user: dict = Depends(get_current_user)):
    """Plan a new meal with a date range and a headcount.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member
    """
    pool = get_database()
    user_id = str(current_user["id"])
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    row = await meals_repository.insert_meal(
        pool, data.feature_instance_id, data.title, data.start_at, data.end_at, data.headcount, user_id,
    )
    meal_id = str(row["id"])
    if data.document_content_html:
        await meals_repository.upsert_document(pool, meal_id, data.document_content_html, user_id)
    full = await _require_meal(pool, meal_id)
    return _row_to_meal(full)


@router.get("/by-instance/{feature_instance_id}", response_model=list[MealResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_meals(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List all meals for a feature instance.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.require_feature_access(pool, feature_instance_id, current_user, "guest")
    rows = await meals_repository.fetch_meals_for_instance(pool, feature_instance_id)
    return [_row_to_meal(r) for r in rows]


@router.get("/persons/{feature_instance_id}", response_model=list[PersonOption])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_persons(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List persons available as participants for a meals feature instance.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.require_feature_access(pool, feature_instance_id, current_user, "guest")
    rows = await persons_repository.fetch_persons_for_feature(pool, feature_instance_id, str(current_user["id"]))
    return [PersonOption(id=str(r["id"]), name=r["name"]) for r in rows]


@router.get("/{meal_id}", response_model=MealResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_meal(meal_id: str, current_user: dict = Depends(get_current_user)):
    """Get a meal with its participants and linked recipes.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    row = await _require_meal(pool, meal_id)
    await access.require_feature_access(pool, str(row["feature_instance_id"]), current_user, "guest")
    return _row_to_meal(row)


@router.patch("/{meal_id}", response_model=MealResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_meal(meal_id: str, data: MealUpdate, current_user: dict = Depends(get_current_user)):
    """Update a meal's fields.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member
    """
    pool = get_database()
    user_id = str(current_user["id"])
    row = await _require_meal(pool, meal_id)
    await access.require_feature_access(pool, str(row["feature_instance_id"]), current_user, "member")

    basic: dict = {}
    if data.title is not None:
        basic["title"] = data.title
    if data.start_at is not None:
        basic["start_at"] = data.start_at
    if data.end_at is not None:
        basic["end_at"] = data.end_at
    if data.headcount is not None:
        basic["headcount"] = data.headcount
    if data.status is not None:
        basic["status"] = data.status
    await meals_repository.update_meal_basic(pool, meal_id, basic, user_id)

    if data.document_content_html is not None:
        await meals_repository.upsert_document(pool, meal_id, data.document_content_html, user_id)

    full = await _require_meal(pool, meal_id)
    return _row_to_meal(full)


@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_meal(meal_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a meal.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member
    """
    pool = get_database()
    row = await _require_meal(pool, meal_id)
    await access.require_feature_access(pool, str(row["feature_instance_id"]), current_user, "member")
    await meals_repository.delete_meal(pool, meal_id)


@router.post("/{meal_id}/participants", response_model=list[str])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def set_participants(meal_id: str, person_ids: list[str], current_user: dict = Depends(get_current_user)):
    """Replace the participant list for a meal.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member
    """
    pool = get_database()
    user_id = str(current_user["id"])
    row = await _require_meal(pool, meal_id)
    await access.require_feature_access(pool, str(row["feature_instance_id"]), current_user, "member")
    await meals_repository.set_participants(pool, meal_id, person_ids, user_id)
    return person_ids


@router.post("/{meal_id}/recipes/{recipe_id}", response_model=list[str])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def toggle_recipe(meal_id: str, recipe_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle a recipe on a meal — link it if not linked yet, unlink it otherwise.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member
    """
    pool = get_database()
    row = await _require_meal(pool, meal_id)
    await access.require_feature_access(pool, str(row["feature_instance_id"]), current_user, "member")
    return await meals_repository.toggle_recipe(pool, meal_id, recipe_id)


@router.get("/grocery-suggestions/{groceries_list_id}", response_model=list[MealGrocerySuggestion])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_grocery_suggestions(groceries_list_id: str, current_user: dict = Depends(get_current_user)):
    """Ingredients of meals planned after this groceries list's date, scaled to each
    meal's headcount — read-only bridge from meals into a groceries list's suggestions.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest, checked against the groceries list's project
    """
    pool = get_database()
    async with pool.acquire() as conn:
        list_row = await conn.fetchrow(
            "SELECT feature_instance_id FROM groceries_lists WHERE id = $1 AND status = 'active'",
            UUID(groceries_list_id),
        )
    if not list_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery list not found.")
    await access.require_feature_access(pool, str(list_row["feature_instance_id"]), current_user, "guest")
    groups = await meals_service.compute_grocery_suggestions(pool, groceries_list_id)
    if groups is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery list not found.")
    return [
        MealGrocerySuggestion(
            meal_id=g["meal_id"],
            meal_title=g["meal_title"],
            meal_start_at=g["meal_start_at"],
            recipe_id=g["recipe_id"],
            recipe_name=g["recipe_name"],
            headcount=g["headcount"],
            added=g["added"],
            ingredients=[MealGrocerySuggestionIngredient(**i) for i in g["ingredients"]],
        )
        for g in groups
    ]


@router.post("/grocery-suggestions/{groceries_list_id}/add/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def add_meal_to_groceries_list(
    groceries_list_id: str, meal_id: str, current_user: dict = Depends(get_current_user)
):
    """Add every ingredient of every recipe linked to this meal to the groceries list in
    one action, scaled to the meal's headcount, then mark the meal as added so it stops
    being suggested on this list.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member, checked against the groceries list's project
    """
    pool = get_database()
    async with pool.acquire() as conn:
        list_row = await conn.fetchrow(
            "SELECT feature_instance_id FROM groceries_lists WHERE id = $1 AND status = 'active'",
            UUID(groceries_list_id),
        )
    if not list_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery list not found.")
    await access.require_feature_access(pool, str(list_row["feature_instance_id"]), current_user, "member")
    items = await meals_service.add_meal_to_groceries_list(pool, groceries_list_id, meal_id, str(current_user["id"]))
    if items is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This meal cannot be added to this list.")


@router.delete("/grocery-suggestions/{groceries_list_id}/add/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def remove_meal_from_groceries_list(
    groceries_list_id: str, meal_id: str, current_user: dict = Depends(get_current_user)
):
    """Un-mark a meal as added to this groceries list, so it's suggested again. The items
    already added for it are left on the list untouched.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member, checked against the groceries list's project
    """
    pool = get_database()
    async with pool.acquire() as conn:
        list_row = await conn.fetchrow(
            "SELECT feature_instance_id FROM groceries_lists WHERE id = $1 AND status = 'active'",
            UUID(groceries_list_id),
        )
    if not list_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery list not found.")
    await access.require_feature_access(pool, str(list_row["feature_instance_id"]), current_user, "member")
    removed = await meals_service.remove_meal_from_groceries_list(
        pool, groceries_list_id, meal_id, str(current_user["id"]),
    )
    if not removed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This meal isn't added to this list.")


@router.post(
    "/grocery-suggestions/{groceries_list_id}/add-ingredient/{meal_id}/{recipe_ingredient_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def add_ingredient_to_groceries_list(
    groceries_list_id: str, meal_id: str, recipe_ingredient_id: str, current_user: dict = Depends(get_current_user)
):
    """Add a single suggested ingredient (typically an accompaniment) to the groceries
    list, scaled to the meal's headcount — unlike the bulk "add all" action, this doesn't
    mark the whole meal as added.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member, checked against the groceries list's project
    """
    pool = get_database()
    async with pool.acquire() as conn:
        list_row = await conn.fetchrow(
            "SELECT feature_instance_id FROM groceries_lists WHERE id = $1 AND status = 'active'",
            UUID(groceries_list_id),
        )
    if not list_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery list not found.")
    await access.require_feature_access(pool, str(list_row["feature_instance_id"]), current_user, "member")
    item = await meals_service.add_ingredient_to_groceries_list(
        pool, groceries_list_id, meal_id, recipe_ingredient_id, str(current_user["id"]),
    )
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="This ingredient cannot be added to this list.",
        )


@router.get("/added-to-groceries-list/{groceries_list_id}", response_model=list[MealAddedToGroceriesList])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_meals_added_to_groceries_list(groceries_list_id: str, current_user: dict = Depends(get_current_user)):
    """List the meals already added to this groceries list, with the headcount they were
    added for — so shopping mode can show which meals this list already accounts for.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest, checked against the groceries list's project
    """
    pool = get_database()
    async with pool.acquire() as conn:
        list_row = await conn.fetchrow(
            "SELECT feature_instance_id FROM groceries_lists WHERE id = $1 AND status = 'active'",
            UUID(groceries_list_id),
        )
    if not list_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery list not found.")
    await access.require_feature_access(pool, str(list_row["feature_instance_id"]), current_user, "guest")
    rows = await meals_repository.fetch_added_meals_detail(pool, groceries_list_id)
    return [
        MealAddedToGroceriesList(
            meal_id=str(r["meal_id"]), meal_title=r["meal_title"], meal_start_at=r["meal_start_at"],
            headcount=r["headcount"], recipe_names=list(r.get("recipe_names") or []),
        )
        for r in rows
    ]
