# Authentication 

## For Non-Technical Users

### What is Authentication?

Think of our authentication system like a secure building with a special entry process:

#### Step 1: Magic Link (Your Digital Key Request)

- You enter your email address (like ringing the doorbell)
- We send you a **magic link** via email (like a temporary access code sent to your phone)
- This link is unique, works only once, and expires in a few minutes
- Click the link to prove you own that email address

#### Step 2: Access Token (Your Building Badge)

- Once verified, we give you an **access token** (like a visitor badge)
- This badge lets you access different rooms (features) in our application
- You don't need to log in again for every action—just show your badge
- The badge expires after a certain time for security

#### Step 3: Sessions (Your Visit Record)

- We keep track of which devices you're using (phone, laptop, tablet)
- Each device gets its own "visit record"
- We only keep your 5 most recent visits for security
- You can see all active sessions and revoke them if needed

### Why is this Secure?

1. **No Password to Steal**: We never store passwords that hackers could steal
2. **Email Ownership Proof**: Only you can click the link sent to your inbox
3. **Time Limits**: Links and tokens expire, so old ones become useless
4. **Device Tracking**: We know what devices you're using and can alert you to suspicious activity
5. **One-Time Use**: Magic links can only be used once

---

## For Technical Users

### Authentication Flow Architecture

Our system implements a **passwordless authentication** mechanism using **magic links** combined with **JWT-based
session management**.

#### 1. Magic Link Generation & Verification

**Magic Token** is a short-lived JWT used for email verification:

User Request → Magic Token (JWT) → Email Delivery → Token Verification → Access Token

**Structure:**

```python
magic_token = jwt.encode({
    "email": user_email,
    "exp": datetime.utcnow() + timedelta(minutes=15),  # Short expiration
    "iat": datetime.utcnow(),
    "type": "magic_link"
}, SECRET_KEY, algorithm="HS256")
```

Purpose: One-time use token to prove email ownership

Lifespan: 15 minutes (configurable)

Storage: Not stored server-side; stateless verification

Transmission: URL parameter via email

#### 2. Access Token Generation

Once the magic link is verified, an Access Token (JWT) is issued:

```python
access_token = jwt.encode({
    "sub": user_id,  # Subject (user identifier)
    "email": user_email,
    "session_id": unique_session_id,  # Ties to specific device/session
    "roles": ["user", "admin"],  # Authorization roles
    "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    "iat": datetime.utcnow()
}, SECRET_KEY, algorithm="HS256")
```

Purpose: Authentication & authorization for API requests

Lifespan: 60 minutes to several hours (configurable)

Storage: Client-side (localStorage/sessionStorage)

Transmission: HTTP Authorization header (Bearer <token>)

#### 3. Session Management

Each access token is linked to a session stored in the database:

```python

UserSession
{
    session_id: str,  # Unique session identifier
    user_agent: str,  # Browser/device fingerprint
    ip_address: str,  # Connection origin
    created_at: datetime,  # Session creation time
    last_activity: datetime,  # Last API request timestamp
    expires_at: datetime  # Session expiration
}
```

Session Lifecycle:

- Created on magic link verification
- Updated on each authenticated request (last_activity)
- Validated on every API call
- Automatically cleaned (max 5 sessions per user)
- Can be manually revoked

### Security Mechanisms

#### 1. Cryptographic Signing (JWT)

How it works:

Header.Payload.Signature

    Header: Algorithm & token type
    Payload: Claims (user data)
    Signature: HMAC-SHA256(Header + Payload, SECRET_KEY)

Security:

    Tokens cannot be tampered with without knowing SECRET_KEY
    Any modification invalidates the signature
    Server verifies signature on every request

### 2. Token Expiration

Defense against:

    Token theft/interception
    Long-term unauthorized access

Implementation:

```python

# Magic Link: 15 minutes
exp = datetime.utcnow() + timedelta(minutes=15)

# Access Token: 1 hour (configurable)
exp = datetime.utcnow() + timedelta(minutes=60)
```

Security benefit: Even if stolen, tokens become useless after expiration

### 3. Email-Based Identity Verification

Why secure:

- Requires access to user's email account (second factor)
- Email providers have their own security (2FA, spam filters)
- One-time use prevents replay attacks

Attack mitigation:

- Magic token is invalidated after verification
- No server-side storage = no token database to breach

### 4. Session Binding & Tracking

Session fingerprinting:

```python

session = {
    "user_agent": request.headers.get("user-agent"),  # Browser fingerprint
    "ip_address": request.client.host,  # Network location
    "session_id": generate_session_id()  # Unique identifier
}
```

Security features:

- Detect suspicious logins from new devices/locations
- User can view and revoke active sessions
- Limit to 5 concurrent sessions (prevent account sharing abuse)
- Session ID embedded in access token (binding)

### 5. Stateful Session Validation

Unlike pure JWT (stateless), we validate against database:

