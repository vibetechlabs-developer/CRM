from django.db import IntegrityError, models, router, transaction
from django.utils import timezone
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
    renewal_date = models.DateField(null=True, blank=True)




    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Request-scoped escape hatch used by APIs/serializers to allow controlled
    # reopen from COMPLETED. It is not a DB field.
    _allow_completed_reopen = False

    def save(self, *args, **kwargs):
        """
        Generate `ticket_no` safely under concurrency.
        WhatsApp notifications are dispatched via post_save signal + transaction.on_commit
        so they never block the DB transaction (see tickets/signals.py).
        """
        is_new = self.pk is None
        old_status = None
        if not is_new:
            try:
                old_status = Ticket.objects.get(pk=self.pk).status
            except Ticket.DoesNotExist:
                pass

        # Stash pre-save status so the post_save signal can compare.
        self._old_status = old_status

        # Cancellation tickets are always treated as discarded requests.
        if self.ticket_type == "CANCELLATION":
            self.status = "DISCARDED"

        # Keep completed tickets terminal unless caller explicitly allows reopen
        # (used only for ADMIN-driven updates).
        allow_completed_reopen = bool(getattr(self, "_allow_completed_reopen", False))
        if not is_new and old_status == "COMPLETED" and self.status != "COMPLETED" and not allow_completed_reopen:
            self.status = "COMPLETED"

        # Renewal tickets whose renewal date has passed should be discarded.
        if self.ticket_type == "RENEWAL" and self.renewal_date and self.renewal_date < timezone.localdate():
            self.status = "DISCARDED"

        if not self.ticket_no and is_new:
            prefix = "INS-"
            width = 5
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT nextval('ticket_no_seq')")
                next_number = cursor.fetchone()[0]
            self.ticket_no = f"{prefix}{next_number:0{width}d}"

        return super().save(*args, **kwargs)

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

class Binder(models.Model):
    binder_date = models.DateField(default=timezone.now)
    quote_person = models.CharField(max_length=150, blank=True)
    binder_person = models.CharField(max_length=150, blank=True)
    binder_created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_binders",
    )
    client_name = models.CharField(max_length=150)
    company_name = models.CharField(max_length=150, blank=True)
    task = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Binder {self.id} - {self.client_name}"
