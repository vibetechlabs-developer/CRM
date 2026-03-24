import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from users.models import User
from clients.models import Client
from tickets.models import Ticket, Note

logger = logging.getLogger(__name__)

class WhatsAppWebhookView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Handle webhook verification from Meta."""
        verify_token = getattr(settings, "WHATSAPP_VERIFY_TOKEN", "")
        mode = request.GET.get("hub.mode")
        token = request.GET.get("hub.verify_token")
        challenge = request.GET.get("hub.challenge")

        if mode == "subscribe" and token == verify_token:
            return Response(int(challenge), status=status.HTTP_200_OK)
        return Response("Verification failed", status=status.HTTP_403_FORBIDDEN)

    def post(self, request):
        """Handle incoming WhatsApp messages from Meta API."""
        try:
            body = request.data
            
            if body.get("object") == "whatsapp_business_account":
                for entry in body.get("entry", []):
                    for change in entry.get("changes", []):
                        value = change.get("value", {})
                        
                        # Process messages
                        if "messages" in value:
                            for message in value.get("messages", []):
                                sender_phone = message.get("from")
                                msg_text = message.get("text", {}).get("body", "")
                                
                                if not sender_phone or not msg_text:
                                    continue
                                    
                                self._process_incoming_message(sender_phone, msg_text)
                                
            return Response("EVENT_RECEIVED", status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error processing WhatsApp webhook: {str(e)}")
            return Response("Internal Server Error", status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    def _process_incoming_message(self, sender_phone: str, msg_text: str):
        """Match the incoming message to a Client and Ticket to log as a Note."""
        # Typical Meta WhatsApp phones contain country code, e.g., 15551234567. 
        # Using endswith to match local numbers loosely against DB
        suffix = sender_phone[-10:] if len(sender_phone) >= 10 else sender_phone
        clients = Client.objects.filter(phone__endswith=suffix)
        
        if clients.exists():
            client = clients.first()
            # Update last interaction
            client.last_interaction_date = timezone.now()
            client.save(update_fields=['last_interaction_date'])
            
            # Find the most recent active ticket, or just the latest one
            latest_ticket = Ticket.objects.filter(client=client).order_by('-created_at').first()
            
            if latest_ticket:
                agent = latest_ticket.assigned_to
                if not agent:
                    # Fallback to a superuser if no agent is assigned
                    agent = User.objects.filter(is_superuser=True).first()
                if not agent:
                     # If still no user exists at all in the DB, we skip creating the note 
                     # to avoid IntegrityError, since Note requires an agent.
                     return 

                # Log the text as a Note
                Note.objects.create(
                    ticket=latest_ticket,
                    agent=agent,
                    content=f"[Incoming WhatsApp] {msg_text}"
                )
