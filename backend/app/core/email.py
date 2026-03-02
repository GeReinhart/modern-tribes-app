from typing import List
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from .config import settings

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

fm = FastMail(conf)

async def send_magic_link(email: str, magic_link: str):
    """Send magic link email"""
    html = f"""
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

    message = MessageSchema(
        subject=f"Sign in to {settings.APP_NAME}",
        recipients=[email],
        body=html,
        subtype="html"
    )

    await fm.send_message(message)
