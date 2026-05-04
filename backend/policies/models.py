from django.db import models
from clients.models import Client


class Policy(models.Model):

    INSURANCE_TYPES = [
        ("HOME", "Home Insurance"),
        ("AUTO", "Auto Insurance"),
        ("LIFE", "Life Insurance"),
        ("BUSINESS", "Business Insurance"),
    ]

    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("EXPIRED", "Expired"),
        ("CANCELLED", "Cancelled"),
    ]

    policy_number = models.CharField(max_length=50, unique=True)

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="policies"
    )

    provider = models.CharField(max_length=150)

    insurance_type = models.CharField(
        max_length=20,
        choices=INSURANCE_TYPES
    )

    start_date = models.DateField()
    end_date = models.DateField()

    premium_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ACTIVE"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.policy_number


class PolicyRenewalReminderLog(models.Model):
    """
    Idempotency log for renewal reminders so scheduled jobs can be re-run safely.
    """

    CHANNEL_CHOICES = [
        ("WHATSAPP", "WhatsApp"),
        ("EMAIL", "Email"),
    ]

    policy = models.ForeignKey(Policy, on_delete=models.CASCADE, related_name="renewal_reminder_logs")
    days_before = models.PositiveSmallIntegerField()
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["policy", "days_before", "channel"], name="uniq_policy_reminder_channel"),
        ]