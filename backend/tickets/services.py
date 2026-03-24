from django.db.models import Count, Q, Max, F
from users.models import User
from .models import Ticket, TicketActivity, Notification


def auto_assign_ticket(ticket):
    """
    Automatically assign a ticket to the best available agent
    based on insurance type, ticket type, and workload.
    Uses a fallback mechanism to ensure assignment if agents exist.
    """

    # Helper function to get agents with workload annotation
    def get_agents_with_workload(base_filter):
        return (
            User.objects.filter(base_filter)
            .annotate(
                active_ticket_count=Count(
                    "assigned_tickets",
                    filter=Q(
                        assigned_tickets__status__in=[
                            "LEAD",
                            "RENEWAL",
                            "FOLLOW_UP",
                            "CHANGES"
                        ]
                    )
                ),
                last_assigned=Max("assigned_tickets__created_at")
            )
            .order_by("active_ticket_count", F("last_assigned").asc(nulls_first=True))
        )

    best_agent = None

    # Strategy 1: Match insurance type AND ticket type preferences
    agents = get_agents_with_workload(
        Q(role="AGENT") &
        Q(preferred_insurance_types__icontains=ticket.insurance_type) &
        (
            Q(assigned_ticket_types__icontains=ticket.ticket_type) |
            Q(assigned_ticket_types__isnull=True) |
            Q(assigned_ticket_types="")
        )
    )
    best_agent = agents.first()

    # Strategy 2: Fallback - Match insurance type only (ignore ticket type)
    if not best_agent:
        agents = get_agents_with_workload(
            Q(role="AGENT") &
            Q(preferred_insurance_types__icontains=ticket.insurance_type)
        )
        best_agent = agents.first()

    # Strategy 3: Fallback - Match ticket type only (ignore insurance type)
    if not best_agent:
        agents = get_agents_with_workload(
            Q(role="AGENT") &
            (
                Q(assigned_ticket_types__icontains=ticket.ticket_type) |
                Q(assigned_ticket_types__isnull=True) |
                Q(assigned_ticket_types="")
            )
        )
        best_agent = agents.first()

    # Strategy 4: Fallback - Any available agent (least workload)
    if not best_agent:
        agents = get_agents_with_workload(Q(role="AGENT"))
        best_agent = agents.first()

    # Assign if agent found
    if best_agent:
        old_assigned_to_id = ticket.assigned_to_id
        ticket.assigned_to = best_agent
        ticket.save(update_fields=["assigned_to"])

        # Log assignment activity (system-triggered; no user attribution here)
        if old_assigned_to_id != best_agent.id:
            TicketActivity.objects.create(
                ticket=ticket,
                message=f"Ticket auto-assigned to {best_agent.username}.",
            )

            # Notify admins of assignment
            admin_ids = list(User.objects.filter(role="ADMIN").values_list("id", flat=True))
            Notification.objects.bulk_create(
                [
                    Notification(
                        user_id=admin_id,
                        ticket=ticket,
                        message=f"Ticket {ticket.ticket_no} assigned to {best_agent.username}.",
                    )
                    for admin_id in admin_ids
                ]
            )

    return ticket