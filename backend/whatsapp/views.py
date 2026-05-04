import logging
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.conf import settings
from django.utils import timezone
from users.models import User
from clients.models import Client
from tickets.models import Ticket, Note
from whatsapp.services import send_whatsapp_message

logger = logging.getLogger(__name__)

class WhatsAppWebhookView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Handle webhook verification from Meta."""
        verify_token = (getattr(settings, "WHATSAPP_VERIFY_TOKEN", "") or "").strip()
        mode = (request.GET.get("hub.mode") or "").strip()
        token = (request.GET.get("hub.verify_token") or "").strip()
        challenge = request.GET.get("hub.challenge")

        # Meta expects plain-text challenge in verification response.
        if mode == "subscribe" and token and token == verify_token and challenge is not None:
            return HttpResponse(challenge, status=200, content_type="text/plain")
        return Response("Verification failed", status=status.HTTP_403_FORBIDDEN)

    def post(self, request):
        """Handle incoming WhatsApp messages from Meta API."""
        try:
            body = request.data
            logger.info(
                "WhatsApp webhook received: object=%s entry_count=%s",
                body.get("object"),
                len(body.get("entry", [])) if isinstance(body, dict) else 0,
            )
            
            if body.get("object") == "whatsapp_business_account":
                for entry in body.get("entry", []):
                    for change in entry.get("changes", []):
                        value = change.get("value", {})
                        has_messages = "messages" in value
                        has_statuses = "statuses" in value
                        logger.info(
                            "WhatsApp change received: has_messages=%s has_statuses=%s",
                            has_messages,
                            has_statuses,
                        )
                        
                        # Process messages
                        if "messages" in value:
                            for message in value.get("messages", []):
                                sender_phone = message.get("from")
                                msg_text = message.get("text", {}).get("body", "")
                                
                                if not sender_phone or not msg_text:
                                    continue
                                    
                                logger.info("Incoming WhatsApp text from %s: %s", sender_phone, msg_text)
                                self._process_incoming_message(sender_phone, msg_text)
                                
            return Response("EVENT_RECEIVED", status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error processing WhatsApp webhook: {str(e)}")
            return Response("Internal Server Error", status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    def _process_incoming_message(self, sender_phone: str, msg_text: str):
        """Match incoming message to a Client/Ticket, log it, and auto-reply."""
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

        # Always send a menu-style auto-reply for incoming messages.
        self._send_auto_reply(sender_phone)

    def _send_auto_reply(self, to_phone: str):
        frontend_url = (getattr(settings, "FRONTEND_URL", "http://localhost:5173") or "").strip().rstrip("/")
        if frontend_url and not frontend_url.startswith(("http://", "https://")):
            frontend_url = f"https://{frontend_url}"
        message = (
            "Hello! Thank you for contacting Feril Kapadia Insurance Broker.\n\n"
            "Please choose your request type:\n\n"
            "1) New Business\n"
            f"{frontend_url}/forms/new-business\n\n"
            "2) Renewal\n"
            f"{frontend_url}/forms/renewal\n\n"
            "3) Changes\n"
            f"{frontend_url}/forms/changes\n\n"
            "4) Customer Issue\n"
            f"{frontend_url}/forms/customer-issue\n\n"
            "Our team will get back to you shortly."
        )
        try:
            response = send_whatsapp_message(to_phone, message)
            logger.info("WhatsApp auto-reply sent to %s: %s", to_phone, response)
        except Exception as exc:
            logger.error(f"Failed to send WhatsApp auto-reply to {to_phone}: {exc}")
