import httpx
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema

from app.platform.core.config import settings


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


_MAGIC_LINK_STRINGS = {
    "en": {
        "title": "Sign in to {app_name}",
        "intro": "Click the button below to sign in to your account:",
        "button": "Sign In",
        "fallback": "Or copy and paste this link into your browser:",
        "footer": "This link will expire in {minutes} minutes.<br>If you didn't request this email, you can safely ignore it.",
    },
    "fr": {
        "title": "Connexion à {app_name}",
        "intro": "Cliquez sur le bouton ci-dessous pour vous connecter à votre compte :",
        "button": "Se connecter",
        "fallback": "Ou copiez et collez ce lien dans votre navigateur :",
        "footer": "Ce lien expirera dans {minutes} minutes.<br>Si vous n'avez pas demandé cet e-mail, vous pouvez l'ignorer.",
    },
}


def magic_link_html(magic_link: str, language: str = "en") -> str:
    s = _MAGIC_LINK_STRINGS.get(language, _MAGIC_LINK_STRINGS["en"])
    logo_url = f"{settings.FRONTEND_URL}/modern-tribes.h-logo.svg"
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; background-color: #f4f4f4; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; }}
            .header {{ text-align: center; padding: 30px 20px; border-bottom: 2px solid #f0f0f0; }}
            .logo {{ max-width: 240px; height: auto; }}
            .content {{ padding: 30px 20px; }}
            .button {{
                background-color: #FF7F50;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                display: inline-block;
                margin: 20px 0;
            }}
            .footer {{ color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f0f0f0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="{logo_url}" alt="{settings.APP_NAME}" class="logo">
            </div>
            <div class="content">
                <h2>{s["title"].format(app_name=settings.APP_NAME)}</h2>
                <p>{s["intro"]}</p>
                <a href="{magic_link}" class="button">{s["button"]}</a>
                <p>{s["fallback"]}</p>
                <p style="color: #666; word-break: break-all;">{magic_link}</p>
                <p class="footer">
                    {s["footer"].format(minutes=settings.MAGIC_LINK_EXPIRE_MINUTES)}
                </p>
            </div>
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


async def send_email(to: str, subject: str, html: str) -> None:
    if settings.MAILPACE_API_TOKEN:
        await _send_via_mailpace(to, subject, html)
    else:
        await _send_via_smtp(to, subject, html)


async def send_magic_link(email: str, magic_link: str) -> None:
    subject = f"Sign in to {settings.APP_NAME}"
    html = magic_link_html(magic_link)

    if settings.MAILPACE_API_TOKEN:
        await _send_via_mailpace(email, subject, html)
    else:
        await _send_via_smtp(email, subject, html)
