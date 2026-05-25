from fastapi import HTTPException, status

from app.repositories import notification_repository as notification_repo
from app.utils.db_helpers import check_document_exists, generate_url_param_id


async def create_for_user(pool, target_user_id: str, message: str, current_user_id: str) -> dict:
    await check_document_exists(pool, "users", target_user_id, "User")
    url_param_id = generate_url_param_id()
    return await notification_repo.insert_notification(pool, target_user_id, message, current_user_id, url_param_id)


async def list_pending(pool, current_user_id: str) -> list[dict]:
    return await notification_repo.list_pending_for_user(pool, current_user_id)


async def report_status(pool, notification_id: str, target_user_id: str, new_status: str) -> dict:
    if new_status not in ("sent", "failed"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status must be 'sent' or 'failed'")
    result = await notification_repo.update_notification_status(pool, notification_id, target_user_id, new_status)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return result
