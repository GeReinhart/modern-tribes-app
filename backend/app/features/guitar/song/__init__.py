from app.features.registry import register_feature, FeatureDefinition
from app.features.guitar.song.router import router

register_feature(FeatureDefinition(
    feature_type="guitar_song",
    label="Guitar - Song",
    router=router,
))
