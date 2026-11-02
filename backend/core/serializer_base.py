from rest_framework import serializers


class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    """
    A ModelSerializer that supports dynamic field selection and exclusion.

    Accepts two additional arguments:
        fields: An optional list of field names to include.
        exclude: An optional list of field names to exclude.

    If fields is provided, only the specified fields are included.
    Fields specified in exclude are removed from the serializer.
    """

    def __init__(self, *args, **kwargs):
        # Don't pass the 'fields' and 'exclude' arg up to the superclass
        fields = kwargs.pop("fields", None)
        exclude = kwargs.pop("exclude", None)

        # Instantiate the superclass normally
        super().__init__(*args, **kwargs)

        if fields is not None:
            # Drop any fields that are not specified in the `fields` argument.
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)

        if exclude is not None:
            # Drop fields specified in the 'exclude' argument.
            for field_name in exclude:
                self.fields.pop(field_name, None)
