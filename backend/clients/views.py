from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from common.permissions import DenyDeleteForManager

from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(ModelViewSet):

    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, DenyDeleteForManager]

    filter_backends = [SearchFilter, OrderingFilter]
    ordering = ["-created_at"]

    search_fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
    ]

    def get_queryset(self):
        user = self.request.user
        qs = Client.objects.all()
        if getattr(user, "role", None) in ("ADMIN", "MANAGER"):
            return qs
        # AGENT: only clients that have at least one ticket assigned to this agent
        return qs.filter(tickets__assigned_to=user).distinct()