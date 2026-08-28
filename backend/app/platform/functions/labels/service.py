from uuid import UUID
from fastapi import HTTPException
from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.platform.functions.labels import repository as labels_repo
from app.platform.functions.labels.models import (
    FeatureLabel,
    FeatureLabelCreate,
    FeatureLabelUpdate,
    FeatureLabelsReorderRequest,
)


async def _get_project_id(conn, feature_instance_id: str) -> str:
    row = await conn.fetchrow(
        "SELECT project_id FROM projects_features WHERE id = $1", UUID(feature_instance_id)
    )
    if not row:
        raise HTTPException(status_code=404, detail="Feature instance not found.")
    return str(row["project_id"])


async def require_feature_access(pool, feature_instance_id: str, user: dict, min_position: str = "guest") -> str:
    async with pool.acquire() as conn:
        project_id = await _get_project_id(conn, feature_instance_id)
    await check_project_access_or_admin(project_id, user, pool, min_position=min_position)
    return project_id


def _to_label(row: dict) -> FeatureLabel:
    return FeatureLabel(id=str(row["id"]), name=row["name"], color=row["color"], position=row["position"])


async def list_feature_labels(pool, feature_instance_id: str, user: dict) -> list[FeatureLabel]:
    await require_feature_access(pool, feature_instance_id, user, "guest")
    rows = await labels_repo.fetch_labels_for_feature(pool, feature_instance_id)
    return [_to_label(r) for r in rows]


async def create_feature_label(pool, data: FeatureLabelCreate, user: dict) -> FeatureLabel:
    await require_feature_access(pool, data.feature_instance_id, user, "manager")
    row = await labels_repo.insert_feature_label(pool, data.feature_instance_id, data.name, data.color, str(user["id"]))
    return _to_label(row)


async def update_feature_label(pool, label_id: str, data: FeatureLabelUpdate, user: dict) -> FeatureLabel:
    lb = await labels_repo.fetch_label_by_id(pool, label_id)
    if not lb:
        raise HTTPException(status_code=404, detail="Label not found.")
    await require_feature_access(pool, str(lb["feature_instance_id"]), user, "manager")
    updated = await labels_repo.update_feature_label(pool, label_id, data.name, data.color, str(user["id"]), data.status)
    return _to_label(updated)


async def delete_feature_label(pool, label_id: str, user: dict) -> None:
    lb = await labels_repo.fetch_label_by_id(pool, label_id)
    if not lb:
        raise HTTPException(status_code=404, detail="Label not found.")
    await require_feature_access(pool, str(lb["feature_instance_id"]), user, "manager")
    await labels_repo.delete_feature_label(pool, label_id)


async def reorder_feature_labels(pool, data: FeatureLabelsReorderRequest, user: dict) -> list[FeatureLabel]:
    await require_feature_access(pool, data.feature_instance_id, user, "manager")
    current = await labels_repo.fetch_labels_for_feature(pool, data.feature_instance_id)
    current_ids = {r["id"] for r in current}
    if len(data.ordered_ids) != len(set(data.ordered_ids)) or set(data.ordered_ids) != current_ids:
        raise HTTPException(status_code=400, detail="ordered_ids must match the instance's active labels exactly.")
    rows = await labels_repo.reorder_feature_labels(pool, data.feature_instance_id, data.ordered_ids, str(user["id"]))
    return [_to_label(r) for r in rows]
