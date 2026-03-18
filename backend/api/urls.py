from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from rest_framework.routers import DefaultRouter
from clients.views import ClientViewSet
from policies.views import PolicyViewSet
from tickets.views import TicketViewSet
from tickets.insurance_form_views import submit_insurance_form

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename="clients")
router.register(r'policies', PolicyViewSet, basename="policies")
router.register(r'tickets', TicketViewSet, basename="tickets")

urlpatterns = [

    path("auth/login/", TokenObtainPairView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("insurance-form/", submit_insurance_form, name="insurance-form"),
    
    path("", include(router.urls)),
    path("users/", include("users.urls")),
]