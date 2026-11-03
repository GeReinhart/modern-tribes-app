from app.features.registry import register_feature, FeatureDefinition
from app.features.language.lesson.router import router

register_feature(FeatureDefinition(
    feature_type="language_lesson",
    label="Language - Lesson",
    router=router,
))
