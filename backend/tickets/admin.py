from django.contrib import admin
from .models import Ticket, TicketActivity

from .models import Note 
class TicketActivityInline(admin.TabularInline):
    model = TicketActivity
    extra = 0


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):

    list_display = (
        "ticket_no",
        "ticket_type",
        "status",
        "priority",
        "client",
        "assigned_to",
        "source",
        "created_at",
    )

    list_filter = ("status", "priority", "ticket_type", "source")

    search_fields = (
        "ticket_no",
        "client__first_name",
        "client__last_name",
    )

    inlines = [TicketActivityInline]


@admin.register(TicketActivity)
class TicketActivityAdmin(admin.ModelAdmin):
    list_display = ("ticket", "user", "message", "created_at")


@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ("ticket", "agent", "created_at")
