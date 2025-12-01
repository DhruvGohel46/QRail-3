"""
Email sender helper for QRail backend.
Provides send_email_smtp(to_email, subject, body) which returns True on success.
Configuration via environment variables:
- SMTP_HOST
- SMTP_PORT (default 587)
- SMTP_USER
- SMTP_PASS
- SMTP_FROM (optional)

For development, if SMTP is not configured the function logs the OTP and returns False.
"""
import os
import logging
import ssl
import smtplib
from email.message import EmailMessage
import os 
logger = logging.getLogger(__name__)


def send_email_smtp(to_email: str, subject: str, body: str) -> bool:
    """Send simple email via SMTP using environment configuration.

    Returns True on success, False otherwise.
    """
    Qrail_Gmail = os.getenv("QRail Gmail")
    # Default to Gmail SMTP host; user must still provide SMTP_PASS for authentication.
    smtp_host = "smtp.gmail.com"
    smtp_port =  "587"
    smtp_user =  "qrailmanagement@gmail.com"
    smtp_pass = Qrail_Gmail
    # Use provided FROM address or fall back to the requested sending address
    smtp_from = "qrailmanagement@gmail.com"

    if not smtp_host or not smtp_user or not smtp_pass:
        logger.warning("SMTP not fully configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS env vars to enable sending.")
        # In development, we do not treat this as an exception; caller may log the OTP.
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = smtp_from
    msg["To"] = to_email
    msg.set_content(body)

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls(context=context)
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logger.info("Email sent to %s", to_email)
        return True
    except Exception as e:
        logger.exception("Failed to send email to %s: %s", to_email, e)
        return False
