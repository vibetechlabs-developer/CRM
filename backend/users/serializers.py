from django.contrib.auth import password_validation
from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

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
        
    permissions = serializers.SerializerMethodField()
    
    def get_permissions(self, obj):
        # Placeholder for frontend compatibility
        if obj.role == "ADMIN":
            return ["Full System Access"]
        return ["View Tickets", "Create Tickets"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
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
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password"])
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