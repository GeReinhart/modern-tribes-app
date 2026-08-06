from app.features.registry import register_feature, FeatureDefinition
from app.features.guitar.song.router import router
from app.features.guitar.song.sections.router import router as sections_router
from app.features.guitar.song.author.router import router as author_router
from app.features.guitar.song.video.router import router as video_router
from app.features.guitar.song.label_router import router as label_router
from app.features.guitar.song.layout.router import router as layout_router

register_feature(FeatureDefinition(
    feature_type="guitar_song",
    label="Guitar - Song",
    router=router,
    extra_routers=[sections_router, author_router, video_router, label_router, layout_router],
))
