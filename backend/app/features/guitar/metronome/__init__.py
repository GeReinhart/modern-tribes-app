from app.features.registry import register_feature, FeatureDefinition
from app.features.guitar.metronome.router import router

register_feature(FeatureDefinition(
    feature_type="guitar_metronome",
    label="Guitar - Metronome",
    router=router,
))
