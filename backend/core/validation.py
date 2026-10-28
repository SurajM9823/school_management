from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers


def handle_django_validation_error(exc: DjangoValidationError):
    """Convert a Django ValidationError into a DRF ValidationError.

    Preserve field-specific error messages when available; otherwise,
    return the messages as non-field errors.

    Args:
        exc: The Django validation error to convert.

    Raises:
        serializers.ValidationError: With structured, API-friendly error details.
    """
    if hasattr(exc, "message_dict"):
        detail = exc.message_dict
    else:
        detail = {"non_field_errors": exc.messages}

    raise serializers.ValidationError(detail)
