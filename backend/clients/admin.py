from django.contrib import admin
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("client_id", "first_name", "last_name", "email", "phone", "created_at")
    search_fields = ("client_id", "first_name", "last_name", "email", "phone")
    list_filter = ("created_at",) 