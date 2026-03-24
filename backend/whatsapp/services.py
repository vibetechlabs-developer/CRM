import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_whatsapp_message(to_number: str, message_body: str) -> dict:
    """
    Sends a WhatsApp text message using Meta Cloud API.
    Raises an exception or returns the JSON response.
    """
    token = getattr(settings, "WHATSAPP_ACCESS_TOKEN", None)
    phone_id = getattr(settings, "WHATSAPP_PHONE_NUMBER_ID", None)
    
    if not token or not phone_id:
        logger.error("WhatsApp credentials not configured in settings.")
        return {"error": "Missing WhatsApp credentials"}
        
    url = f"https://graph.facebook.com/v17.0/{phone_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": message_body}
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to send WhatsApp message to {to_number}: {str(e)}")
        # You could also log the response text if e.response is not None
        if hasattr(e, 'response') and e.response is not None:
             logger.error(f"Meta API Response: {e.response.text}")
        raise
