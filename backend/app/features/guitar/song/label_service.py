from fastapi import HTTPException, status

from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.platform.functions.labels import repository as labels_repo
from app.features.guitar.song.song_lookup import require_song_project
from app.features.guitar.song.label_models import GuitarSongLabel, GuitarSongLabelCreate, GuitarSongLabelUpdate

ENTITY_TYPE = "guitar_song"


def _to_label(row: dict) -> GuitarSongLabel:
    return GuitarSongLabel(id=row["id"], name=row["name"], color=row["color"], position=row["position"])


async def list_project_labels(pool, project_id: str, user: dict) -> list[GuitarSongLabel]:
    await check_project_access_or_admin(project_id, user, pool, min_position="guest")
    rows = await labels_repo.fetch_labels_for_project(pool, project_id)
    return [_to_label(r) for r in rows]


async def create_project_label(pool, project_id: str, data: GuitarSongLabelCreate, user: dict) -> GuitarSongLabel:
    await check_project_access_or_admin(project_id, user, pool, min_position="manager")
    row = await labels_repo.insert_project_label(pool, project_id, data.name, data.color, str(user["id"]))
    return _to_label(row)


async def _require_label(pool, label_id: str) -> dict:
    label = await labels_repo.fetch_label_by_id(pool, label_id)
    if not label or not label.get("project_id"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found.")
    return label


async def update_project_label(pool, label_id: str, data: GuitarSongLabelUpdate, user: dict) -> GuitarSongLabel:
    label = await _require_label(pool, label_id)
    await check_project_access_or_admin(str(label["project_id"]), user, pool, min_position="manager")
    updated = await labels_repo.update_feature_label(pool, label_id, data.name, data.color, str(user["id"]))
    return _to_label(updated)


async def delete_project_label(pool, label_id: str, user: dict) -> None:
    label = await _require_label(pool, label_id)
    await check_project_access_or_admin(str(label["project_id"]), user, pool, min_position="manager")
    await labels_repo.delete_feature_label(pool, label_id)


async def add_label_to_song(pool, song_id: str, label_id: str, user: dict) -> None:
    project_id = await require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    await labels_repo.add_entity_label(pool, song_id, ENTITY_TYPE, label_id)


async def remove_label_from_song(pool, song_id: str, label_id: str, user: dict) -> None:
    project_id = await require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    await labels_repo.remove_entity_label(pool, song_id, ENTITY_TYPE, label_id)
