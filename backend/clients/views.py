from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter

from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(ModelViewSet):

    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [SearchFilter]

    search_fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
    ]

    def get_queryset(self):
        user = self.request.user
        qs = Client.objects.all()
        if getattr(user, "role", None) == "ADMIN":
            return qs
        # AGENT: only clients that have at least one ticket assigned to this agent
        return qs.filter(tickets__assigned_to=user).distinct()