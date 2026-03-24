from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from .models import Policy
from .serializers import PolicySerializer
from rest_framework.permissions import IsAuthenticated
from common.permissions import DenyDeleteForManager

class PolicyViewSet(ModelViewSet):
    serializer_class = PolicySerializer
    permission_classes = [IsAuthenticated, DenyDeleteForManager]

    filter_backends = [DjangoFilterBackend]

    filterset_fields = [
        'client',
        'policy_number',
        'insurance_type'
    ]

    def get_queryset(self):
        user = self.request.user
        qs = Policy.objects.all().select_related("client")
        if getattr(user, "role", None) in ("ADMIN", "MANAGER"):
            return qs
        # AGENT: only policies belonging to clients that have tickets assigned to this agent
        return qs.filter(client__tickets__assigned_to=user).distinct()