from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.platform.core.config import settings
from app.platform.core.authentication import repository as auth_repo
from app.platform.core.authentication.models import RefreshResponse, TokenResponse, UserResponse
from app.platform.core.authentication.security import (
    create_access_token,
    create_refresh_token,
    generate_session_id,
    hash_refresh_token,
    verify_magic_token,
)


async def create_session_for_magic_link(
    token: str, user_agent: str | None, ip_address: str | None, pool
) -> TokenResponse:
    email = verify_magic_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired magic link")

    user = await auth_repo.get_user_by_email(pool, email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No user found with email " + email
        )

    user_id = str(user["id"])
    await auth_repo.delete_expired_sessions(pool, user_id)

    session_id = generate_session_id()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    raw_refresh_token, refresh_hash = create_refresh_token()
    refresh_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    await auth_repo.create_session(
        pool,
        user_id,
        session_id,
        user_agent,
        ip_address,
        expires_at,
        refresh_hash,
        refresh_expires_at,
    )

    roles = await auth_repo.get_user_roles(pool, user_id)
    access_token = create_access_token(
        data={"sub": user_id, "email": user["email"], "session_id": session_id, "roles": roles}
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        user=UserResponse(id=user_id, email=user["email"], roles=roles, created_at=user["created_at"]),
    )


def _unauthorized(code: str, message: str) -> HTTPException:
    """401 whose detail carries a stable machine-readable `code` next to the human message."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail={"code": code, "message": message}
    )


async def _find_session_for_refresh(raw_refresh_token: str, pool) -> dict:
    """The session owning this refresh token: either its current token, or the one it replaced
    a moment ago (grace window, for two tabs refreshing at once)."""
    token_hash = hash_refresh_token(raw_refresh_token)
    session = await auth_repo.get_session_by_refresh_token_hash(pool, token_hash)
    if session:
        return session
    previous = await auth_repo.get_session_by_previous_refresh_token_hash(pool, token_hash)
    if not previous:
        raise _unauthorized("refresh_token_unknown", "Unknown refresh token")
    grace = timedelta(seconds=settings.REFRESH_TOKEN_GRACE_SECONDS)
    rotated_at = previous.get("previous_rotated_at")
    if not rotated_at or rotated_at < datetime.now(timezone.utc) - grace:
        raise _unauthorized("refresh_token_reused", "Refresh token already used and replaced")
    return previous


def _check_refresh_not_expired(session: dict) -> None:
    expires_at = session.get("refresh_token_expires_at")
    if not expires_at or expires_at < datetime.now(timezone.utc):
        raise _unauthorized("refresh_token_expired", "Refresh token expired after a long inactivity")


async def refresh_access_token(raw_refresh_token: str, pool) -> RefreshResponse:
    session = await _find_session_for_refresh(raw_refresh_token, pool)
    _check_refresh_not_expired(session)

    user_id = str(session["user_id"])
    user = await auth_repo.get_user_by_id(pool, user_id)
    if not user:
        raise _unauthorized("user_not_found", "User not found")

    now = datetime.now(timezone.utc)
    new_raw_refresh, new_hash = create_refresh_token()
    await auth_repo.rotate_refresh_token(
        pool,
        str(session["id"]),
        new_hash,
        now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    roles = await auth_repo.get_user_roles(pool, user_id)
    new_access_token = create_access_token(
        data={"sub": user_id, "email": user["email"], "session_id": session["session_id"], "roles": roles}
    )
    return RefreshResponse(access_token=new_access_token, refresh_token=new_raw_refresh)


async def validate_session(token: str, pool) -> dict:
    from app.platform.core.authentication.security import verify_access_token

    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    session_id = payload.get("session_id")

    user = await auth_repo.get_user_by_id(pool, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    session = await auth_repo.get_session(pool, user_id, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found")

    if session["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    await auth_repo.update_session_activity(pool, user_id, session_id)
    await auth_repo.delete_expired_sessions(pool, user_id)

    return user
