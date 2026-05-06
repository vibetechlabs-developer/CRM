import logging
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

logger = logging.getLogger(__name__)

def _policy_lines(ticket) -> list[str]:
    """
    Returns human-friendly policy details lines (if a policy is linked).
    """
    policy = getattr(ticket, "policy", None)
    if not policy:
        return []

    lines: list[str] = []
    if getattr(policy, "policy_number", None):
        lines.append(f"Policy number: {policy.policy_number}")
    if getattr(policy, "provider", None):
        lines.append(f"Provider: {policy.provider}")
    if getattr(policy, "insurance_type", None):
        try:
            insurance_type_display = policy.get_insurance_type_display()
        except Exception:
            insurance_type_display = str(policy.insurance_type)
        lines.append(f"Insurance type: {insurance_type_display}")
    return lines

def _get_brand_context() -> dict:
    brand_name = getattr(settings, "BRAND_NAME", "Feril Kapadia Insurance Broker")
    frontend_url = (getattr(settings, "FRONTEND_URL", "") or "").strip().rstrip("/")
    if frontend_url and not frontend_url.startswith(("http://", "https://")):
        frontend_url = f"https://{frontend_url}"
    configured_logo = (getattr(settings, "BRAND_LOGO_URL", "") or "").strip()
    # Keep logo consistent with CRM UI, which uses `/logo.png`.
    logo_url = configured_logo or (f"{frontend_url}/logo.png" if frontend_url else "")
    support_email = (
        getattr(settings, "DEFAULT_FROM_EMAIL", "")
        or getattr(settings, "EMAIL_HOST_USER", "")
        or "support@example.com"
    )
    return {
        "brand_name": brand_name,
        "logo_url": logo_url,
        "frontend_url": frontend_url,
        "support_email": support_email,
    }

def _send_branded_email(
    *,
    to_email: str,
    subject: str,
    greeting_name: str,
    heading: str,
    paragraphs: list[str],
    cta_label: str | None = None,
    cta_url: str | None = None,
) -> None:
    if not to_email:
        return

    ctx = _get_brand_context()
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "") or getattr(settings, "EMAIL_HOST_USER", "")
    logo_html = (
        f'<img src="{ctx["logo_url"]}" alt="{ctx["brand_name"]}" style="max-height:52px; margin-bottom:16px;" />'
        if ctx["logo_url"]
        else ""
    )
    paragraph_html = "".join(
        f'<p style="margin:0 0 12px; color:#111827; line-height:1.6;">{p}</p>' for p in paragraphs
    )
    cta_html = ""
    if cta_label and cta_url:
        cta_html = (
            f'<p style="margin:18px 0 20px;">'
            f'<a href="{cta_url}" style="background:#111827; color:#ffffff; text-decoration:none; '
            f'padding:10px 16px; border-radius:8px; display:inline-block;">{cta_label}</a>'
            f"</p>"
        )

    html_body = f"""
    <html>
      <body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="620" cellspacing="0" cellpadding="0"
                     style="background:#ffffff; border-radius:12px; padding:28px; border:1px solid #e5e7eb;">
                <tr>
                  <td>
                    {logo_html}
                    <h2 style="margin:0 0 14px; color:#111827; font-size:22px;">{heading}</h2>
                    <p style="margin:0 0 12px; color:#111827; line-height:1.6;">Dear {greeting_name},</p>
                    {paragraph_html}
                    {cta_html}
                    <p style="margin:16px 0 0; color:#111827; line-height:1.6;">Best regards,<br />{ctx["brand_name"]}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0; color:#6b7280; font-size:12px;">
                Need help? Contact us at {ctx["support_email"]}.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """.strip()

    text_body = "\n".join(
        [
            f"Dear {greeting_name},",
            "",
            *paragraphs,
            "",
            f"Best regards,",
            ctx["brand_name"],
        ]
    )

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=from_email,
        to=[to_email],
    )
    message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)

