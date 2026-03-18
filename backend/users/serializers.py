from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
            "preferred_insurance_types",
            "assigned_ticket_types",
            "permissions",
        ]
        
    permissions = serializers.SerializerMethodField()
    
    def get_permissions(self, obj):
        # Placeholder for frontend compatibility
        if obj.role == "ADMIN":
            return ["Full System Access"]
        return ["View Tickets", "Create Tickets"]