from functools import wraps
from typing import Any, Callable

from fastapi import APIRouter, Depends, HTTPException, status

from app.platform.core.database import get_database
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.models import Authorization, PermissionEnum
from app.platform.core.authorization.ownership import check_own_tribe_position_or_admin
from app.platform.core.authorization.permissions import get_user_permissions

router = APIRouter(prefix="/authorization", tags=["platform_core"])


# ============ HELPER FUNCTION ============
async def _get_user_permissions_or_raise(current_user: dict) -> list[str]:
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    pool = get_database()
    user_id = str(current_user.get("id"))
    return await get_user_permissions(pool, user_id)


# ============ ENDPOINT ============
@router.get("/permissions/any/{permissions}", response_model=Authorization)
async def current_user_has_at_least_one_permission(
    permissions: str, current_user: dict = Depends(get_current_user)
):
    """Check if current user has at least one of the specified permissions"""
    user_permissions = await _get_user_permissions_or_raise(current_user)
    required_permissions = [p.strip() for p in permissions.split(",")]

    has_permission = any(perm in user_permissions for perm in required_permissions)

    return Authorization(
        authorized=has_permission, message="" if has_permission else f"Required any of: {permissions}"
    )


async def _check_permissions(permissions: str, current_user: dict) -> tuple[bool, str]:
    user_permissions = await _get_user_permissions_or_raise(current_user)
    required_permissions = [p.strip() for p in permissions.split(",")] + [PermissionEnum.ADMIN.value]

    has_permission = any(perm in user_permissions for perm in required_permissions)

    if not has_permission:
        return False, f"Required any of: {permissions}"

    return True, ""


async def _authorize_tribe_access(
    tribe_id: str, current_user: dict, position: str | None = None
) -> Authorization:
    try:
        pool = get_database()
        await check_own_tribe_position_or_admin(tribe_id, current_user, pool, required_position=position)
        return Authorization(authorized=True, message="")
    except HTTPException as e:
        return Authorization(authorized=False, message=e.detail)


@router.get("/permissions/any/{permissions}/own/tribe/{tribe_id}", response_model=Authorization)
async def check_permission_and_tribe(
    permissions: str, tribe_id: str, current_user: dict = Depends(get_current_user)
):
    """Check if user has permission and owns tribe"""
    authorized, message = await _check_permissions(permissions, current_user)
    if not authorized:
        return Authorization(authorized=False, message=message)

    return await _authorize_tribe_access(tribe_id, current_user)


@router.get(
    "/permissions/any/{permissions}/own/tribe/{tribe_id}/position/{position}",
    response_model=Authorization,
)
async def check_permission_and_tribe_and_position(
    permissions: str, tribe_id: str, position: str, current_user: dict = Depends(get_current_user)
):
    """Check if user has permission, owns tribe, and has position"""
    authorized, message = await _check_permissions(permissions, current_user)
    if not authorized:
        return Authorization(authorized=False, message=message)

    return await _authorize_tribe_access(tribe_id, current_user, position)


# ============ DECORATORS ============
def require_permission_decorator(permission: str):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, current_user: dict = None, **kwargs: Any) -> Any:
            user_permissions = await _get_user_permissions_or_raise(current_user)

            if permission not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail=f"Permission required: {permission}"
                )

            return await func(*args, current_user=current_user, **kwargs)

        return wrapper

    return decorator


def require_any_permission_decorator(*permissions: str):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, current_user: dict = None, **kwargs: Any) -> Any:
            user_permissions = await _get_user_permissions_or_raise(current_user)

            has_permission = any(perm in user_permissions for perm in permissions)

            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail=f"Required any of: {', '.join(permissions)}"
                )

            return await func(*args, current_user=current_user, **kwargs)

        return wrapper

    return decorator


def require_all_permissions_decorator(*permissions: str):
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, current_user: dict = None, **kwargs: Any) -> Any:
            user_permissions = await _get_user_permissions_or_raise(current_user)

            print(f"check all permissions {list(permissions)} for user {current_user.get('email')}")
            print(f"user has permissions: {user_permissions}")

            has_permission = all(perm in user_permissions for perm in permissions)

            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Required permissions: {', '.join(permissions)}",
                )

            return await func(*args, current_user=current_user, **kwargs)

        return wrapper

    return decorator
