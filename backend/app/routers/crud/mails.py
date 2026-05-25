from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.database import get_database
from app.models.auth.auth import PermissionEnum
from app.models.crud.mails import Mail, MailCreate, MailTo, MailToCreate, MailUpdate
from app.routers.auth.authorization import (
    get_current_user,
    require_permission_decorator,
)
from app.utils.db_helpers import (
    check_document_exists,
    create_document,
    delete_document,
    get_all_documents,
    get_document_by_id,
    update_document,
)

router = APIRouter(prefix="/mails", tags=["crud_mails"])

MAIL_TABLE = "mails"
MAIL_TO_TABLE = "mails_to"


@router.get("/", response_model=List[Mail])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_all_mails(current_user: dict = Depends(get_current_user)):
    pool = get_database()
    return await get_all_documents(pool, MAIL_TABLE, any_status=True)


@router.get("/{mail_id}", response_model=Mail)
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_mail(mail_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    return await get_document_by_id(pool, MAIL_TABLE, mail_id, "Mail")


@router.post("/", response_model=Mail, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def create_mail(mail: MailCreate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    data = mail.model_dump()
    data["created_by"] = UUID(current_user["id"])
    data["updated_by"] = UUID(current_user["id"])
    return await create_document(pool, MAIL_TABLE, data)


@router.put("/{mail_id}", response_model=Mail)
@require_permission_decorator(PermissionEnum.ADMIN)
async def update_mail(mail_id: str, mail: MailUpdate, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await check_document_exists(pool, MAIL_TABLE, mail_id, "Mail")
    data = mail.model_dump(exclude_unset=True)
    data["updated_by"] = UUID(current_user["id"])
    return await update_document(pool, MAIL_TABLE, mail_id, data, "Mail")


@router.delete("/{mail_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def delete_mail(mail_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await delete_document(pool, MAIL_TABLE, mail_id, "Mail")
    return None


# --- mails_to sub-resource ---


@router.get("/{mail_id}/recipients", response_model=List[MailTo])
@require_permission_decorator(PermissionEnum.ADMIN)
async def get_mail_recipients(mail_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    return await get_all_documents(pool, MAIL_TO_TABLE, filter_query="mail_id = $1", params=[UUID(mail_id)])


@router.post("/{mail_id}/recipients", response_model=MailTo, status_code=status.HTTP_201_CREATED)
@require_permission_decorator(PermissionEnum.ADMIN)
async def add_mail_recipient(
    mail_id: str, recipient: MailToCreate, current_user: dict = Depends(get_current_user)
):
    pool = get_database()
    await check_document_exists(pool, MAIL_TABLE, mail_id, "Mail")
    data = recipient.model_dump()
    data["mail_id"] = UUID(mail_id)
    data["user_id"] = UUID(recipient.user_id)
    return await create_document(pool, MAIL_TO_TABLE, data)


@router.delete("/{mail_id}/recipients/{mail_to_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_permission_decorator(PermissionEnum.ADMIN)
async def remove_mail_recipient(
    mail_id: str, mail_to_id: str, current_user: dict = Depends(get_current_user)
):
    pool = get_database()
    await delete_document(pool, MAIL_TO_TABLE, mail_to_id, "MailTo")
    return None
