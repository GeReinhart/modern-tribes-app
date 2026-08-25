from app.features.registry import register_feature, FeatureDefinition
from app.features.meals.router import router

register_feature(FeatureDefinition(
    feature_type="meals",
    label="Meals",
    router=router,
))
