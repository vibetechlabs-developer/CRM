from django.core.management.base import BaseCommand
from django.utils import timezone
from tickets.models import Ticket
from tickets.email_services import send_follow_up_email

class Command(BaseCommand):
    help = 'Sends follow-up reminder emails for tickets requiring immediate attention.'

    def handle(self, *args, **kwargs):
        today = timezone.localdate()
        
        # Find follow ups for today or past due
        tickets_to_follow_up = Ticket.objects.filter(
            status__in=['LEAD', 'RENEWAL', 'FOLLOW_UP'],
            follow_up_date__date__lte=today,
            client__email__isnull=False
        ).exclude(client__email='')

        count = 0
        for ticket in tickets_to_follow_up:
            send_follow_up_email(ticket)
            count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully sent {count} follow-up email(s).'))
