from __future__ import annotations

from typing import Any

from django.conf import settings
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """
    Authenticate using an access JWT stored in an HttpOnly cookie.

    This avoids putting tokens in localStorage (XSS) and avoids exposing them to JS.
    """

    access_cookie_name = getattr(settings, "AUTH_ACCESS_COOKIE_NAME", "access_token")

    def authenticate(self, request: Request) -> tuple[Any, Any] | None:
        header = self.get_header(request)
        if header is not None:
            # Allow Authorization: Bearer ... for non-browser clients / debugging.
            return super().authenticate(request)

        raw_token = request.COOKIES.get(self.access_cookie_name)
        if not raw_token:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token

