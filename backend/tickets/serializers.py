from rest_framework import serializers
from .models import Ticket, TicketActivity


class TicketSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.first_name', read_only=True)
    client_last_name = serializers.CharField(source='client.last_name', read_only=True)
    client_email = serializers.EmailField(source='client.email', read_only=True)
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


class TicketActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketActivity
        fields = '__all__'