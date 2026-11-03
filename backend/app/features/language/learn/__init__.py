from app.features.registry import register_feature, FeatureDefinition
from app.features.language.learn.router import router

register_feature(FeatureDefinition(
    feature_type="language_learn",
    label="Language - Learn",
    router=router,
))
