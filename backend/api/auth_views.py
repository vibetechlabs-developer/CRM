from __future__ import annotations

from django.conf import settings
from django.http import HttpRequest
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def _cookie_kwargs(request: HttpRequest) -> dict:
    """
    Centralize cookie flags. For cross-site SPA dev you typically need SameSite=None
    and Secure in production (HTTPS).
    """

    secure = getattr(settings, "AUTH_COOKIE_SECURE", not settings.DEBUG)
    samesite = getattr(settings, "AUTH_COOKIE_SAMESITE", "Lax")
    domain = getattr(settings, "AUTH_COOKIE_DOMAIN", None)

    # If your frontend is on a different site, you must use SameSite=None + Secure.
    if samesite.lower() == "none":
        secure = True

    kwargs = {
        "httponly": True,
        "secure": secure,
        "samesite": samesite,
        "path": "/",
    }
    if domain:
        kwargs["domain"] = domain
    return kwargs


class CookieTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK and isinstance(response.data, dict):
            access = response.data.get("access")
            refresh = response.data.get("refresh")
            if access:
                response.set_cookie(
                    getattr(settings, "AUTH_ACCESS_COOKIE_NAME", "access_token"),
                    access,
                    max_age=int(getattr(settings, "AUTH_ACCESS_COOKIE_MAX_AGE", 60 * 15)),
                    **_cookie_kwargs(request),
                )
            if refresh:
                response.set_cookie(
                    getattr(settings, "AUTH_REFRESH_COOKIE_NAME", "refresh_token"),
                    refresh,
                    max_age=int(getattr(settings, "AUTH_REFRESH_COOKIE_MAX_AGE", 60 * 60 * 24 * 7)),
                    **_cookie_kwargs(request),
                )

            # Do not expose tokens to JS; keep response small/benign.
            response.data = {"ok": True}

        return response


class CookieTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        # Prefer refresh token from HttpOnly cookie. Fallback to body for compatibility.
        refresh_cookie_name = getattr(settings, "AUTH_REFRESH_COOKIE_NAME", "refresh_token")
        refresh = request.COOKIES.get(refresh_cookie_name) or request.data.get("refresh")
        if not refresh:
            return Response({"detail": "Refresh token missing."}, status=status.HTTP_400_BAD_REQUEST)

        # DRF request.data may be immutable; don't mutate it. Validate explicitly.
        serializer = TokenRefreshSerializer(data={"refresh": refresh})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK and isinstance(response.data, dict):
            access = response.data.get("access")
            if access:
                response.set_cookie(
                    getattr(settings, "AUTH_ACCESS_COOKIE_NAME", "access_token"),
                    access,
                    max_age=int(getattr(settings, "AUTH_ACCESS_COOKIE_MAX_AGE", 60 * 15)),
                    **_cookie_kwargs(request),
                )
            response.data = {"ok": True}
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        resp = Response({"ok": True})
        access_cookie_name = getattr(settings, "AUTH_ACCESS_COOKIE_NAME", "access_token")
        refresh_cookie_name = getattr(settings, "AUTH_REFRESH_COOKIE_NAME", "refresh_token")
        resp.delete_cookie(access_cookie_name, path="/")
        resp.delete_cookie(refresh_cookie_name, path="/")
        return resp