def send_ticket_created_email(ticket):
    """
    Sends an email to the client when a new ticket is created.
    """
    if not ticket.client or not ticket.client.email:
        return

    request_type_display = ticket.get_ticket_type_display()
    is_cancellation = getattr(ticket, "ticket_type", "") == "CANCELLATION"
    subject = (
        f"Cancellation Request Received (Ticket #{ticket.ticket_no})"
        if is_cancellation
        else f"Your Request (Ticket #{ticket.ticket_no}) has been Received"
    )
    paragraphs = [
        f"We have received your request successfully. Your ticket number is {ticket.ticket_no}.",
        f"Request type: {request_type_display}",
    ]
    paragraphs.extend(_policy_lines(ticket))
    paragraphs.append(
        "Our team will review your cancellation request and contact you if any additional information is required."
        if is_cancellation
        else "Our team will review it and get back to you shortly."
    )

    try:
        _send_branded_email(
            to_email=ticket.client.email,
            subject=subject,
            greeting_name=ticket.client.first_name,
            heading="Cancellation Request Received" if is_cancellation else "Request Received",
            paragraphs=paragraphs,
            cta_label=None,
            cta_url=None,
        )
        logger.info(f"Created-ticket email sent for Ticket {ticket.ticket_no} to {ticket.client.email}")
    except Exception as e:
        logger.error(f"Failed to send created-ticket email for Ticket {ticket.ticket_no}: {e}")

def send_ticket_completion_email(ticket):
    """
    Sends an email to the client when a ticket is marked as COMPLETED.
    """
    if not ticket.client or not ticket.client.email:
        return

    request_type_display = ticket.get_ticket_type_display()
    subject = f"Request Completed (Ticket #{ticket.ticket_no})"
    paragraphs = [
        f"We are pleased to inform you that your request (Ticket #{ticket.ticket_no}) has been successfully completed.",
        f"Request type: {request_type_display}",
    ]
    paragraphs.extend(_policy_lines(ticket))
    paragraphs.append("If you have any further questions or concerns, please do not hesitate to contact us.")

    try:
        _send_branded_email(
            to_email=ticket.client.email,
            subject=subject,
            greeting_name=ticket.client.first_name,
            heading="Request Completed",
            paragraphs=paragraphs,
            cta_label=None,
            cta_url=None,
        )
        logger.info(f"Completion email sent for Ticket {ticket.ticket_no} to {ticket.client.email}")
    except Exception as e:
        logger.error(f"Failed to send completion email for Ticket {ticket.ticket_no}: {e}")

def send_follow_up_email(ticket):
    """
    Sends a follow-up reminder email to the client.
    """
    if not ticket.client or not ticket.client.email:
        return

    subject = f"Follow-up Reminder for Ticket #{ticket.ticket_no}"
    message = (
        f"Dear {ticket.client.first_name},\n\n"
        f"This is a gentle reminder regarding your pending request (Ticket #{ticket.ticket_no}).\n"
        f"Please let us know if you need any assistance or if you have any pending documents to submit.\n\n"
        f"Best regards,\n"
        f"Your CRM Team"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[ticket.client.email],
            fail_silently=False,
        )
        logger.info(f"Follow-up email sent for Ticket {ticket.ticket_no} to {ticket.client.email}")
    except Exception as e:
        logger.error(f"Failed to send follow-up email for Ticket {ticket.ticket_no}: {e}")

def send_issue_resolution_update_email(ticket, update_message):
    """
    Sends an email to the client when an issue/activity is logged.
    """
    if not ticket.client or not ticket.client.email:
        return

    subject = f"Update on Your Request (Ticket #{ticket.ticket_no})"
    message = (
        f"Dear {ticket.client.first_name},\n\n"
        f"An update has been provided regarding your request (Ticket #{ticket.ticket_no}):\n\n"
        f"\"{update_message}\"\n\n"
        f"Best regards,\n"
        f"Your CRM Team"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[ticket.client.email],
            fail_silently=False,
        )
        logger.info(f"Issue resolution update email sent for Ticket {ticket.ticket_no} to {ticket.client.email}")
    except Exception as e:
        logger.error(f"Failed to send issue resolution update email for Ticket {ticket.ticket_no}: {e}")
