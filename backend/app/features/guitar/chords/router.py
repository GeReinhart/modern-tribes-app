from typing import Optional

from fastapi import APIRouter, Depends, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.features.guitar.chords import service as chords_service
from app.features.guitar.chords.models import (
    GuitarChordCreate,
    GuitarChordResponse,
    GuitarChordUpdate,
)

router = APIRouter(prefix="/guitar-chords", tags=["features_guitar_chords"])


@router.get("/", response_model=list[GuitarChordResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_chords(
    search: Optional[str] = None,
    root_note: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """List chords in the shared inventory, optionally filtered by name search or root note.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await chords_service.list_chords(get_database(), search, root_note)


@router.post("/", response_model=GuitarChordResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_chord(data: GuitarChordCreate, current_user: dict = Depends(get_current_user)):
    """Add a chord shape to the shared inventory.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await chords_service.create_chord(get_database(), data, current_user["id"])


@router.patch("/{chord_id}", response_model=GuitarChordResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_chord(
    chord_id: str, data: GuitarChordUpdate, current_user: dict = Depends(get_current_user)
):
    """Update a chord in the shared inventory.

    **Permissions:** admin | can_access_attached_tribes
    """
    return await chords_service.update_chord(get_database(), chord_id, data, current_user["id"])


@router.delete("/{chord_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_chord(chord_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a chord from the shared inventory.

    **Permissions:** admin | can_access_attached_tribes
    """
    await chords_service.delete_chord(get_database(), chord_id, current_user["id"])
