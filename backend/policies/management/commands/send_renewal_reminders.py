import logging
from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand
from policies.models import Policy, PolicyRenewalReminderLog
from whatsapp.services import send_whatsapp_template_message
from tickets.email_services import _send_branded_email
from django.conf import settings

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Sends WhatsApp + Email renewal reminders for policies expiring in 30/21/14/7/2/1 days.'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        reminder_days = [30, 21, 14, 7, 2, 1]
        target_date_to_days = {today + timedelta(days=d): d for d in reminder_days}
        
        # Configure these to match your Meta approved template.
        TEMPLATE_NAME = getattr(kwargs, "template_name", None) or "renewal_reminder_template"
        
        self.stdout.write(f"Checking renewals for today: {today}")
        
        # Find active policies expiring exactly on the target dates
        policies = Policy.objects.filter(
            status="ACTIVE",
            end_date__in=list(target_date_to_days.keys())
        ).select_related('client')

        whatsapp_count = 0
        email_count = 0
        for policy in policies:
            client = policy.client
            days_before = target_date_to_days.get(policy.end_date)
            if days_before is None:
                continue
            frontend_url = (getattr(settings, "FRONTEND_URL", "") or "").strip().rstrip("/")
            if frontend_url and not frontend_url.startswith(("http://", "https://")):
                frontend_url = f"https://{frontend_url}"
            renewal_link = f"{frontend_url}/forms/renewal" if frontend_url else ""
                
            # --- WhatsApp (template-based, required for business-initiated reminders) ---
            if client.phone:
                already_sent_wa = PolicyRenewalReminderLog.objects.filter(
                    policy=policy, days_before=days_before, channel="WHATSAPP"
                ).exists()
                if not already_sent_wa:
                    to_number = client.phone
                    # Template variables: name, days_before, end_date, policy_number
                    components = [
                        {
                            "type": "body",
                            "parameters": [
                                {"type": "text", "text": client.first_name or "Customer"},
                                {"type": "text", "text": str(days_before)},
                                {"type": "text", "text": str(policy.end_date)},
                                # Keep template variable count stable: include renewal link alongside policy number.
                                {"type": "text", "text": f"{policy.policy_number}\nRenewal form: {renewal_link}" if renewal_link else policy.policy_number},
                            ],
                        }
                    ]
                    try:
                        response = send_whatsapp_template_message(
                            to_number=to_number,
                            template_name=TEMPLATE_NAME,
                            language_code="en_US",
                            components=components,
                        )
                        PolicyRenewalReminderLog.objects.create(
                            policy=policy, days_before=days_before, channel="WHATSAPP"
                        )
                        self.stdout.write(self.style.SUCCESS(f"WhatsApp sent to {to_number}. Resp: {response}"))
                        whatsapp_count += 1
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"WhatsApp failed to {to_number}: {e}"))
            
            # --- Email ---
            if client.email:
                already_sent_email = PolicyRenewalReminderLog.objects.filter(
                    policy=policy, days_before=days_before, channel="EMAIL"
                ).exists()
                if not already_sent_email:
                    try:
                        subject = f"Policy Renewal Reminder: {policy.policy_number} ({days_before} day(s) left)"
                        paragraphs = [
                            f"This is a reminder that your policy is due for renewal in {days_before} day(s).",
                            f"Policy number: {policy.policy_number}",
                            f"Provider: {policy.provider}",
                            f"Insurance type: {policy.get_insurance_type_display()}",
                            f"Expiry date: {policy.end_date}",
                            *( [f"Renewal form: {renewal_link}"] if renewal_link else [] ),
                        ]
                        _send_branded_email(
                            to_email=client.email,
                            subject=subject,
                            greeting_name=client.first_name or "Customer",
                            heading="Policy Renewal Reminder",
                            paragraphs=paragraphs,
                            cta_label=None,
                            cta_url=None,
                        )
                        PolicyRenewalReminderLog.objects.create(
                            policy=policy, days_before=days_before, channel="EMAIL"
                        )
                        self.stdout.write(self.style.SUCCESS(f"Email sent to {client.email} for {policy.policy_number}"))
                        email_count += 1
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Email failed to {client.email}: {e}"))

        self.stdout.write(
            self.style.SUCCESS(f"Process complete. Sent WhatsApp={whatsapp_count}, Email={email_count} reminders.")
        )
