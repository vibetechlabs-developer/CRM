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

    # Ticket-related fields so the frontend can show "what ticket is this?" quickly.
    ticket_no = serializers.CharField(source="ticket.ticket_no", read_only=True)
    ticket_type = serializers.CharField(source="ticket.ticket_type", read_only=True)
    ticket_status = serializers.CharField(source="ticket.status", read_only=True)
    ticket_priority = serializers.CharField(source="ticket.priority", read_only=True)
    insurance_type = serializers.CharField(source="ticket.insurance_type", read_only=True)
    ticket_details = serializers.JSONField(source="ticket.details", read_only=True)
    ticket_additional_notes = serializers.CharField(
        source="ticket.additional_notes",
        read_only=True,
    )
    follow_up_date = serializers.DateTimeField(source="ticket.follow_up_date", read_only=True)
    client_name = serializers.SerializerMethodField()
    client_email = serializers.SerializerMethodField()

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
        if not getattr(obj, "ticket", None) or not getattr(obj.ticket, "client", None):
            return None
        first = obj.ticket.client.first_name or ""
        last = obj.ticket.client.last_name or ""
        full_name = f"{first} {last}".strip()
        return full_name or None

    def get_client_email(self, obj):
        if not getattr(obj, "ticket", None) or not getattr(obj.ticket, "client", None):
            return None
        return obj.ticket.client.email

    class Meta:
        model = Notification
        fields = "__all__"