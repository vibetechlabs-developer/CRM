from django.contrib.auth import password_validation
from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    PERMISSION_LABELS = [
        "View Tickets",
        "Create Tickets",
        "Edit Clients",
        "Delete Records",
        "Manage Billing",
        "Export Data",
    ]

    permissions = serializers.ListField(
        child=serializers.ChoiceField(choices=PERMISSION_LABELS),
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "password",
            "first_name",
            "last_name",
            "email",
            "role",
            "preferred_insurance_types",
            "assigned_ticket_types",
            "permissions",
        ]

    def validate_password(self, value: str):
        user = self.instance if self.instance else None
        password_validation.validate_password(value, user=user)
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        role = validated_data.get("role")
        # If permissions were not provided, seed defaults based on role.
        # (If caller explicitly provides an empty list, we keep it.)
        if "permissions" not in validated_data:
            validated_data["permissions"] = (
                ["View Tickets", "Create Tickets", "Edit Clients", "Delete Records", "Manage Billing", "Export Data"]
                if role == "ADMIN"
                else ["View Tickets", "Create Tickets"]
            )
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            # Avoid creating accounts with an empty/raw password
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        # Only apply defaults when the caller didn't provide permissions.
        permissions_in_payload = "permissions" in validated_data
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])
        if not permissions_in_payload and not instance.permissions:
            instance.permissions = (
                ["View Tickets", "Create Tickets", "Edit Clients", "Delete Records", "Manage Billing", "Export Data"]
                if instance.role == "ADMIN"
                else ["View Tickets", "Create Tickets"]
            )
            instance.save(update_fields=["permissions"])
        return instance


class CurrentUserUpdateSerializer(serializers.ModelSerializer):
    """
    Limited serializer for 'my profile' updates.
    Prevents updating role/username/permissions from the self-service endpoint.
    """

    class Meta:
        model = User
        fields = ["first_name", "last_name", "email"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_new_password"]:
            raise serializers.ValidationError({"confirm_new_password": "Passwords do not match."})
        return attrs

    def validate_new_password(self, value: str):
        user = self.context.get("request").user if self.context.get("request") else None
        password_validation.validate_password(value, user=user)
        return value