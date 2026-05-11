from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
from jose import JWTError, jwt
import hashlib
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
    return secrets.token_urlsafe(32)

def create_refresh_token() -> Tuple[str, str]:
    """Return (raw_token, sha256_hash). Store only the hash in DB."""
    raw = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    return raw, token_hash

def hash_refresh_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()
