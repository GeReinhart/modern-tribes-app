from ..registry import register_feature, FeatureDefinition
from .router import router

register_feature(FeatureDefinition(
    feature_type="todo_list",
    label="Todo List",
    router=router,
))
