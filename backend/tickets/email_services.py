import logging
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)

def send_ticket_completion_email(ticket):
    """
    Sends an email to the client when a ticket is marked as COMPLETED.
    """
    if not ticket.client or not ticket.client.email:
        return

    subject = f"Your Request (Ticket #{ticket.ticket_no}) has been Completed"
    message = (
        f"Dear {ticket.client.first_name},\n\n"
        f"We are pleased to inform you that your request (Ticket #{ticket.ticket_no}) has been successfully completed.\n\n"
        f"If you have any further questions or concerns, please do not hesitate to contact us.\n\n"
        f"Best regards,\n"
        f"Your CRM Team"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.EMAIL_HOST_USER, # Will fallback to default if not set
            recipient_list=[ticket.client.email],
            fail_silently=False,
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
