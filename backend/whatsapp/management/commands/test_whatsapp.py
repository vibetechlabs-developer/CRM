import logging
from django.core.management.base import BaseCommand
from whatsapp.services import send_whatsapp_template_message

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Test sending a WhatsApp template message to a specific number'

    def add_arguments(self, parser):
        parser.add_argument('phone', type=str, help='Phone number with country code (e.g. 919876543210)')
        parser.add_argument('template', type=str, help='Template name (e.g. policy_changes_completed)')
        parser.add_argument(
            '--language',
            type=str,
            default='en_US',
            help='Template language code exactly as approved in Meta (e.g. en_US, hi).',
        )

    def handle(self, *args, **kwargs):
        phone = kwargs['phone']
        template_name = kwargs['template']
        language_code = kwargs['language']

        self.stdout.write(
            f"Attempting to send template '{template_name}' to {phone} with language '{language_code}'..."
        )

        # We will pass dummy components just in case the template requires them.
        # This structure matches 2 variables {{1}} and {{2}}
        components = [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": "Test User"},
                    {"type": "text", "text": "POL-123456"}
                ]
            }
        ]

        try:
            response = send_whatsapp_template_message(
                to_number=phone,
                template_name=template_name,
                components=components,
                language_code=language_code,
            )
            self.stdout.write(self.style.SUCCESS(f"Successfully sent! Meta Response: {response}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to send: {e}"))
            self.stdout.write(
                "Note: If you get a 'Template not found' error, make sure the template name and language "
                "code exactly match Meta-approved values."
            )
