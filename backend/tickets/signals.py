import logging
import threading

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from users.models import User
from .models import Ticket, TicketActivity, Notification
from .services import auto_assign_ticket

logger = logging.getLogger(__name__)


# -----------------------------------------
# POST SAVE SIGNAL
# Runs AFTER a ticket is saved
# Used for:
# 1) Logging ticket creation
# 2) Auto assigning agent
# 3) In-app notifications for admins
# 4) WhatsApp notifications (async, post-commit)
# -----------------------------------------

@receiver(post_save, sender=Ticket)
def handle_ticket_post_save(sender, instance, created, **kwargs):

    if created:
        # Log activity
        TicketActivity.objects.create(
            ticket=instance,
            message="Ticket created.",
        )

        # Run auto assignment if no agent assigned
        if not instance.assigned_to:
            auto_assign_ticket(instance)

        # Notify all admins
        admin_ids = list(User.objects.filter(role="ADMIN").values_list("id", flat=True))
        Notification.objects.bulk_create(
            [
                Notification(
                    user_id=admin_id,
                    ticket=instance,
                    message=f"New ticket created: {instance.ticket_no}",
                )
                for admin_id in admin_ids
            ]
        )

    # ------------------------------------------------------------------
    # WhatsApp notifications — dispatched OUTSIDE the DB transaction.
    #
    # Why: send_whatsapp_message() makes an HTTP request. If it hangs or
    # is slow it would hold the DB transaction open, exhausting the
    # connection pool. Using transaction.on_commit() guarantees the DB
    # write is fully committed before we touch the network. A daemon
    # thread then handles the call so the request/response cycle is not
    # blocked at all.
    # ------------------------------------------------------------------
    _schedule_whatsapp_notification(instance, created)


def _schedule_whatsapp_notification(instance, created):
    """
    Register a lightweight daemon thread to fire after the current DB
    transaction commits. Safe to call from any code path — if there is
    no active transaction the callback runs immediately (Django default).
    """
    # Snapshot values now; the instance may be mutated later in the
    # same request before the thread actually runs.
    old_status = getattr(instance, "_old_status", None)
    new_status = instance.status
    phone = getattr(instance.client, "phone", None) if getattr(instance, "client", None) else None
    first_name = getattr(instance.client, "first_name", "") if getattr(instance, "client", None) else ""
    ticket_no = instance.ticket_no
    ticket_type_display = instance.get_ticket_type_display()

    if not phone:
        return

    def build_message():
        if created:
            return (
                f"Hello {first_name},\n\n"
                f"We have received your request. Your ticket number is *{ticket_no}* "
                f"({ticket_type_display}).\nWe will get back to you shortly."
            )
        if old_status and old_status != new_status and new_status == "COMPLETED":
            return (
                f"Hello {first_name},\n\n"
                f"Your ticket *{ticket_no}* has been marked as COMPLETED. "
                f"If you have any further questions, please let us know."
            )
        return None

    msg = build_message()
    if not msg:
        return

    def _send():
        from whatsapp.services import send_whatsapp_message
        try:
            send_whatsapp_message(phone, msg)
        except Exception as exc:
            logger.error(
                "Failed to send WhatsApp notification for ticket %s: %s",
                ticket_no, exc,
            )

    # Schedule after commit so a failed/rolled-back save never fires a
    # notification for a ticket that doesn't exist in the DB yet.
    transaction.on_commit(
        lambda: threading.Thread(target=_send, daemon=True, name=f"wa-notify-{ticket_no}").start()
    )