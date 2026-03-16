import uuid
from django.db import models


class Client(models.Model):

    client_id = models.CharField(max_length=20, unique=True)

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    email = models.EmailField()
    phone = models.CharField(max_length=15)

    address = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    last_interaction_date = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.client_id:
            self.client_id = f"CL-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)


    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return self.full_name