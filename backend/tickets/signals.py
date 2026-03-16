from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Ticket, TicketActivity
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
        if not instance.assigned_agent:
            auto_assign_ticket(instance)



# -----------------------------------------
# PRE SAVE SIGNAL
# Runs BEFORE ticket is saved
# Used for detecting status changes
# -----------------------------------------

@receiver(pre_save, sender=Ticket)
def track_ticket_status_change(sender, instance, **kwargs):

    # If ticket already exists in database
    if instance.pk:

        try:
            old_ticket = Ticket.objects.get(pk=instance.pk)
        except Ticket.DoesNotExist:
            return

        # Check if status changed
        if old_ticket.status != instance.status:

            TicketActivity.objects.create(
                ticket=instance,
                message=f"Status changed from {old_ticket.status} to {instance.status}."
            )