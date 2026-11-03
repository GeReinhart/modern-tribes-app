from app.features.registry import register_feature, FeatureDefinition
from app.features.language.test.router import router

register_feature(FeatureDefinition(
    feature_type="language_test",
    label="Language - Test",
    router=router,
))
