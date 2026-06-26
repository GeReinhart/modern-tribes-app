from app.features.registry import register_feature, FeatureDefinition
from app.features.guitar.notes.router import router

register_feature(FeatureDefinition(
    feature_type="guitar_notes",
    label="Guitar - Notes",
    router=router,
))
