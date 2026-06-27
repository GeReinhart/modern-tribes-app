from app.features.registry import register_feature, FeatureDefinition
from app.features.tasks.kanban.router import router
from app.features.tasks.kanban.card_router import card_router

register_feature(FeatureDefinition(
    feature_type="kanban",
    label="Kanban",
    router=router,
    extra_routers=[card_router],
))
