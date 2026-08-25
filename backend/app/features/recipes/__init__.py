from app.features.registry import register_feature, FeatureDefinition
from app.features.recipes.router import router, ingredients_router, label_router

register_feature(FeatureDefinition(
    feature_type="recipes",
    label="Recipes",
    router=router,
    extra_routers=[ingredients_router, label_router],
))
