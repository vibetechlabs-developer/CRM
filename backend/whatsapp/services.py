import logging
import json
from urllib import error, request

from django.conf import settings

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
    
    req = request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=10) as response:
            response_body = response.read().decode("utf-8")
            if not response_body:
                return {}
            return json.loads(response_body)
    except error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        logger.error(f"Failed to send WhatsApp message to {to_number}: HTTP {e.code} {e.reason}")
        logger.error(f"Meta API Response: {body}")
        raise
    except error.URLError as e:
        logger.error(f"Failed to send WhatsApp message to {to_number}: {str(e)}")
        raise

def send_whatsapp_template_message(to_number: str, template_name: str, language_code: str = "en_US", components: list = None) -> dict:
    """
    Sends a WhatsApp template message using Meta Cloud API.
    `components` is a list of parameters for the template. Example:
    [
        {
            "type": "body",
            "parameters": [
                {"type": "text", "text": "Variable1"},
                {"type": "text", "text": "Variable2"}
            ]
        }
    ]
    """
    token = getattr(settings, "WHATSAPP_ACCESS_TOKEN", None)
    phone_id = getattr(settings, "WHATSAPP_PHONE_NUMBER_ID", None)
    
    if not token or not phone_id:
        logger.error("WhatsApp credentials not configured in settings.")
        return {"error": "Missing WhatsApp credentials"}
        
    # Assume v17.0 or whatever version is currently standard
    url = f"https://graph.facebook.com/v17.0/{phone_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {
                "code": language_code
            }
        }
    }
    if components:
        payload["template"]["components"] = components
    
    req = request.Request(
        url=url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=10) as response:
            response_body = response.read().decode("utf-8")
            if not response_body:
                return {}
            return json.loads(response_body)
    except error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        logger.error(f"Failed to send WhatsApp template to {to_number}: HTTP {e.code} {e.reason}")
        logger.error(f"Meta API Response: {body}")
        raise
    except error.URLError as e:
        logger.error(f"Failed to send WhatsApp template to {to_number}: {str(e)}")
        raise
