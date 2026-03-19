from django.urls import path, include
from api.auth_views import CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView

from rest_framework.routers import DefaultRouter
from clients.views import ClientViewSet
from policies.views import PolicyViewSet
from tickets.views import TicketViewSet
from tickets.views import NotificationViewSet
from tickets.insurance_form_views import submit_insurance_form

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename="clients")
router.register(r'policies', PolicyViewSet, basename="policies")
router.register(r'tickets', TicketViewSet, basename="tickets")
router.register(r'notifications', NotificationViewSet, basename="notifications")

urlpatterns = [

    path("auth/login/", CookieTokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),

    path("insurance-form/", submit_insurance_form, name="insurance-form"),
    
    path("", include(router.urls)),
    path("users/", include("users.urls")),
]