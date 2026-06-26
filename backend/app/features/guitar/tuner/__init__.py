from app.features.registry import register_feature, FeatureDefinition
from app.features.guitar.tuner.router import router

register_feature(FeatureDefinition(
    feature_type="guitar_tuner",
    label="Guitar - Tuner",
    router=router,
))
