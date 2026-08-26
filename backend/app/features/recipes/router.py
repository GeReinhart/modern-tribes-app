from fastapi import APIRouter, Depends, HTTPException, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.platform.core.database import get_database
from app.platform.core.utils.db_helpers import resolve_url_param_id
from app.platform.functions.labels import repository as labels_repo
from app.features.recipes import access
from app.features.recipes import repository as recipes_repository
from app.features.recipes.label_service import (
    list_feature_labels,
    create_feature_label,
    update_feature_label,
    delete_feature_label,
    reorder_feature_labels,
)
from app.features.tasks.models import (
    FeatureLabel, FeatureLabelCreate, FeatureLabelUpdate, FeatureLabelsReorderRequest,
)
from app.features.recipes.models import (
    RecipeCreate, RecipeUpdate, RecipeResponse, RecipeDetailResponse, RecipeIngredientDetail,
    RecipeIngredientCreate, RecipeIngredientUpdate, RecipeIngredientResponse,
)

router = APIRouter(prefix="/recipes", tags=["features_recipes"])
ingredients_router = APIRouter(prefix="/recipe-ingredients", tags=["features_recipes"])
label_router = APIRouter(prefix="/recipe-labels", tags=["features_recipes"])


def _row_to_recipe(row: dict) -> RecipeResponse:
    return RecipeResponse(
        id=str(row["id"]),
        feature_instance_id=str(row["feature_instance_id"]),
        name=row["name"],
        servings=row["servings"],
        document_id=str(row["document_id"]) if row.get("document_id") else None,
        document_content_html=row.get("document_content_html"),
        status=row["status"],
        label_ids=list(row.get("label_ids") or []),
    )


def _row_to_ingredient_detail(row: dict) -> RecipeIngredientDetail:
    return RecipeIngredientDetail(
        id=str(row["id"]),
        groceries_item_id=str(row["groceries_item_id"]) if row.get("groceries_item_id") else None,
        name=row["name"],
        unit=row.get("unit"),
        is_divisible=row.get("is_divisible", True),
        quantity=float(row["quantity"]),
    )


def _row_to_ingredient(row: dict) -> RecipeIngredientResponse:
    return RecipeIngredientResponse(
        id=str(row["id"]),
        recipe_id=str(row["recipe_id"]),
        groceries_item_id=str(row["groceries_item_id"]) if row.get("groceries_item_id") else None,
        custom_name=row.get("custom_name"),
        custom_unit=row.get("custom_unit"),
        quantity=float(row["quantity"]),
        status=row["status"],
    )


async def _require_recipe(pool, recipe_id: str) -> dict:
    row = await recipes_repository.fetch_recipe(pool, recipe_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found.")
    return row


def _require_divisible_quantity(is_divisible: bool, quantity: float) -> None:
    if not is_divisible and quantity != int(quantity):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="This item can only be taken in whole quantities.",
        )


@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_recipe(data: RecipeCreate, current_user: dict = Depends(get_current_user)):
    """Create a new recipe with its base serving count.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member
    """
    pool = get_database()
    user_id = str(current_user["id"])
    await access.require_feature_access(pool, data.feature_instance_id, current_user, "member")
    row = await recipes_repository.insert_recipe(pool, data.feature_instance_id, data.name, data.servings, user_id)
    recipe_id = str(row["id"])
    if data.document_content_html:
        await recipes_repository.upsert_document(pool, recipe_id, data.document_content_html, user_id)
    full = await _require_recipe(pool, recipe_id)
    return _row_to_recipe(full)


