from app.features.registry import register_feature, FeatureDefinition
from app.features.daily_journal.router import router
from app.features.daily_journal.label_router import label_router

register_feature(FeatureDefinition(
    feature_type="daily_journal",
    label="Daily Journal",
    router=router,
    extra_routers=[label_router],
))
