from app.features.registry import register_feature, FeatureDefinition
from app.features.groceries.catalog.router import items_router, sections_router
from app.features.groceries.lists.router import lists_router, list_items_router

register_feature(FeatureDefinition(
    feature_type="groceries",
    label="Groceries",
    router=items_router,
    extra_routers=[sections_router, lists_router, list_items_router],
))
