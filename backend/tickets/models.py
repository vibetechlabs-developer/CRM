from django.db import IntegrityError, models, router, transaction
from clients.models import Client
from policies.models import Policy
from users.models import User


class Ticket(models.Model):

    TICKET_TYPES = [
        ("NEW", "New Policy"),
        ("RENEWAL", "Renewal"),
        ("CHANGES", "Changes"),
        ("CANCELLATION", "Cancellation"),
    ]

    STATUS_CHOICES = [
        ("LEAD", "Lead/Inquiry"),
        ("RENEWAL", "Renewal"),
        ("FOLLOW_UP", "Follow Up"),
        ("CHANGES", "Changes"),
        ("COMPLETED", "Completed"),
        ("DISCARDED", "Discarded Leads"),
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

    details = models.JSONField(default=dict, blank=True)
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
        """
        Generate `ticket_no` safely under concurrency.
        Also trigger WhatsApp notifications on creation and completion.
        """
        is_new = self.pk is None
        old_status = None
        if not is_new:
            try:
                old_status = Ticket.objects.get(pk=self.pk).status
            except Ticket.DoesNotExist:
                pass

        if not self.ticket_no and is_new:
            prefix = "INS-"
            width = 5
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT nextval('ticket_no_seq')")
                next_number = cursor.fetchone()[0]
            self.ticket_no = f"{prefix}{next_number:0{width}d}"

        result = super().save(*args, **kwargs)

        # Handle Notifications safely (no blocking crash)
        self._trigger_whatsapp_notifications(is_new, old_status)
        return result

    def _trigger_whatsapp_notifications(self, is_new, old_status):
        import logging
        from whatsapp.services import send_whatsapp_message
        
        logger = logging.getLogger(__name__)
        
        # We only send if the client has a phone number
        if not getattr(self, "client", None) or not self.client.phone:
            return

        try:
            if is_new:
                msg = f"Hello {self.client.first_name},\n\nWe have received your request. Your ticket number is *{self.ticket_no}* ({self.get_ticket_type_display()}).\nWe will get back to you shortly."
                send_whatsapp_message(self.client.phone, msg)
            elif old_status and old_status != self.status and self.status == "COMPLETED":
                msg = f"Hello {self.client.first_name},\n\nYour ticket *{self.ticket_no}* has been marked as COMPLETED. If you have any further questions, please let us know."
                send_whatsapp_message(self.client.phone, msg)
        except Exception as e:
            logger.error(f"Failed to send WhatsApp notification for ticket {self.ticket_no}: {e}")

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


class Notification(models.Model):
    """
    Simple in-app notification store (polled by frontend).
    Used to provide "real-time" updates without websockets initially.
    """

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_notifications",
    )
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification to {self.user_id}"