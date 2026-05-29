from fastapi import HTTPException, status

from app.features.tribes_projects.tribes.app_models import (
    AttachmentFile,
    TribeProjectResponse,
    TribeWithPositionsCreate,
    TribeWithPositionsResponse,
    TribeWithPositionsUpdate,
)
from app.features.tribes_projects.tribes import repository as tribe_repo
from app.platform.functions.search import index_repository as search_index_repo
from app.platform.core.uploads.helpers import (
    create_document_with_attachments,
    get_document_with_attachments,
    update_document_attachments,
)
from app.platform.core.utils.db_helpers import check_unique_field
from app.platform.core.utils.validators import EntityValidator


async def get_tribe_with_positions(tribe_id: str, pool) -> TribeWithPositionsResponse:
    tribe = await tribe_repo.get_tribe_by_id(pool, tribe_id)
    if not tribe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tribe not found")

    document = None
    if tribe.get("document_id"):
        try:
            document = await get_document_with_attachments(pool, str(tribe["document_id"]))
        except Exception:
            pass

    positions = await tribe_repo.get_positions_by_tribe(pool, tribe_id)
    persons = await tribe_repo.get_persons_with_positions(pool, positions)
    tribe_projects = await tribe_repo.get_tribe_projects(pool, tribe_id)

    return _build_response(tribe, document, persons, tribe_projects)


async def create_tribe_with_positions(
    data: TribeWithPositionsCreate, pool, current_user: dict
) -> TribeWithPositionsResponse:
    await _validate_tribe_create(data, pool)
    document = await create_document_with_attachments(
        pool, data.document_content_html, data.document_attachments, current_user["id"]
    )
    try:
        return await _persist_tribe_create(data, document, pool, current_user["id"])
    except Exception as e:
        from app.platform.core.utils.db_helpers import delete_document as _del

        await _del(pool, "documents", str(document["id"]), "Document")
        raise e


async def archive_tribe(tribe_id: str, pool, current_user: dict) -> None:
    tribe = await tribe_repo.get_tribe_by_id(pool, tribe_id)
    if not tribe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tribe not found")
    await tribe_repo.archive_tribe(pool, tribe_id, current_user["id"])


async def update_tribe_with_positions(
    tribe_id: str, data: TribeWithPositionsUpdate, pool, current_user: dict
) -> TribeWithPositionsResponse:
    tribe = await tribe_repo.get_tribe_by_id(pool, tribe_id)
    if not tribe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tribe not found")

    await _validate_tribe_update(data, tribe, tribe_id, pool)
    await _apply_tribe_updates(tribe_id, tribe, data, pool, current_user["id"])

    return await get_tribe_with_positions(tribe_id, pool)


async def _validate_tribe_create(data: TribeWithPositionsCreate, pool) -> None:
    await check_unique_field(pool, "tribes", "name", data.name, error_message="Tribe name already exists")
    validator = EntityValidator(pool)
    person_ids = [pos.person_id for pos in data.positions]
    if person_ids:
        await validator.validate_reference_lists([{"table": "persons", "ids": person_ids, "name": "Person"}])
    if not any(pos.position == "manager" for pos in data.positions):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="At least one Manager position is required"
        )


async def _persist_tribe_create(data, document, pool, user_id: str) -> TribeWithPositionsResponse:
    tribe = await tribe_repo.create_tribe(pool, data.name, str(document["id"]), user_id)
    try:
        positions = await tribe_repo.create_positions(pool, str(tribe["id"]), data.positions, user_id)
        persons = await tribe_repo.get_persons_with_positions(pool, positions)
        await search_index_repo.index_tribe_document(pool, str(tribe["id"]), str(document["id"]), user_id)
        return _build_response(tribe, document, persons, [])
    except Exception as e:
        await tribe_repo.delete_tribe(pool, str(tribe["id"]))
        raise e


async def _validate_tribe_update(data: TribeWithPositionsUpdate, tribe: dict, tribe_id: str, pool) -> None:
    if data.name and data.name != tribe.get("name"):
        await check_unique_field(
            pool, "tribes", "name", data.name, exclude_id=tribe_id, error_message="Tribe name already exists"
        )
    if data.positions is not None:
        validator = EntityValidator(pool)
        person_ids = [pos.person_id for pos in data.positions]
        if person_ids:
            await validator.validate_reference_lists(
                [{"table": "persons", "ids": person_ids, "name": "Person"}]
            )
        if not any(pos.position == "manager" for pos in data.positions):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="At least one Manager position is required"
            )


async def _apply_tribe_updates(
    tribe_id: str, tribe: dict, data: TribeWithPositionsUpdate, pool, user_id: str
) -> None:
    await tribe_repo.touch_tribe(pool, tribe_id, user_id)

    if data.name:
        await tribe_repo.update_tribe_name(pool, tribe_id, data.name, user_id)

    document_id = tribe.get("document_id")
    has_document_changes = data.document_content_html is not None or data.document_attachments is not None

    if not document_id and has_document_changes:
        document = await create_document_with_attachments(
            pool, data.document_content_html or "", data.document_attachments or [], user_id
        )
        await tribe_repo.update_tribe_document_id(pool, tribe_id, str(document["id"]), user_id)
        await search_index_repo.index_tribe_document(pool, tribe_id, str(document["id"]), user_id)
    elif document_id:
        if data.document_content_html is not None:
            await tribe_repo.update_tribe_document_content(
                pool, str(document_id), data.document_content_html, user_id
            )
            await search_index_repo.index_tribe_document(pool, tribe_id, str(document_id), user_id)
        if data.document_attachments is not None:
            await update_document_attachments(pool, str(document_id), data.document_attachments, user_id)

    if data.positions is not None:
        current_positions = await tribe_repo.get_positions_by_tribe(pool, tribe_id)
        await tribe_repo.sync_positions(pool, tribe_id, data.positions, current_positions, user_id)


def _build_response(
    tribe: dict, document: dict | None, persons: list, tribe_projects: list
) -> TribeWithPositionsResponse:
    attachments = [
        AttachmentFile(**att) if isinstance(att, dict) else att
        for att in (document.get("attachments", []) if document else [])
    ]
    projects = [TribeProjectResponse(**p) for p in tribe_projects]
    return TribeWithPositionsResponse(
        id=str(tribe["id"]),
        url_param_id=tribe["url_param_id"],
        name=tribe["name"],
        document_id=str(document["id"]) if document else "",
        document_content_html=document.get("content_html", "") if document else "",
        document_attachments=attachments,
        projects=projects,
        persons=persons,
        created_at=tribe["created_at"],
        updated_at=tribe["updated_at"],
    )
