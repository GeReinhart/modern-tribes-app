from app.features.registry import register_feature, FeatureDefinition
from app.features.tasks.todo_list.router import router, label_router

register_feature(FeatureDefinition(
    feature_type="todo_list",
    label="Todo List",
    router=router,
    extra_routers=[label_router],
))
