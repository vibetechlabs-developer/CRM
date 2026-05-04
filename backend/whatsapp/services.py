import logging
import json
from urllib import error, request

from django.conf import settings

logger = logging.getLogger(__name__)

def _normalize_whatsapp_number(raw_number: str) -> str:
    """
    Convert phone values to WhatsApp API-friendly format (digits only).
    Country code is not auto-injected to avoid wrong-region routing.
    """
    value = (raw_number or "").strip()
    digits = "".join(ch for ch in value if ch.isdigit())
    return digits

def _get_whatsapp_api_version() -> str:
    """
    Return a safe Meta Graph API version string like 'v25.0'.
    Defaults to v25.0 (current in Meta UI samples) but can be overridden via env.
    """
    raw = (getattr(settings, "WHATSAPP_API_VERSION", "") or "").strip()
    if not raw:
        return "v25.0"
    # Accept '25.0' or 'v25.0'
    raw = raw.lower()
    if raw.startswith("v"):
        return raw
    return f"v{raw}"

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
        
    api_version = _get_whatsapp_api_version()
    url = f"https://graph.facebook.com/{api_version}/{phone_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    normalized_number = _normalize_whatsapp_number(to_number)

    payload = {
        "messaging_product": "whatsapp",
        "to": normalized_number,
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
        logger.error(f"Failed to send WhatsApp message to {normalized_number}: HTTP {e.code} {e.reason}")
        logger.error(f"Meta API Response: {body}")
        raise
    except error.URLError as e:
        logger.error(f"Failed to send WhatsApp message to {normalized_number}: {str(e)}")
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
        
    api_version = _get_whatsapp_api_version()
    url = f"https://graph.facebook.com/{api_version}/{phone_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    normalized_number = _normalize_whatsapp_number(to_number)

    payload = {
        "messaging_product": "whatsapp",
        "to": normalized_number,
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
        logger.error(f"Failed to send WhatsApp template to {normalized_number}: HTTP {e.code} {e.reason}")
        logger.error(f"Meta API Response: {body}")
        raise
    except error.URLError as e:
        logger.error(f"Failed to send WhatsApp template to {normalized_number}: {str(e)}")
        raise