@router.get("/by-instance/{feature_instance_id}", response_model=list[RecipeResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_recipes(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List all recipes for a feature instance.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    await access.require_feature_access(pool, feature_instance_id, current_user, "guest")
    rows = await recipes_repository.fetch_recipes_for_instance(pool, feature_instance_id)
    return [_row_to_recipe(r) for r in rows]


@router.get("/by-project/{project_id}", response_model=list[RecipeResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_recipes_for_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """List all recipes across every Recipes tab of a project — used by other features
    (e.g. meals) to let a project-wide pick from any of the project's recipe books.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    await check_project_access_or_admin(project_id, current_user, pool, min_position="guest")
    rows = await recipes_repository.fetch_recipes_for_project(pool, project_id)
    return [_row_to_recipe(r) for r in rows]


@router.get("/{recipe_id}", response_model=RecipeDetailResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_recipe(recipe_id: str, current_user: dict = Depends(get_current_user)):
    """Get a recipe with its full ingredient list.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= guest
    """
    pool = get_database()
    row = await _require_recipe(pool, recipe_id)
    await access.require_feature_access(pool, str(row["feature_instance_id"]), current_user, "guest")
    ingredients = await recipes_repository.fetch_ingredients_detail(pool, recipe_id)
    return RecipeDetailResponse(
        **_row_to_recipe(row).model_dump(),
        ingredients=[_row_to_ingredient_detail(i) for i in ingredients],
    )


@router.patch("/{recipe_id}", response_model=RecipeResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_recipe(recipe_id: str, data: RecipeUpdate, current_user: dict = Depends(get_current_user)):
    """Update a recipe's fields.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member
    """
    pool = get_database()
    user_id = str(current_user["id"])
    row = await _require_recipe(pool, recipe_id)
    await access.require_feature_access(pool, str(row["feature_instance_id"]), current_user, "member")

    basic: dict = {}
    if data.name is not None:
        basic["name"] = data.name
    if data.servings is not None:
        basic["servings"] = data.servings
    if data.status is not None:
        basic["status"] = data.status
    await recipes_repository.update_recipe(pool, recipe_id, basic, user_id)

    if data.document_content_html is not None:
        await recipes_repository.upsert_document(pool, recipe_id, data.document_content_html, user_id)

    full = await _require_recipe(pool, recipe_id)
    return _row_to_recipe(full)


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_recipe(recipe_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a recipe.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member
    """
    pool = get_database()
    row = await _require_recipe(pool, recipe_id)
    await access.require_feature_access(pool, str(row["feature_instance_id"]), current_user, "member")
    await recipes_repository.delete_recipe(pool, recipe_id)


@router.post("/{recipe_id}/ingredients", response_model=RecipeIngredientResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def add_ingredient(recipe_id: str, data: RecipeIngredientCreate, current_user: dict = Depends(get_current_user)):
    """Add an ingredient to a recipe, either a catalog article or a one-off custom item.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member
    """
    pool = get_database()
    recipe_row = await _require_recipe(pool, recipe_id)
    await access.require_feature_access(pool, str(recipe_row["feature_instance_id"]), current_user, "member")
    is_divisible = True
    if data.groceries_item_id:
        item = await recipes_repository.fetch_catalog_item(pool, data.groceries_item_id)
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grocery item not found.")
        is_divisible = item.get("is_divisible", True)
    _require_divisible_quantity(is_divisible, data.quantity)
    row = await recipes_repository.insert_ingredient(
        pool, recipe_id, data.groceries_item_id, data.custom_name, data.custom_unit, data.quantity,
        str(current_user["id"]),
    )
    return _row_to_ingredient(row)


@ingredients_router.patch("/{ingredient_id}", response_model=RecipeIngredientResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_ingredient(
    ingredient_id: str, data: RecipeIngredientUpdate, current_user: dict = Depends(get_current_user)
):
    """Update a recipe ingredient's quantity or position.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member
    """
    pool = get_database()
    ingredient_row = await recipes_repository.fetch_ingredient(pool, ingredient_id)
    if not ingredient_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe ingredient not found.")
    recipe_row = await _require_recipe(pool, str(ingredient_row["recipe_id"]))
    await access.require_feature_access(pool, str(recipe_row["feature_instance_id"]), current_user, "member")
    if data.quantity is not None:
        is_divisible = True
        if ingredient_row.get("groceries_item_id"):
            item = await recipes_repository.fetch_catalog_item(pool, str(ingredient_row["groceries_item_id"]))
            is_divisible = item.get("is_divisible", True) if item else True
        _require_divisible_quantity(is_divisible, data.quantity)
    row = await recipes_repository.update_ingredient(pool, ingredient_id, data.quantity, data.position, str(current_user["id"]))
    return _row_to_ingredient(row)


@ingredients_router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_ingredient(ingredient_id: str, current_user: dict = Depends(get_current_user)):
    """Remove an ingredient from a recipe.

    **Permissions:** admin | can_access_attached_tribes
    **Feature access:** minimum position >= member
    """
    pool = get_database()
    ingredient_row = await recipes_repository.fetch_ingredient(pool, ingredient_id)
    if not ingredient_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe ingredient not found.")
    recipe_row = await _require_recipe(pool, str(ingredient_row["recipe_id"]))
    await access.require_feature_access(pool, str(recipe_row["feature_instance_id"]), current_user, "member")
    await recipes_repository.delete_ingredient(pool, ingredient_id)


# --- Label endpoints ---

@label_router.get("/by-instance/{feature_instance_id}", response_model=list[FeatureLabel])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_labels(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    """List labels for a recipes feature instance."""
    return await list_feature_labels(get_database(), feature_instance_id, current_user)


@label_router.post("/", response_model=FeatureLabel, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_label(data: FeatureLabelCreate, current_user: dict = Depends(get_current_user)):
    """Create a label for a recipes feature instance."""
    return await create_feature_label(get_database(), data, current_user)


@label_router.patch("/{label_id}", response_model=FeatureLabel)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_label(label_id: str, data: FeatureLabelUpdate, current_user: dict = Depends(get_current_user)):
    """Update a recipe label."""
    return await update_feature_label(get_database(), label_id, data, current_user)


@label_router.delete("/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_label(label_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a recipe label."""
    await delete_feature_label(get_database(), label_id, current_user)


@label_router.put("/reorder", response_model=list[FeatureLabel])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def reorder_labels(data: FeatureLabelsReorderRequest, current_user: dict = Depends(get_current_user)):
    """Reorder the labels of a recipes feature instance."""
    return await reorder_feature_labels(get_database(), data, current_user)


@router.post("/{recipe_id}/labels/{label_id}", response_model=list[str])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def toggle_label(recipe_id: str, label_id: str, current_user: dict = Depends(get_current_user)):
    """Toggle a label on a recipe."""
    pool = get_database()
    row = await _require_recipe(pool, recipe_id)
    await access.require_feature_access(pool, str(row["feature_instance_id"]), current_user, "member")
    return await labels_repo.toggle_entity_label(pool, recipe_id, "recipe", label_id)
