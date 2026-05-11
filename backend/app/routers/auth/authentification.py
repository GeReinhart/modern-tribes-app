from fastapi import APIRouter, HTTPException, Depends, Request, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ...core.database import get_database
from ...core.email import send_magic_link
from ...core.security import create_magic_token
from ...core.config import settings
from ...models.auth.auth import MagicLinkRequest, MagicLinkResponse, TokenResponse, UserResponse, SessionResponse, RefreshRequest, RefreshResponse
from ...repositories import auth_repository as auth_repo
from ...services import auth_service
from ...utils.permissions_helper import get_user_permissions

router = APIRouter()
security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    pool = get_database()
    return await auth_service.validate_session(credentials.credentials, pool)


@router.post("/auth/magic-link", response_model=MagicLinkResponse)
async def request_magic_link(request: MagicLinkRequest):
    magic_token = create_magic_token(request.email)
    magic_link = f"{settings.FRONTEND_URL}/auth/verify?token={magic_token}"
    print("Generated a magic-link " + magic_link)
    try:
        await send_magic_link(request.email, magic_link)
        return MagicLinkResponse(message="Magic link sent to your email", email=request.email)
    except Exception as e:
        print(f"Error sending magic link: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to send email")


@router.post("/auth/verify", response_model=TokenResponse)
async def verify_magic_link(token: str, request: Request, response: Response):
    pool = get_database()
    forwarded_for = request.headers.get("X-Forwarded-For")
    ip_address = forwarded_for.split(",")[0].strip() if forwarded_for else (request.client.host if request.client else None)
    return await auth_service.create_session_for_magic_link(
        token,
        request.headers.get("user-agent"),
        ip_address,
        pool
    )


@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    pool = get_database()
    user_id = str(current_user["id"])
    permissions = await get_user_permissions(pool, user_id)
    roles = await auth_repo.get_user_roles(pool, user_id)
    return UserResponse(
        id=user_id,
        email=current_user["email"],
        roles=roles,
        permissions=permissions,
        created_at=current_user["created_at"]
    )


@router.post("/auth/refresh", response_model=RefreshResponse)
async def refresh_token(body: RefreshRequest):
    pool = get_database()
    return await auth_service.refresh_access_token(body.refresh_token, pool)


@router.post("/auth/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    from ...core.security import verify_access_token
    payload = verify_access_token(credentials.credentials)
    if payload:
        pool = get_database()
        await auth_repo.delete_session(pool, payload.get("sub"), payload.get("session_id"))
    return {"message": "Logged out successfully"}


@router.get("/auth/sessions", response_model=list[SessionResponse])
async def get_sessions(current_user: dict = Depends(get_current_user)):
    pool = get_database()
    sessions = await auth_repo.get_active_sessions(pool, str(current_user["id"]))
    return [
        SessionResponse(
            session_id=s['session_id'],
            user_agent=s['user_agent'],
            ip_address=s['ip_address'],
            expires_at=s['expires_at'],
            last_activity=s['last_activity'],
            created_at=s['created_at']
        )
        for s in sessions
    ]


@router.delete("/auth/sessions/{session_id}")
async def revoke_session(session_id: str, current_user: dict = Depends(get_current_user)):
    pool = get_database()
    await auth_repo.delete_session(pool, str(current_user["id"]), session_id)
    return {"message": "Session revoked"}
