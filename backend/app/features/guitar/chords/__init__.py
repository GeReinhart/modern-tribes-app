from app.features.registry import register_feature, FeatureDefinition
from app.features.guitar.chords.router import router

register_feature(FeatureDefinition(
    feature_type="guitar_chords",
    label="Guitar - Chords",
    router=router,
))
