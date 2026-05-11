from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
import secrets
from passlib.context import CryptContext
from .config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_magic_token(email: str) -> str:
    """Create a short-lived magic link token"""
    data = {
        "sub": email,
        "type": "magic_link",
        "exp": datetime.utcnow() + timedelta(minutes=settings.MAGIC_LINK_EXPIRE_MINUTES)
    }
    return jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_magic_token(token: str) -> Optional[str]:
    """Verify magic link token and return email"""
    try:
        print(f"Magic token received to be verified: {token[:20]}...")

        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        token_type: str = payload.get("type")

        if email is None or token_type != "magic_link":
            return None
        return email
    except JWTError as e:
        print(f"JWT Error: {e}")
        return None

def verify_access_token(token: str) -> Optional[Dict]:
    """Verify access token and return payload"""
    try:

        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        print("JWTError: "+ str(e))
        return None

def generate_session_id() -> str:
    """Generate a unique session ID"""
    return secrets.token_urlsafe(32)
