from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):

    ROLE_CHOICES = [
        ("ADMIN", "Admin"),
        ("AGENT", "Agent"),
        ("MANAGER", "Manager"),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="AGENT"
    )

    preferred_insurance_types = models.CharField(
        max_length=255,
        blank=True,
        help_text="Comma separated values like HOME,AUTO,LIFE"
    )

    # Add this under preferred_insurance_types
    assigned_ticket_types = models.CharField(
        max_length=255,
        blank=True,
        help_text="Comma separated e.g., NEW,RENEWAL. Leave blank for ALL."
    )

    # Fine-grained UI permissions shown/edited in User Control.
    # Note: current API authorization in the app is still primarily role-based, but
    # storing these values allows Admin/Super Admin to edit them and see changes persist.
    permissions = models.JSONField(
        default=list,
        blank=True,
        help_text="List of permission labels (e.g. View Tickets, Create Tickets, ...).",
    )

    def __str__(self):
        return self.username

class AgentNote(models.Model):
    PRIORITY_CHOICES = [
        ("HIGH", "High"),
        ("MEDIUM", "Medium"),
        ("LOW", "Low"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")
    date = models.DateField()
    content = models.TextField()
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="MEDIUM")
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', '-priority']

    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.priority}"