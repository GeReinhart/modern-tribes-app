from app.features.registry import register_feature, FeatureDefinition
from app.features.events.router import router, label_router

register_feature(FeatureDefinition(
    feature_type="events",
    label="Events",
    router=router,
    extra_routers=[label_router],
))
