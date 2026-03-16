from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter

from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(ModelViewSet):

    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [SearchFilter]

    search_fields = [
        "first_name",
        "last_name",
        "email",
        "phone",
    ]