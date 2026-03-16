from django.db import models
from clients.models import Client
from policies.models import Policy
from users.models import User


class Ticket(models.Model):

    TICKET_TYPES = [
        ("NEW", "New Policy"),
        ("RENEWAL", "Renewal"),
        ("ADJUSTMENT", "Adjustment"),
        ("CANCELLATION", "Cancellation"),
    ]

    STATUS_CHOICES = [
        ("LEAD", "Lead"),
        ("DOCS", "Documents Pending"),
        ("PROCESSING", "Processing"),
        ("COMPLETED", "Completed"),
        ("DISCARDED", "Discarded"),
    ]

    PRIORITY_CHOICES = [
        ("LOW", "Low"),
        ("MEDIUM", "Medium"),
        ("HIGH", "High"),
    ]

    SOURCE_CHOICES = [
        ("WHATSAPP", "WhatsApp"),
        ("WEB", "Website"),
        ("MANUAL", "Manual Entry"),
    ]

    ticket_no = models.CharField(max_length=20, unique=True)

    ticket_type = models.CharField(
        max_length=20,
        choices=TICKET_TYPES
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="LEAD"
    )

    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default="MEDIUM"
    )

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="tickets"
    )

    policy = models.ForeignKey(
        Policy,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    insurance_type = models.CharField(max_length=50)

    details = models.TextField()
    additional_notes = models.TextField(blank=True)

    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tickets"
    )

    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="MANUAL"
    )


    follow_up_date = models.DateTimeField(null=True, blank=True)




    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
            if not self.ticket_no:
                last_ticket = Ticket.objects.order_by('-id').first()

                if last_ticket and last_ticket.ticket_no:
                    # Extract numeric part
                    last_number = int(last_ticket.ticket_no.split('-')[1])
                    new_number = last_number + 1
                    self.ticket_no = f"INS-{new_number:05d}"
                else:
                    self.ticket_no = "INS-00001"

            super().save(*args, **kwargs)

    def __str__(self):
        return self.ticket_no

class TicketActivity(models.Model):

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="activities"
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    message = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Activity for {self.ticket.ticket_no}"

class Note(models.Model):

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name="notes"
    )

    agent = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Note for {self.ticket.ticket_no}"