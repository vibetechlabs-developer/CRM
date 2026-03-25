import re

from rest_framework import serializers

from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    def validate_phone(self, value):
        raw = (value or '').strip()

        # Your phone input mask may leave the mask character (`|`) at the end.
        # Return a clear validation error instead of a generic 400.
        if '|' in raw:
            raise serializers.ValidationError("Phone number must not contain '|'.")

        # Allow digits and common phone formatting characters; store digits-only.
        allowed = re.compile(r'^[0-9\s\-\+\(\)\.]+$')
        if not raw or not allowed.match(raw):
            raise serializers.ValidationError(
                'Phone number must contain only digits (and characters like + - ( ) ).'
            )

        digits_only = re.sub(r'\D', '', raw)
        if not digits_only:
            raise serializers.ValidationError('Enter a valid phone number.')

        # Support inputs like "(121)123123" (9 digits) and keep an upper bound for storage.
        if len(digits_only) < 9 or len(digits_only) > 15:
            raise serializers.ValidationError('Phone number must be between 9 and 15 digits.')

        return digits_only

    class Meta:
        model = Client
        # Expose all fields, but mark identifiers and system fields as read-only
        fields = "__all__"
        read_only_fields = (
            'id',
            'client_id',
            'created_at',
            'updated_at',
            'last_interaction_date',
        )
