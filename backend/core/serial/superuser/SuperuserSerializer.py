import logging

from rest_framework import serializers

from core.models import User, School, Subscription

logger = logging.getLogger(__name__)


class SuperuserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'name', 'role', 'school', 'password', 'plaintext_password']
        extra_kwargs = {
            'email': {'required': True, 'allow_blank': False},
            'name': {'required': True, 'allow_blank': False},
            'role': {'required': True, 'allow_blank': False},
            'password': {'write_only': True, 'required': True, 'allow_blank': False},
            'school': {'required': True},
            'plaintext_password': {'write_only': False, 'required': False},
        }

    def validate(self, data):
        if data.get('role') != 'admin':
            raise serializers.ValidationError("Superuser can only create users with role 'admin'.")
        if not data.get('email') or not data.get('name') or not data.get('school'):
            raise serializers.ValidationError("Email, name, and school are required.")
        if User.objects.filter(email=data.get('email')).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return data

    def create(self, validated_data):
        email = validated_data.pop('email')
        name = validated_data.pop('name')
        role = validated_data.pop('role')
        school = validated_data.get('school')
        password = validated_data.pop('password')
        plaintext_password = validated_data.get('plaintext_password', password)
        try:
            user = User.objects.create_user(
                email=email,
                name=name,
                role=role,
                school=school,
                password=password
            )
            user.plaintext_password = plaintext_password  # Set plaintext_password after creation
            user.save()
            logger.info(f"Admin user {email} created for school {school.name} by superuser {self.context['request'].user.email}")
            return user
        except Exception as e:
            raise serializers.ValidationError(f"Failed to create admin: {str(e)}")

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['email'] = instance.email or 'unknown@example.com'
        representation['name'] = instance.name or 'Unknown'
        representation['role'] = instance.role or 'admin'
        representation['plaintext_password'] = instance.plaintext_password or 'Not set'
        return representation


class SubscriptionSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    fulfillment_status_label = serializers.CharField(source="get_fulfillment_status_display", read_only=True)

    class Meta:
        model = Subscription
        fields = [
            "id",
            "school",
            "start_date",
            "end_date",
            "status",
            "status_label",
            "fulfillment_status",
            "fulfillment_status_label",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def validate(self, attrs):
        start_date = attrs.get("start_date", self.instance.start_date if self.instance else None)
        end_date = attrs.get("end_date", self.instance.end_date if self.instance else None)

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"end_date": "End date must be after start date."})

        return attrs


class SchoolSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)
    subscription = SubscriptionSerializer(read_only=True, source='subscriptions.last')

    class Meta:
        model = School
        fields = [
            'id', 'name', 'address', 'phone', 'email', 'website',
            'academic_year', 'logo', 'founded_date', 'affiliation', 'motto',
            'is_active', 'subscription_status', 'subscription'
        ]
        read_only_fields = ['created_at', 'updated_at', 'is_active']

    def validate(self, data):
        if not data.get('name') or not data.get('email') or not data.get('phone'):
            raise serializers.ValidationError("Name, email, and phone are required.")
        if not data.get('academic_year'):
            raise serializers.ValidationError("Academic year is required.")
        if School.objects.filter(email=data.get('email')).exists():
            raise serializers.ValidationError("A school with this email already exists.")
        return data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.logo:
            representation['logo'] = instance.logo.url
        else:
            representation['logo'] = None
        return representation
