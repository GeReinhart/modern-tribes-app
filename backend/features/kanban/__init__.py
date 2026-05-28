from features.registry import register_feature, FeatureDefinition
from features.kanban.router import router

register_feature(FeatureDefinition(
    feature_type="kanban",
    label="Kanban",
    router=router,
))
