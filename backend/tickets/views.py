from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Ticket, TicketActivity
from .serializers import TicketSerializer, TicketActivitySerializer
from .services import auto_assign_ticket


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

    # Custom API: Auto-assign a specific ticket
    @action(detail=True, methods=['post'])
    def auto_assign(self, request, pk=None):
        """Manually trigger auto-assignment for a specific ticket"""
        ticket = self.get_object()
        
        if ticket.assigned_to:
            return Response({
                "message": "Ticket is already assigned",
                "assigned_to": ticket.assigned_to.username
            })
        
        auto_assign_ticket(ticket)
        ticket.refresh_from_db()
        
        if ticket.assigned_to:
            return Response({
                "message": "Ticket assigned successfully",
                "assigned_to": ticket.assigned_to.username
            })
        else:
            return Response({
                "message": "No available agents found to assign this ticket"
            }, status=404)

    # Custom API: Auto-assign all unassigned tickets
    @action(detail=False, methods=['post'])
    def auto_assign_all(self, request):
        """Auto-assign all unassigned tickets"""
        unassigned_tickets = Ticket.objects.filter(assigned_to__isnull=True)
        assigned_count = 0
        failed_count = 0
        
        for ticket in unassigned_tickets:
            old_assigned_to = ticket.assigned_to
            auto_assign_ticket(ticket)
            ticket.refresh_from_db()
            
            if ticket.assigned_to and ticket.assigned_to != old_assigned_to:
                assigned_count += 1
            else:
                failed_count += 1
        
        return Response({
            "message": f"Auto-assignment completed",
            "assigned": assigned_count,
            "failed": failed_count,
            "total_processed": unassigned_tickets.count()
        })