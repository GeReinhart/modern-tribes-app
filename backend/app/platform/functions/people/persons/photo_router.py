from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authorization.ownership import check_own_person_or_admin
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.config import settings
from app.platform.core.database import get_database
from app.platform.core.uploads.file_handler import file_handler
from app.platform.core.utils.db_helpers import check_document_exists, get_document_by_id
from app.platform.functions.people.persons import repository as person_repo
from app.platform.functions.people.persons.models import Person
from app.platform.functions.people.persons.photo import PHOTO_FOLDER, filename_from_url, square_webp

router = APIRouter(prefix="/persons", tags=["platform_people"])

_PHOTO_PERMISSIONS = (PermissionEnum.ADMIN, PermissionEnum.CAN_MANAGE_OWN_PROFILE, PermissionEnum.CAN_MANAGE_PEOPLE)


async def _discard_previous_photo(pool, person_id: str) -> None:
    previous = await person_repo.get_photo_url(pool, person_id)
    if previous:
        await file_handler.delete_file(filename_from_url(previous), PHOTO_FOLDER)


@router.put("/{person_id}/photo", response_model=Person)
@require_any_permission_decorator(*_PHOTO_PERMISSIONS)
async def set_person_photo(person_id: str, file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Set a person's photo: the image is cropped to a square and scaled down.

    **Permissions:** admin | can_manage_own_profile (own) | can_manage_people (any)
    """
    pool = get_database()
    await check_own_person_or_admin(person_id, current_user, pool)
    await check_document_exists(pool, "persons", person_id, "Person")
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    _, photo_url = await file_handler.save_bytes(square_webp(content), "webp", "image/webp", PHOTO_FOLDER)
    await _discard_previous_photo(pool, person_id)
    await person_repo.set_photo_url(pool, person_id, photo_url, current_user["id"])
    return await get_document_by_id(pool, "persons", person_id, "Person")


@router.delete("/{person_id}/photo", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(*_PHOTO_PERMISSIONS)
async def delete_person_photo(person_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a person's photo (the person goes back to initials).

    **Permissions:** admin | can_manage_own_profile (own) | can_manage_people (any)
    """
    pool = get_database()
    await check_own_person_or_admin(person_id, current_user, pool)
    await check_document_exists(pool, "persons", person_id, "Person")
    await _discard_previous_photo(pool, person_id)
    await person_repo.set_photo_url(pool, person_id, None, current_user["id"])
    return None
