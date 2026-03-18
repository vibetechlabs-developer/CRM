from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):

    class Meta:
        model = Client
        # Expose all fields, but mark identifiers and system fields as read-only
        fields = "__all__"
        read_only_fields = (
            "id",
            "client_id",
            "created_at",
            "updated_at",
            "last_interaction_date",
        )