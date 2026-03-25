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

    def get_effective_ticket_type_code(ticket) -> str:
        """
        Convert backend ticket representation into UI/agent restriction buckets.

        - `CUSTOMER_ISSUE`: when `additional_notes` contains the marker added by customer-issue form
        - `ADJUSTMENT`: all non-customer-issue CHANGES tickets (and legacy ADJUSTMENT records)
        - otherwise: use the raw `ticket.ticket_type` code
        """
        notes = (getattr(ticket, "additional_notes", None) or "") or ""
        if "[Form: Customer Issue]" in notes:
            return "CUSTOMER_ISSUE"

        raw = (getattr(ticket, "ticket_type", None) or "").strip().upper()
        if raw in {"CHANGES", "ADJUSTMENT"}:
            return "ADJUSTMENT"
        return raw

    def agent_accepts_ticket_type(agent: User, ticket) -> bool:
        """
        Treat empty/blank assigned_ticket_types as "ALL".
        Match effective ticket type as an exact comma-separated token.
        """
        raw = (getattr(agent, "assigned_ticket_types", "") or "").strip()
        if not raw:
            return True
        tokens = [t.strip().upper() for t in raw.split(",") if t.strip()]
        effective_code = get_effective_ticket_type_code(ticket)

        # Legacy support:
        # Older UI stored `CHANGES` for both "Adjustment" and "Customer Issue".
        if effective_code == "ADJUSTMENT":
            return "ADJUSTMENT" in tokens or "CHANGES" in tokens
        if effective_code == "CUSTOMER_ISSUE":
            return "CUSTOMER_ISSUE" in tokens or "CHANGES" in tokens

        return effective_code in tokens

    # Strategy 1: Match insurance type AND ticket type preferences
    agents = get_agents_with_workload(
        Q(role="AGENT") & Q(preferred_insurance_types__icontains=ticket.insurance_type)
    )
    for a in agents:
        if agent_accepts_ticket_type(a, ticket):
            best_agent = a
            break

    # Strategy 2: Fallback - Match insurance type only (ignore ticket type)
    if not best_agent:
        agents = get_agents_with_workload(
            Q(role="AGENT") & Q(preferred_insurance_types__icontains=ticket.insurance_type)
        )
        best_agent = agents.first()

    # Strategy 3: Fallback - Match ticket type only (ignore insurance type)
    if not best_agent:
        agents = get_agents_with_workload(Q(role="AGENT"))
        for a in agents:
            if agent_accepts_ticket_type(a, ticket):
                best_agent = a
                break

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