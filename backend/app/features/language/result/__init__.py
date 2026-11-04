from app.features.registry import register_feature, FeatureDefinition
from app.features.language.result.router import router

register_feature(FeatureDefinition(
    feature_type="language_result",
    label="Language - Result",
    router=router,
))
