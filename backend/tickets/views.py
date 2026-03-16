from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Ticket, TicketActivity
from .serializers import TicketSerializer, TicketActivitySerializer


class TicketViewSet(ModelViewSet):

    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer

    filter_backends = [DjangoFilterBackend]

    filterset_fields = [
        'status',
        'ticket_type',
        'assigned_to',
        'client',
        'insurance_type',
        'source'
    ]

    # Permission control
    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    # Custom API: Change Ticket Status
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):

        ticket = self.get_object()
        new_status = request.data.get('status')

        if not new_status:
            return Response(
                {"error": "Status is required"},
                status=400
            )

        ticket.status = new_status
        ticket.save()

        return Response({
            "message": "Ticket status updated successfully",
            "status": ticket.status
        })

    # Custom API: Get Ticket Activities
    @action(detail=True, methods=['get'])
    def activities(self, request, pk=None):

        ticket = self.get_object()

        activities = TicketActivity.objects.filter(
            ticket=ticket
        ).order_by('created_at')

        serializer = TicketActivitySerializer(
            activities,
            many=True
        )

        return Response(serializer.data)