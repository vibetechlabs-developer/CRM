from django.db import IntegrityError, models, router, transaction
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
        """
        Generate `ticket_no` safely under concurrency.

        The old implementation queried the last row and then incremented in Python,
        which can race under concurrent requests and violate `unique=True`.
        """
        if self.ticket_no:
            return super().save(*args, **kwargs)

        # Only auto-generate on initial create; leave updates unchanged.
        if self.pk:
            return super().save(*args, **kwargs)

        using = kwargs.get("using") or router.db_for_write(self.__class__, instance=self)
        prefix = "INS-"
        width = 5

        # Retry handles the "no existing rows" case where select_for_update can't lock anything yet.
        for _attempt in range(5):
            try:
                with transaction.atomic(using=using):
                    last_ticket = (
                        Ticket.objects.using(using)
                        .select_for_update()
                        .filter(ticket_no__startswith=prefix)
                        .order_by("-ticket_no")
                        .first()
                    )

                    if last_ticket and last_ticket.ticket_no:
                        try:
                            last_number = int(last_ticket.ticket_no.split("-", 1)[1])
                        except (IndexError, ValueError):
                            last_number = 0
                        next_number = last_number + 1
                    else:
                        next_number = 1

                    self.ticket_no = f"{prefix}{next_number:0{width}d}"
                    return super().save(*args, **kwargs)
            except IntegrityError:
                # Another concurrent transaction grabbed the same number first; retry.
                self.ticket_no = ""
                continue

        raise IntegrityError("Failed to generate a unique ticket number after multiple attempts.")

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
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Notification to {self.user_id}"