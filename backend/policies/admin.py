from django.contrib import admin
from .models import Policy


@admin.register(Policy)
class PolicyAdmin(admin.ModelAdmin):
    list_display = (
        "policy_number",
        "client",
        "insurance_type",
        "premium_amount",
        "start_date",
        "end_date",
        "status",
    )

    list_filter = ("insurance_type", "status")
    search_fields = ("policy_number", "client__first_name", "client__last_name")