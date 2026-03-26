from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from datetime import timedelta
from common.permissions import DenyDeleteForManager

from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(ModelViewSet):

    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, DenyDeleteForManager]

    filter_backends = [SearchFilter, OrderingFilter]
    ordering = ["-created_at"]

    search_fields = [
        "client_id",
        "first_name",
        "last_name",
        "email",
        "phone",
    ]

    def get_queryset(self):
        qs = Client.objects.all()

        renewal_days_param = self.request.query_params.get("renewal_days")
        if renewal_days_param:
            try:
                renewal_days = int(renewal_days_param)
            except (TypeError, ValueError):
                renewal_days = None

            if renewal_days is not None and renewal_days > 0:
                today = timezone.localdate()
                end_date_limit = today + timedelta(days=renewal_days)
                qs = qs.filter(
                    tickets__ticket_type="RENEWAL",
                    tickets__renewal_date__isnull=False,
                    tickets__renewal_date__gte=today,
                    tickets__renewal_date__lte=end_date_limit,
                ).exclude(
                    tickets__status__in=["DISCARDED", "COMPLETED"],
                ).distinct()

        return qs