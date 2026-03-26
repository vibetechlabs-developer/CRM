from rest_framework import serializers
from users.models import User
from .models import Ticket, TicketActivity, Note, Notification
import re


class TicketSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.first_name', read_only=True)
    client_last_name = serializers.CharField(source='client.last_name', read_only=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)
    client_phone = serializers.CharField(source='client.phone', read_only=True)
    client_address = serializers.CharField(source='client.address', read_only=True)
    client_occupation = serializers.CharField(source='client.occupation', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = Ticket
        fields = '__all__'
        read_only_fields = ['ticket_no']

    def get_assigned_to_name(self, obj):
        """Return the full name of the assigned agent, or username if name is not available"""
        if obj.assigned_to:
            first_name = obj.assigned_to.first_name or ""
            last_name = obj.assigned_to.last_name or ""
            full_name = f"{first_name} {last_name}".strip()
            return full_name if full_name else obj.assigned_to.username
        return None

    def validate(self, attrs):
        # Completed should be terminal: do not allow moving back.
        instance = getattr(self, "instance", None)
        next_status = attrs.get("status")
        next_type = attrs.get("ticket_type")
        if instance:
            next_type = next_type or instance.ticket_type
        if instance and instance.status == "COMPLETED" and next_status and next_status != "COMPLETED":
            raise serializers.ValidationError({"status": "Completed ticket cannot be moved to another stage."})
        if next_type == "CANCELLATION" and next_status and next_status != "DISCARDED":
            raise serializers.ValidationError({"status": "Cancellation ticket must stay in Discarded Leads."})
        return attrs

    def update(self, instance, validated_data):
        """
        Add audit trail with user attribution for important field changes.
        (Signals can't reliably capture request.user.)
        """
        request = self.context.get("request")
        actor = getattr(request, "user", None) if request else None

        old_status = instance.status
        old_priority = instance.priority
        old_assigned_to_id = instance.assigned_to_id

        instance = super().update(instance, validated_data)

        # Write activities (and notifications for ADMINs) only when we have an authenticated actor
        if actor and getattr(actor, "is_authenticated", False):
            if old_status != instance.status:
                TicketActivity.objects.create(
                    ticket=instance,
                    user=actor,
                    message=f"Status changed from {old_status} to {instance.status}.",
                )
                admin_ids = list(User.objects.filter(role="ADMIN").values_list("id", flat=True))
                Notification.objects.bulk_create(
                    [
                        Notification(
                            user_id=admin_id,
                            ticket=instance,
                            created_by=actor,
                            message=f"Ticket {instance.ticket_no} status: {old_status} → {instance.status}",
                        )
                        for admin_id in admin_ids
                    ]
                )

            if old_priority != instance.priority:
                TicketActivity.objects.create(
                    ticket=instance,
                    user=actor,
                    message=f"Priority changed from {old_priority} to {instance.priority}.",
                )

            if old_assigned_to_id != instance.assigned_to_id:
                old_user = User.objects.filter(id=old_assigned_to_id).first() if old_assigned_to_id else None
                new_user = User.objects.filter(id=instance.assigned_to_id).first() if instance.assigned_to_id else None
                TicketActivity.objects.create(
                    ticket=instance,
                    user=actor,
                    message=f"Assignment changed from {(old_user.username if old_user else 'Unassigned')} to {(new_user.username if new_user else 'Unassigned')}.",
                )
                admin_ids = list(User.objects.filter(role="ADMIN").values_list("id", flat=True))
                Notification.objects.bulk_create(
                    [
                        Notification(
                            user_id=admin_id,
                            ticket=instance,
                            created_by=actor,
                            message=f"Ticket {instance.ticket_no} reassigned.",
                        )
                        for admin_id in admin_ids
                    ]
                )

        return instance


class TicketActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketActivity
        fields = '__all__'


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = "__all__"


class NotificationSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()
    changed_by_username = serializers.SerializerMethodField()
    ticket_created_by = serializers.SerializerMethodField()

    # Ticket-related fields so the frontend can show "what ticket is this?" quickly.
    #
    # NOTE: In some existing live data, `Notification.ticket` may be null (older rows),
    # but the `message` still contains the ticket number (e.g. "INS-00043").
    # We therefore resolve missing ticket data from the message when needed.
    ticket_no = serializers.SerializerMethodField()
    ticket_type = serializers.SerializerMethodField()
    ticket_status = serializers.SerializerMethodField()
    ticket_priority = serializers.SerializerMethodField()
    insurance_type = serializers.SerializerMethodField()
    ticket_details = serializers.SerializerMethodField()
    ticket_additional_notes = serializers.SerializerMethodField()
    follow_up_date = serializers.SerializerMethodField()

    # Ticket-related fields so the frontend can show "what ticket is this?" quickly.
    client_name = serializers.SerializerMethodField()
    client_email = serializers.SerializerMethodField()

    _ticket_no_re = re.compile(r"\b(INS-\d+)\b", re.IGNORECASE)

    def _resolve_ticket(self, obj):
        """
        Return the related `Ticket` if available.
        If `obj.ticket` is null, try to resolve from `obj.message` by extracting `INS-...`.
        """
        # Fast path: if the FK is present, just use it.
        if getattr(obj, "ticket_id", None):
            return getattr(obj, "ticket", None)

        # Cache lookups within this request to avoid N+1 queries.
        cache = self.context.setdefault("_notification_ticket_cache", {})

        message = getattr(obj, "message", "") or ""
        m = self._ticket_no_re.search(message)
        if not m:
            return None

        ticket_no = m.group(1).upper()
        if ticket_no in cache:
            return cache[ticket_no]

        ticket = (
            Ticket.objects.select_related("client")
            .only(
                "id",
                "ticket_no",
                "ticket_type",
                "status",
                "priority",
                "insurance_type",
                "source",
                "details",
                "additional_notes",
                "follow_up_date",
                "client__first_name",
                "client__last_name",
                "client__email",
            )
            .filter(ticket_no=ticket_no)
            .first()
        )
        cache[ticket_no] = ticket
        return ticket

    def get_ticket_created_by(self, obj):
        """
        Tell whether the underlying ticket was created by a client (public WEB/WHATSAPP)
        or by an agent (MANUAL).
        """
        ticket = self._resolve_ticket(obj)
        if not ticket:
            return None

        if ticket.source in {"WEB", "WHATSAPP"}:
            return "Client"
        if ticket.source == "MANUAL":
            return "Agent"
        return "Unknown"

    def get_ticket_no(self, obj):
        ticket = self._resolve_ticket(obj)
        return getattr(ticket, "ticket_no", None) if ticket else None

    def get_ticket_type(self, obj):
        ticket = self._resolve_ticket(obj)
        return getattr(ticket, "ticket_type", None) if ticket else None

    def get_ticket_status(self, obj):
        ticket = self._resolve_ticket(obj)
        return getattr(ticket, "status", None) if ticket else None

    def get_ticket_priority(self, obj):
        ticket = self._resolve_ticket(obj)
        return getattr(ticket, "priority", None) if ticket else None

    def get_insurance_type(self, obj):
        ticket = self._resolve_ticket(obj)
        return getattr(ticket, "insurance_type", None) if ticket else None

    def get_ticket_details(self, obj):
        ticket = self._resolve_ticket(obj)
        return getattr(ticket, "details", None) if ticket else None

    def get_ticket_additional_notes(self, obj):
        ticket = self._resolve_ticket(obj)
        return getattr(ticket, "additional_notes", None) if ticket else None

    def get_follow_up_date(self, obj):
        ticket = self._resolve_ticket(obj)
        return getattr(ticket, "follow_up_date", None) if ticket else None

    def _get_actor(self, obj):
        if obj.created_by:
            return obj.created_by

        # If message says "assigned to <username>", resolve that agent directly.
        if obj.message:
            assigned_match = re.search(r"assigned to\s+([a-zA-Z0-9_@.\-]+)", obj.message, re.IGNORECASE)
            if assigned_match:
                username = assigned_match.group(1).rstrip(".")
                assigned_user = User.objects.filter(username=username).first()
                if assigned_user:
                    return assigned_user

        if not obj.ticket_id:
            return None
        latest_activity = (
            TicketActivity.objects.filter(
                ticket_id=obj.ticket_id,
                user__isnull=False,
                created_at__lte=obj.created_at,
            )
            .select_related("user")
            .order_by("-created_at")
            .first()
        )
        if latest_activity and latest_activity.user:
            return latest_activity.user

        # Final fallback for system-generated notifications:
        # show currently assigned agent for the ticket.
        return getattr(obj.ticket, "assigned_to", None)

    def get_changed_by_name(self, obj):
        actor = self._get_actor(obj)
        if not actor:
            return None
        first_name = actor.first_name or ""
        last_name = actor.last_name or ""
        full_name = f"{first_name} {last_name}".strip()
        return full_name if full_name else actor.username

    def get_changed_by_username(self, obj):
        actor = self._get_actor(obj)
        return actor.username if actor else None

    def get_client_name(self, obj):
        ticket = self._resolve_ticket(obj)
        if not ticket or not getattr(ticket, "client", None):
            return None
        first = ticket.client.first_name or ""
        last = ticket.client.last_name or ""
        full_name = f"{first} {last}".strip()
        return full_name or None

    def get_client_email(self, obj):
        ticket = self._resolve_ticket(obj)
        if not ticket or not getattr(ticket, "client", None):
            return None
        return ticket.client.email

    class Meta:
        model = Notification
        fields = "__all__"