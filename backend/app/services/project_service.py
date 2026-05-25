from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status

from app.models.app.project_with_document import (
    AttachmentFile,
    ProjectTribeMemberResponse,
    ProjectTribeWithMembersResponse,
    ProjectWithDocumentCreate,
    ProjectWithDocumentResponse,
    ProjectWithDocumentUpdate,
)
from app.repositories import tribe_repository as tribe_repo
from app.utils.attachments_helpers import (
    create_document_with_attachments,
    get_document_with_attachments,
    update_document_attachments,
)
from app.utils.db_helpers import generate_url_param_id, row_to_dict
from app.utils.document_helpers import update_document_content_with_revision


async def get_project_with_document(project_id: str, pool) -> ProjectWithDocumentResponse:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM projects WHERE id = $1", UUID(project_id))
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project = row_to_dict(row)
    return await _build_response(project, pool)


async def create_project_with_document(
    data: ProjectWithDocumentCreate, pool, current_user: dict
) -> ProjectWithDocumentResponse:
    now = datetime.now(timezone.utc)
    uid = UUID(current_user["id"])

    # Verify tribe exists
    async with pool.acquire() as conn:
        tribe = await conn.fetchrow("SELECT id FROM tribes WHERE id = $1", UUID(data.tribe_id))
    if not tribe:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tribe not found")

    document = await create_document_with_attachments(
        pool, data.document_content_html, data.document_attachments, current_user["id"]
    )

    async with pool.acquire() as conn:
        project_row = await conn.fetchrow(
            """INSERT INTO projects (url_param_id, name, document_id, status, created_at, updated_at, created_by, updated_by)
               VALUES ($1, $2, $3, 'active', $4, $4, $5, $5)
               RETURNING *""",
            generate_url_param_id(),
            data.name,
            UUID(str(document["id"])),
            now,
            uid,
        )
        await conn.execute(
            """INSERT INTO tribes_projects (tribe_id, project_id, relation)
               VALUES ($1, $2, 'manager')
               ON CONFLICT (tribe_id, project_id) DO NOTHING""",
            UUID(data.tribe_id),
            project_row["id"],
        )

    return await _build_response(row_to_dict(project_row), pool)


async def update_project_with_document(
    project_id: str, data: ProjectWithDocumentUpdate, pool, current_user: dict
) -> ProjectWithDocumentResponse:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM projects WHERE id = $1", UUID(project_id))
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    project = row_to_dict(row)
    now = datetime.now(timezone.utc)
    uid = UUID(current_user["id"])

    if data.name is not None:
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE projects SET name = $1, updated_at = $2, updated_by = $3 WHERE id = $4",
                data.name,
                now,
                uid,
                UUID(project_id),
            )

    document_id = project.get("document_id")
    has_document_changes = data.document_content_html is not None or data.document_attachments is not None

    if not document_id and has_document_changes:
        document = await create_document_with_attachments(
            pool, data.document_content_html or "", data.document_attachments or [], current_user["id"]
        )
        async with pool.acquire() as conn:
            await conn.execute(
                "UPDATE projects SET document_id = $1, updated_at = $2, updated_by = $3 WHERE id = $4",
                UUID(str(document["id"])),
                now,
                uid,
                UUID(project_id),
            )
    elif document_id:
        if data.document_content_html is not None:
            await update_document_content_with_revision(
                pool, str(document_id), data.document_content_html, current_user["id"]
            )
        if data.document_attachments is not None:
            await update_document_attachments(
                pool, str(document_id), data.document_attachments, current_user["id"]
            )

    return await get_project_with_document(project_id, pool)


async def _build_response(project: dict, pool) -> ProjectWithDocumentResponse:
    document_id = project.get("document_id")
    document = None
    if document_id:
        try:
            document = await get_document_with_attachments(pool, str(document_id))
        except Exception:
            pass

    attachments = [
        AttachmentFile(**att) if isinstance(att, dict) else att
        for att in (document.get("attachments", []) if document else [])
    ]

    return ProjectWithDocumentResponse(
        id=str(project["id"]),
        url_param_id=project["url_param_id"],
        name=project["name"],
        document_id=str(document_id) if document_id else None,
        document_content_html=document.get("content_html", "") if document else "",
        document_attachments=attachments,
        status=project.get("status", "active"),
        created_at=project["created_at"],
        updated_at=project["updated_at"],
    )


async def get_project_tribes_with_members(
    project_id: str, pool
) -> list[ProjectTribeWithMembersResponse]:
    rows = await tribe_repo.get_tribes_with_members_for_project(pool, project_id)
    tribes: dict[str, ProjectTribeWithMembersResponse] = {}
    for row in rows:
        tid = str(row["tribe_id"])
        if tid not in tribes:
            tribes[tid] = ProjectTribeWithMembersResponse(
                tribe_id=tid,
                tribe_url_param_id=row["tribe_url_param_id"],
                tribe_name=row["tribe_name"],
                members=[],
            )
        tribes[tid].members.append(
            ProjectTribeMemberResponse(
                person_id=str(row["person_id"]),
                first_name=row["first_name"],
                last_name=row["last_name"],
                position=row["position"],
            )
        )
    return list(tribes.values())
