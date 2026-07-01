from fastapi import APIRouter, Depends

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.features.daily_journal.label_service import (
    require_feature_access,
    list_feature_labels,
    create_feature_label,
    update_feature_label,
    delete_feature_label,
)
from app.features.tasks.models import FeatureLabel, FeatureLabelCreate, FeatureLabelUpdate

label_router = APIRouter(prefix="/journal-labels", tags=["features_daily_journal"])


@label_router.get("/by-instance/{feature_instance_id}", response_model=list[FeatureLabel])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_labels(feature_instance_id: str, current_user: dict = Depends(get_current_user)):
    return await list_feature_labels(get_database(), feature_instance_id, current_user)


@label_router.post("/", response_model=FeatureLabel, status_code=201)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_label(data: FeatureLabelCreate, current_user: dict = Depends(get_current_user)):
    return await create_feature_label(get_database(), data, current_user)


@label_router.patch("/{label_id}", response_model=FeatureLabel)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_label(label_id: str, data: FeatureLabelUpdate, current_user: dict = Depends(get_current_user)):
    return await update_feature_label(get_database(), label_id, data, current_user)


@label_router.delete("/{label_id}", status_code=204)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_label(label_id: str, current_user: dict = Depends(get_current_user)):
    await delete_feature_label(get_database(), label_id, current_user)
