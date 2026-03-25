from collections import defaultdict
from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.decorators import action

from .serializers import UserSerializer, CurrentUserUpdateSerializer, ChangePasswordSerializer
from .models import User
from common.permissions import IsAdminRole, IsAdminOrManagerNoDelete
from tickets.models import Ticket, TicketActivity


class CurrentUserView(RetrieveUpdateAPIView):

    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return CurrentUserUpdateSerializer
        return UserSerializer


class UserViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    # ADMIN full access; MANAGER can do everything except DELETE
    permission_classes = [IsAdminOrManagerNoDelete]

    def destroy(self, request, *args, **kwargs):
        """
        Disallow deletion of users for all roles. Return 403.
        """
        return Response({"detail": "User deletion is disabled."}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=False, methods=["get"], permission_classes=[IsAdminRole])
    def ticket_stats(self, request):
        """
        Admin-only: return ticket stats per user for the User Management table.

        - assignedTicketsCount: tickets where `assigned_to = user`
        - updatedTicketsCount: distinct tickets where user has TicketActivity entries
        - completedByUserTicketsCount: distinct tickets where user changed status to COMPLETED
        - totalTicketsCount: same as assignedTicketsCount (kept for UI wording)
        - todayTicketsCount / todayCompletedTicketsCount: tickets created today (assigned to user) and completed status
        - ticketTypeCounts: breakdown by Ticket.ticket_type for assigned tickets
        """
        now = timezone.now()
        # Use local timezone date boundaries for "today" reporting.
        now_local = timezone.localtime(now)
        today_start = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_start = today_start + timedelta(days=1)

        user_ids = list(User.objects.values_list("id", flat=True))
        if not user_ids:
            return Response([])

        # UI expects: New Policy, Renewal, Changes, Cancellation
        # Backend stores "CHANGES", and we also treat legacy "ADJUSTMENT"/"CUSTOMER_ISSUE" as "CHANGES" bucket
        # so frontend breakdown matches user-facing labels.
        ticket_type_codes = ["NEW", "RENEWAL", "CHANGES", "CANCELLATION"]
        ticket_status_completed = "COMPLETED"

        # Assigned tickets counts (all time).
        assigned_agg = (
            Ticket.objects.filter(assigned_to_id__in=user_ids)
            .values("assigned_to_id")
            .annotate(assignedTicketsCount=Count("id"))
        )

        assigned_map = {row["assigned_to_id"]: row["assignedTicketsCount"] for row in assigned_agg}

        # Today created tickets counts (assigned_to=user, created_at=today).
        today_agg = (
            Ticket.objects.filter(assigned_to_id__in=user_ids, created_at__gte=today_start, created_at__lt=tomorrow_start)
            .values("assigned_to_id")
            .annotate(todayTicketsCount=Count("id"))
        )
        today_map = {row["assigned_to_id"]: row["todayTicketsCount"] for row in today_agg}

        # Today completed tickets counts (subset of today's created tickets).
        today_completed_agg = (
            Ticket.objects.filter(
                assigned_to_id__in=user_ids,
                created_at__gte=today_start,
                created_at__lt=tomorrow_start,
                status=ticket_status_completed,
            )
            .values("assigned_to_id")
            .annotate(todayCompletedTicketsCount=Count("id"))
        )
        today_completed_map = {row["assigned_to_id"]: row["todayCompletedTicketsCount"] for row in today_completed_agg}

        # Updated tickets: distinct tickets for which the user has any TicketActivity.
        updated_agg = (
            TicketActivity.objects.filter(user_id__in=user_ids)
            .values("user_id")
            .annotate(updatedTicketsCount=Count("ticket_id", distinct=True))
        )
        updated_map = {row["user_id"]: row["updatedTicketsCount"] for row in updated_agg}

        # Completed-by-user: distinct tickets where user changed status to COMPLETED.
        # Messages are created in TicketSerializer.update() / TicketViewSet.change_status().
        completed_by_user_agg = (
            TicketActivity.objects.filter(user_id__in=user_ids)
            .filter(
                # Must match both "Status changed" and the target status keyword (e.g. COMPLETED).
                Q(message__icontains="Status changed") & Q(message__icontains=ticket_status_completed)
            )
            .values("user_id")
            .annotate(completedByUserTicketsCount=Count("ticket_id", distinct=True))
        )
        completed_by_user_map = {row["user_id"]: row["completedByUserTicketsCount"] for row in completed_by_user_agg}

        # Ticket type breakdown for all assigned tickets.
        # We derive "CHANGES" bucket from:
        # - ticket_type CHANGES
        # - legacy ADJUSTMENT records
        # - customer-issue marker in additional_notes
        ticket_type_map: dict[int, dict[str, int]] = defaultdict(lambda: {c: 0 for c in ticket_type_codes})
        tickets_rows = Ticket.objects.filter(assigned_to_id__in=user_ids).values(
            "assigned_to_id",
            "ticket_type",
            "additional_notes",
        )
        for row in tickets_rows:
            assigned_to_id = row["assigned_to_id"]
            raw_code = (row.get("ticket_type") or "").strip().upper()
            notes = row.get("additional_notes") or ""
            effective_code = "CHANGES" if raw_code in {"CHANGES", "ADJUSTMENT"} else raw_code
            if notes and "[Form: Customer Issue]" in notes:
                effective_code = "CHANGES"

            if effective_code in ticket_type_map[assigned_to_id]:
                ticket_type_map[assigned_to_id][effective_code] += 1

        # Build final response with stable ordering.
        users = User.objects.all().order_by("id").values("id", "username", "first_name", "last_name", "email", "role")
        results = []
        for u in users:
            user_id = u["id"]
            assigned_count = int(assigned_map.get(user_id, 0))
            results.append(
                {
                    "userId": user_id,
                    "assignedTicketsCount": assigned_count,
                    "updatedTicketsCount": int(updated_map.get(user_id, 0)),
                    "completedByUserTicketsCount": int(completed_by_user_map.get(user_id, 0)),
                    "totalTicketsCount": assigned_count,
                    "todayTicketsCount": int(today_map.get(user_id, 0)),
                    "todayCompletedTicketsCount": int(today_completed_map.get(user_id, 0)),
                    "ticketTypeCounts": [
                        {"ticket_type": c, "count": int(ticket_type_map[user_id].get(c, 0))}
                        for c in ticket_type_codes
                    ],
                }
            )

        return Response(results)

    @action(detail=True, methods=["get"], permission_classes=[IsAdminRole])
    def ticket_details(self, request, pk=None):
        """
        Admin-only: return full ticket list for a given user (assigned_to=user).

        Used by User Management -> Info icon popup.
        """
        user = self.get_object()

        tickets_qs = (
            Ticket.objects.filter(assigned_to_id=user.id)
            .select_related("client", "assigned_to")
            .order_by("-created_at")
        )

        tickets = []
        for t in tickets_qs:
            tickets.append(
                {
                    "id": t.id,
                    "ticket_no": t.ticket_no,
                    "ticket_type": t.ticket_type,
                    "status": t.status,
                    "priority": t.priority,
                    "insurance_type": t.insurance_type,
                    "source": t.source,
                    "follow_up_date": t.follow_up_date,
                    "created_at": t.created_at,
                    "updated_at": t.updated_at,
                    "client_name": f"{t.client.first_name} {t.client.last_name}".strip(),
                    "client_email": t.client.email,
                    "client_phone": t.client.phone,
                    "client_address": t.client.address,
                    "client_occupation": t.client.occupation,
                    "additional_notes": t.additional_notes,
                    "details": t.details,
                }
            )

        return Response({"userId": user.id, "ticketsCount": len(tickets), "tickets": tickets})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user: User = request.user
        old_password = serializer.validated_data["old_password"]
        new_password = serializer.validated_data["new_password"]

        if not user.check_password(old_password):
            return Response({"old_password": ["Current password is incorrect."]}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"ok": True}, status=status.HTTP_200_OK)