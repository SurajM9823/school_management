from rest_framework import serializers

class ChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(
        required=True,
        min_length=8,
        max_length=128,
        write_only=True,
        error_messages={
            'min_length': 'Password must be at least 8 characters long.',
            'required': 'New password is required.'
        }
    )

    def validate_new_password(self, value):
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError('Password must contain at least one digit.')
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter.')
        return value