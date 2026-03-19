from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import User
from .models import Ticket, TicketActivity, Notification
from .services import auto_assign_ticket


# -----------------------------------------
# POST SAVE SIGNAL
# Runs AFTER a ticket is saved
# Used for:
# 1) Logging ticket creation
# 2) Auto assigning agent
# -----------------------------------------

@receiver(post_save, sender=Ticket)
def handle_ticket_created(sender, instance, created, **kwargs):

    # If the ticket was just created
    if created:

        # Log activity
        TicketActivity.objects.create(
            ticket=instance,
            message="Ticket created."
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