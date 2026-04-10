"""
Mark a DISCARDED ticket so it appears in the dashboard re-approach window (testing).

Usage:
  python manage.py flag_ticket_for_discard_reminder_test
  python manage.py flag_ticket_for_discard_reminder_test --ticket-no INS-00037
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from tickets.models import Ticket


class Command(BaseCommand):
    help = "Set discarded_at ~1 year ago on a DISCARDED ticket so the dashboard reminder shows."

    def add_arguments(self, parser):
        parser.add_argument(
            "--ticket-no",
            type=str,
            default=None,
            help="Ticket number (e.g. INS-00037). Defaults to first DISCARDED ticket.",
        )

    def handle(self, *args, **options):
        ticket_no = options.get("ticket_no")
        qs = Ticket.objects.filter(status="DISCARDED")
        if ticket_no:
            qs = qs.filter(ticket_no=ticket_no.strip())
        ticket = qs.order_by("-id").first()
        if not ticket:
            self.stdout.write(self.style.ERROR("No matching DISCARDED ticket. Discard a lead in the UI first."))
            return
        ticket.discarded_at = timezone.now() - timedelta(days=365)
        ticket.save(update_fields=["discarded_at"])
        self.stdout.write(
            self.style.SUCCESS(
                f"Updated {ticket.ticket_no}: discarded_at set for reminder window. "
                "Refresh the Dashboard as ADMIN/MANAGER or as the assigned AGENT."
            )
        )
