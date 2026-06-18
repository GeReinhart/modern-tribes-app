from functools import wraps
from typing import Any, Callable

from fastapi import APIRouter, Depends, HTTPException, status

from app.platform.core.database import get_database
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.models import Authorization, PermissionEnum
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
    """Check if the current user has at least one of the specified permissions.

    **Permissions:** authentication required — no specific permission
    """
    user_permissions = await _get_user_permissions_or_raise(current_user)
    required_permissions = [p.strip() for p in permissions.split(",")]

    has_permission = any(perm in user_permissions for perm in required_permissions)

    return Authorization(
        authorized=has_permission, message="" if has_permission else f"Required any of: {permissions}"
    )


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
