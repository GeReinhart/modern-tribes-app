from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from ..core.config import settings
from ..core.security import verify_magic_token, create_access_token, generate_session_id, create_refresh_token, hash_refresh_token
from ..models.auth.auth import TokenResponse, UserResponse, RefreshResponse
from ..repositories import auth_repository as auth_repo


async def create_session_for_magic_link(token: str, user_agent: str | None, ip_address: str | None, pool) -> TokenResponse:
    email = verify_magic_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired magic link")

    user = await auth_repo.get_user_by_email(pool, email)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No user found with email " + email)

    user_id = str(user["id"])
    await auth_repo.cleanup_old_sessions(pool, user_id, max_sessions=5)

    session_id = generate_session_id()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    raw_refresh_token, refresh_hash = create_refresh_token()
    refresh_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    await auth_repo.create_session(
        pool, user_id, session_id, user_agent, ip_address, expires_at,
        refresh_hash, refresh_expires_at,
    )

    roles = await auth_repo.get_user_roles(pool, user_id)
    access_token = create_access_token(data={"sub": user_id, "email": user["email"], "session_id": session_id, "roles": roles})

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        user=UserResponse(id=user_id, email=user["email"], roles=roles, created_at=user["created_at"])
    )


async def refresh_access_token(raw_refresh_token: str, pool) -> RefreshResponse:
    token_hash = hash_refresh_token(raw_refresh_token)
    session = await auth_repo.get_session_by_refresh_token_hash(pool, token_hash)
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    if not session.get("refresh_token_expires_at") or session["refresh_token_expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")

    user_id = str(session["user_id"])
    user = await auth_repo.get_user_by_id(pool, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    new_raw_refresh, new_hash = create_refresh_token()
    new_refresh_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_session_expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    await auth_repo.rotate_refresh_token(pool, str(session["id"]), new_hash, new_refresh_expires_at, new_session_expires_at)

    roles = await auth_repo.get_user_roles(pool, user_id)
    new_access_token = create_access_token(
        data={"sub": user_id, "email": user["email"], "session_id": session["session_id"], "roles": roles}
    )

    return RefreshResponse(access_token=new_access_token, refresh_token=new_raw_refresh)


async def validate_session(token: str, pool) -> dict:
    from ..core.security import verify_access_token
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
    await auth_repo.cleanup_old_sessions(pool, user_id, max_sessions=5)

    return user
