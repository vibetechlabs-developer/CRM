from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q

from users.models import User
from common.permissions import IsAdminOrAssignedAgent, IsAdminRole
from .models import Ticket, TicketActivity, Note, Notification
from .serializers import (
    TicketSerializer,
    TicketActivitySerializer,
    NoteSerializer,
    NotificationSerializer,
)
from .services import auto_assign_ticket


class TicketViewSet(ModelViewSet):

    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]

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
        # Ticket creation should be authenticated; public creation happens via /api/insurance-form/
        if self.action == "create":
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Ticket.objects.all().select_related("client", "assigned_to", "policy")
        if getattr(user, "role", None) == "ADMIN":
            return qs
        # AGENT: only their assigned tickets
        return qs.filter(assigned_to=user)

    def perform_create(self, serializer):
        """
        Create ticket and enforce assignment rules:
        - If AGENT creates: assign to self
        - If ADMIN creates:
            - For RENEWAL/ADJUSTMENT/CANCELLATION: try continuity assignment (same previous agent)
            - Else fallback to auto-assign
        """
        user = self.request.user
        role = getattr(user, "role", None)

        ticket = serializer.save()

        if role == "AGENT":
            if not ticket.assigned_to_id:
                ticket.assigned_to = user
                ticket.save(update_fields=["assigned_to"])
            return

        # ADMIN flow: continuity assignment for non-NEW types
        if ticket.ticket_type in ["RENEWAL", "ADJUSTMENT", "CANCELLATION"] and not ticket.assigned_to_id:
            previous = (
                Ticket.objects.filter(client=ticket.client, assigned_to__isnull=False)
                .exclude(id=ticket.id)
                .order_by("-created_at")
                .first()
            )
            if previous and previous.assigned_to_id:
                ticket.assigned_to_id = previous.assigned_to_id
                ticket.save(update_fields=["assigned_to"])
            else:
                auto_assign_ticket(ticket)

        # NEW tickets: auto-assign if unassigned (signal also does this, but keep deterministic here)
        if ticket.ticket_type == "NEW" and not ticket.assigned_to_id:
            auto_assign_ticket(ticket)

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
        ticket.save()  # serializer.update will add user-attributed activity when patched via PATCH; here signal won't, so log explicitly
        TicketActivity.objects.create(ticket=ticket, user=request.user, message=f"Status changed to {new_status}.")

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

    # Notes
    @action(detail=True, methods=["get", "post"])
    def notes(self, request, pk=None):
        ticket = self.get_object()

        # ADMIN can see all; AGENT only assigned (already enforced by get_queryset)
        if request.method == "GET":
            notes = Note.objects.filter(ticket=ticket).order_by("-created_at")
            return Response(NoteSerializer(notes, many=True).data)

        # POST: create note
        payload = request.data.copy()
        payload["ticket"] = ticket.id
        payload["agent"] = request.user.id
        ser = NoteSerializer(data=payload)
        ser.is_valid(raise_exception=True)
        note = ser.save()
        TicketActivity.objects.create(ticket=ticket, user=request.user, message="Note added.")
        return Response(NoteSerializer(note).data, status=201)

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


class NotificationViewSet(ModelViewSet):
    """
    In-app notifications API (polling-based "real-time").
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"success": True})