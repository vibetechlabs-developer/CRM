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