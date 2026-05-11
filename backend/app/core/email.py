import httpx
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from .config import settings


def _smtp_client() -> FastMail:
    conf = ConnectionConfig(
        MAIL_USERNAME=settings.SMTP_USER,
        MAIL_PASSWORD=settings.SMTP_PASSWORD,
        MAIL_FROM=settings.EMAILS_FROM_EMAIL,
        MAIL_PORT=settings.SMTP_PORT,
        MAIL_SERVER=settings.SMTP_HOST,
        MAIL_STARTTLS=False,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=False,
    )
    return FastMail(conf)


def _magic_link_html(magic_link: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .button {{
                background-color: #4F46E5;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                margin: 20px 0;
            }}
            .footer {{ color: #666; font-size: 12px; margin-top: 30px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Sign in to {settings.APP_NAME}</h2>
            <p>Click the button below to sign in to your account:</p>
            <a href="{magic_link}" class="button">Sign In</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">{magic_link}</p>
            <p class="footer">
                This link will expire in {settings.MAGIC_LINK_EXPIRE_MINUTES} minutes.<br>
                If you didn't request this email, you can safely ignore it.
            </p>
        </div>
    </body>
    </html>
    """


async def _send_via_mailpace(to: str, subject: str, html: str) -> None:
    print(f"Sending email to {to} with subject {subject} by Mailpace")
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://app.mailpace.com/api/v1/send",
            headers={
                "MailPace-Server-Token": settings.MAILPACE_API_TOKEN,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={
                "from": settings.EMAILS_FROM_EMAIL,
                "to": to,
                "subject": subject,
                "htmlbody": html,
            },
            timeout=10.0,
        )
        response.raise_for_status()


async def _send_via_smtp(to: str, subject: str, html: str) -> None:
    print(f"Sending email to {to} with subject {subject} by SMTP")
    message = MessageSchema(
        subject=subject,
        recipients=[to],
        body=html,
        subtype="html",
    )
    await _smtp_client().send_message(message)


async def send_magic_link(email: str, magic_link: str) -> None:
    subject = f"Sign in to {settings.APP_NAME}"
    html = _magic_link_html(magic_link)

    if settings.MAILPACE_API_TOKEN:
        await _send_via_mailpace(email, subject, html)
    else:
        await _send_via_smtp(email, subject, html)
