import logging
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from policies.models import Policy
from whatsapp.services import send_whatsapp_template_message

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Sends WhatsApp template reminders for policies expiring in 30, 15, or 7 days.'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        target_dates = {
            "30_days": today + timedelta(days=30),
            "15_days": today + timedelta(days=15),
            "7_days": today + timedelta(days=7),
        }
        
        # You will need to replace "renewal_reminder_template" with the exact name you used in Meta
        TEMPLATE_NAME = "renewal_reminder_template"
        
        self.stdout.write(f"Checking renewals for today: {today}")
        
        # Find active policies expiring exactly on the target dates
        policies = Policy.objects.filter(
            status="ACTIVE",
            end_date__in=target_dates.values()
        ).select_related('client')

        count = 0
        for policy in policies:
            client = policy.client
            if not client.phone:
                continue
                
            # Formatting the phone number could be needed depending on how it's stored (must have country code)
            to_number = client.phone
            
            # Form the components for the template variables:
            # Example expectation from earlier conversation: {{1}}=Name, {{2}}=Date, {{3}}=Link/Phone
            # This must match your actual Meta template structure.
            components = [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": client.first_name},
                        {"type": "text", "text": str(policy.end_date)},
                        {"type": "text", "text": policy.policy_number}
                    ]
                }
            ]
            
            try:
                self.stdout.write(f"Sending Template to {client.full_name} for Policy {policy.policy_number}")
                response = send_whatsapp_template_message(
                    to_number=to_number,
                    template_name=TEMPLATE_NAME,
                    language_code="en_US", # Adjust if you set it to gu or en_GB etc.
                    components=components
                )
                self.stdout.write(self.style.SUCCESS(f"Successfully sent to {to_number}. Resp: {response}"))
                count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to send to {to_number}: {e}"))
                
        self.stdout.write(self.style.SUCCESS(f"Process complete. Sent {count} reminders."))
