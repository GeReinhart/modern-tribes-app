from ..registry import register_feature, FeatureDefinition
from .router import router, label_router

register_feature(FeatureDefinition(
    feature_type="todo_list",
    label="Todo List",
    router=router,
    extra_routers=[label_router],
))
