from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CurrentUserView, UserViewSet, ChangePasswordView, TicketStatsAPIView, TicketDetailsAPIView, AgentNoteViewSet

router = DefaultRouter()
router.register(r'notes', AgentNoteViewSet, basename='agent-note')
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("me/change-password/", ChangePasswordView.as_view(), name="change-password"),
    # Explicit routes for UserControl -> info popup.
    # These exist alongside the ViewSet @action routes, but are placed here to avoid any
    # router-generation issues in some deployments.
    path("ticket_stats/", TicketStatsAPIView.as_view(), name="ticket-stats"),
    path("<int:user_id>/ticket_details/", TicketDetailsAPIView.as_view(), name="ticket-details"),
    path("", include(router.urls)),
]