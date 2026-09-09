from app.features.registry import register_feature, FeatureDefinition
from app.features.meals.router import router
from app.features.meals.pdf.router import router as pdf_router

register_feature(FeatureDefinition(
    feature_type="meals",
    label="Meals",
    router=router,
    extra_routers=[pdf_router],
))
