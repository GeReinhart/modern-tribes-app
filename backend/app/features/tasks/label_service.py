from app.platform.functions.people.persons import repository as persons_repository
from app.platform.functions.labels.service import (
    require_feature_access,
    list_feature_labels,
    create_feature_label,
    update_feature_label,
    delete_feature_label,
    reorder_feature_labels,
)
from app.features.tasks.models import PersonOption


async def list_persons_for_feature(pool, feature_instance_id: str, user: dict) -> list[PersonOption]:
    await require_feature_access(pool, feature_instance_id, user, "guest")
    rows = await persons_repository.fetch_persons_for_feature(pool, feature_instance_id, str(user["id"]))
    return [PersonOption(id=str(r["id"]), name=r["name"]) for r in rows]