```python

# 1. Verify JWT signature & expiration (stateless)
payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

# 2. Verify session exists in database (stateful)
session = db.find_session(payload["session_id"])

# 3. Check session expiration
if session["expires_at"] < datetime.utcnow():
    raise Unauthorized()
```

Security benefit:

- Immediate revocation capability
- Logout actually invalidates tokens
- Detect deleted/inactive users

### 6. Defense Against Common Attacks

| Attack Type         | 	Defense Mechanism                                   |
|---------------------|------------------------------------------------------|
| Token Replay        | 	One-time use magic links, session binding           |
| Token Theft         | 	Short expiration, HTTPS-only transmission           |
| Brute Force         | 	No password to brute force                          |
| Phishing            | 	Domain verification in magic link                   |
| Session Fixation    | 	Cryptographically random session IDs                |
| Account Enumeration | 	Same response for existing/non-existing emails      |
| XSS                 | 	HTTPOnly cookies (if implemented), token validation |
| CSRF                | 	Token-based auth (not cookie-based)                 | 

Implementation Best Practices

#### 1. Secret Key Management

```python

# .env file (never commit to version control)

SECRET_KEY = < cryptographically - random - string - at - least - 32 - characters >

# Generate securely:

# python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 2. Token Transmission

```http
# Client sends token in Authorization header
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Why not cookies?

- Better for API/mobile clients
- Explicit control over storage
- No CSRF vulnerabilities
- Easier cross-domain usage (CORS)

#### 3. HTTPS Enforcement

```python

# Always use HTTPS in production
if not request.url.scheme == "https" and settings.ENV == "production":
    raise SecurityError("HTTPS required")
```

#### 4. Rate Limiting

```python

# Prevent magic link spam

@router.post("/auth/magic-link")
@limiter.limit("5/minute")  # Max 5 requests per minute
async def request_magic_link(request: MagicLinkRequest):


    ...
```

### Token Lifecycle Diagram

```

┌─────────────┐
│ Client      │
└──────┬──────┘
       │
       │ 1. POST /auth/magic-link (email)
       ▼
┌─────────────┐         ┌──────────────┐
│ Server      │────────>│ Email        │
│             │ Magic   │ Service      │
│ Creates JWT │ Link    └──────────────┘
└──────┬──────┘              │
       │                     │ 2. Email delivered
       │                     ▼
       │                 ┌─────────────┐
       │                 │ User        │
       │                 │ Inbox       │
       │                 └──────┬──────┘
       │                        │
       │                        │  3. POST /auth/verify (magic_token)
       │<───────────────────────┘
       │
       │ 4. Verify magic_token
       │    Create session in DB
       │    Generate access_token
       │
       │ 5. Return access_token
       ▼
┌─────────────┐
│ Client      │
│ Stores      │
│ access_token│
└──────┬──────┘
       │
       │ 6. API requests with Authorization: Bearer <token>
       ▼
 ┌─────────────┐
 │ Server      │
 │             │
 │ • Verify JWT signature
 │ • Check expiration
 │ • Validate session in DB
 │ • Update last_activity
 └─────────────┘
```

### Configuration Reference

```python

# settings.py

class Settings:


# Secret key for JWT signing (keep secure!)
SECRET_KEY: str = os.getenv("SECRET_KEY")

# Token expiration times
MAGIC_LINK_EXPIRE_MINUTES: int = 15
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

# Session management
MAX_SESSIONS_PER_USER: int = 5

# Frontend URL for magic link generation
FRONTEND_URL: str = "https://yourdomain.com"

# Email configuration
SMTP_HOST: str = os.getenv("SMTP_HOST")
SMTP_PORT: int = 587
EMAIL_FROM: str = "noreply@yourdomain.com"
```

### API Endpoints Summary

| Endpoint            | Method | Purpose                               | Auth Required |
|---------------------|--------|---------------------------------------|---------------|
| /auth/magic-link    | POST   | Request magic link                    | No            |
| /auth/verify        | POST   | Verify magic token & get access token | No            |
| /auth/me            | GET    | Get current user info                 | Yes           |
| /auth/logout        | POST   | Invalidate current session            | Yes           |
| /auth/sessions      | GET    | List active sessions                  | Yes           |
| /auth/sessions/{id} | DELETE | Revoke specific session               | Yes           |            

## Conclusion

This authentication system provides enterprise-grade security without the complexity and risks of password management,
while maintaining excellent user experience through passwordless login.

Key Benefits

- No passwords to remember or manage
- Cryptographically secure tokens
- Multi-device session management
- Automatic security cleanup
- Protection against common attacks
- Email-based identity verification

Security Checklist

-  Generate strong SECRET_KEY (32+ characters)
-  Enable HTTPS in production
-  Configure email service (SMTP/SendGrid/etc.)
-  Set appropriate token expiration times
-  Implement rate limiting on auth endpoints
-  Monitor suspicious login patterns
-  Regular security audits
-  Keep dependencies updated

