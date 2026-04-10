from django.core.management.base import BaseCommand
from django.utils import timezone

from tickets.models import Ticket


class Command(BaseCommand):
    help = "Discard overdue renewal tickets whose renewal_date is in the past."

    def handle(self, *args, **options):
        today = timezone.localdate()
        now = timezone.now()
        updated = (
            Ticket.objects.filter(
                ticket_type="RENEWAL",
                renewal_date__lt=today,
            )
            .exclude(status="DISCARDED")
            .update(status="DISCARDED", discarded_at=now)
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Discarded {updated} overdue renewal ticket(s)."
            )
        )
