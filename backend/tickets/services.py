from django.db.models import Count, Q
from users.models import User
from .models import Ticket


def auto_assign_ticket(ticket):
    """
    Automatically assign a ticket to the best available agent
    based on insurance type, ticket type, and workload.
    """

    agents = (
        User.objects.filter(
            role="AGENT",
            preferred_insurance_types__icontains=ticket.insurance_type
        )
        .filter(
            Q(assigned_ticket_types__icontains=ticket.ticket_type) |
            Q(assigned_ticket_types__isnull=True) |
            Q(assigned_ticket_types="")
        )
        .annotate(
            active_ticket_count=Count(
                "assigned_tickets",
                filter=Q(
                    assigned_tickets__status__in=[
                        "LEAD",
                        "DOCS",
                        "PROCESSING"
                    ]
                )
            )
        )
        .order_by("active_ticket_count")
    )

    best_agent = agents.first()

    if best_agent:
        ticket.assigned_to = best_agent
        ticket.save(update_fields=['assigned_to'])

    return ticket