from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from .models import Policy
from .serializers import PolicySerializer

class PolicyViewSet(ModelViewSet):
    queryset = Policy.objects.all()
    serializer_class = PolicySerializer

    filter_backends = [DjangoFilterBackend]

    filterset_fields = [
        'client',
        'policy_number',
        'insurance_type'
    ]