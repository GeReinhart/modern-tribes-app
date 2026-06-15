from app.features.registry import register_feature, FeatureDefinition
from app.features.tasks.kanban.router import router

register_feature(FeatureDefinition(
    feature_type="kanban",
    label="Kanban",
    router=router,
))
