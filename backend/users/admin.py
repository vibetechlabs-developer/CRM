from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("CRM Info", {"fields": ("role", "preferred_insurance_types")}),  
    )

    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "role",
        "preferred_insurance_types",
        "is_staff",
        'assigned_ticket_types'
    )

    list_filter = DjangoUserAdmin.list_filter + ("role", "preferred_insurance_types")  
