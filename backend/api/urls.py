from django.urls import path, include
from api.auth_views import CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView

from rest_framework.routers import DefaultRouter
from clients.views import ClientViewSet
from policies.views import PolicyViewSet
from tickets.views import TicketViewSet
from tickets.views import NotificationViewSet, BinderViewSet
from tickets.insurance_form_views import (
    submit_insurance_form,
    submit_renewal_form,
    submit_changes_form,
    submit_cancellation_form,
    submit_customer_issue_form,
)

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename="clients")
router.register(r'policies', PolicyViewSet, basename="policies")
router.register(r'tickets', TicketViewSet, basename="tickets")
router.register(r'notifications', NotificationViewSet, basename="notifications")
router.register(r'binders', BinderViewSet, basename="binders")

urlpatterns = [

    path("auth/login/", CookieTokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),

    path("insurance-form/", submit_insurance_form, name="insurance-form"),
    # Public-facing "New Business" form URL using the same handler as the main insurance form
    path("forms/new-business/", submit_insurance_form, name="new-business-form"),
    path("forms/renewal/", submit_renewal_form, name="renewal-form"),
    path("forms/changes/", submit_changes_form, name="changes-form"),
    path("forms/cancellation/", submit_cancellation_form, name="cancellation-form"),
    path("forms/customer-issue/", submit_customer_issue_form, name="customer-issue-form"),
    
    path("", include(router.urls)),
    path("users/", include("users.urls")),
    path("whatsapp/", include("whatsapp.urls")),
]