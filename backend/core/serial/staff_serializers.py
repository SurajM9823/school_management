import logging
from rest_framework import serializers
from core.serial.admin.staffmanagement.StaffLeaveSerializer import StaffLeaveSerializer
from core.serializers import ClassSerializer, DepartmentSerializer, SchoolSerializer, StaffRoleSerializer, SubjectSerializer
from core.models import Staff, User, School, StaffRole, Department, Class, Subject
from uuid import UUID
from datetime import date

logger = logging.getLogger(__name__)

class StaffSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    school = SchoolSerializer(read_only=True)
    staff_role = StaffRoleSerializer(read_only=True, allow_null=True)
    department = DepartmentSerializer(read_only=True, allow_null=True)
    classes = ClassSerializer(many=True, read_only=True)
    subjects = SubjectSerializer(many=True, read_only=True)
    leaves = StaffLeaveSerializer(many=True, read_only=True)
    staff_role_id = serializers.PrimaryKeyRelatedField(
        queryset=StaffRole.objects.filter(is_active=True),
        required=True,
        write_only=True,
        source='staff_role'
    )
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.filter(is_active=True),
        required=True,
        write_only=True,
        source='department'
    )
    classes_ids = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.filter(is_active=True),
        many=True,
        required=False,
        write_only=True,
        source='classes'
    )
    subjects_ids = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.filter(is_active=True),
        many=True,
        required=False,
        write_only=True,
        source='subjects'
    )
    school_id = serializers.UUIDField(required=True, write_only=True)
    profile_image = serializers.SerializerMethodField()
    user_email = serializers.EmailField(write_only=True, required=True, source='user.email')
    user_name = serializers.CharField(write_only=True, required=True, source='user.name')
    user_role = serializers.ChoiceField(
        write_only=True,
        required=True,
        choices=User.ROLE_CHOICES,
        source='user.role'
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.context.get('request') and self.context['request'].method in ['PUT', 'PATCH']:
            for field in self.fields.values():
                field.required = False

    def get_user(self, obj):
        return {
            'email': obj.user.email,
            'name': obj.user.name,
            'role': obj.user.role,
            'avatar': obj.user.avatar.url if obj.user.avatar else None
        }

    def get_profile_image(self, obj):
        if obj.profile_image and self.context.get('request'):
            return self.context['request'].build_absolute_uri(obj.profile_image.url)
        return None

    def validate(self, data):
        logger.info(f"Validating staff data: {data}")
        school_id = data.get('school_id')
        if not school_id:
            raise serializers.ValidationError({"school_id": "School ID is required."})
        try:
            UUID(str(school_id))
            School.objects.get(school_id=school_id)
            logger.info(f"Found school with school_id: {school_id}")
        except School.DoesNotExist:
            raise serializers.ValidationError({"school_id": f"Invalid school ID: {school_id}"})
        except ValueError:
            raise serializers.ValidationError({"school_id": f"Invalid UUID format: {school_id}"})

        hire_date = data.get('hire_date')
        if hire_date and hire_date > date.today():
            raise serializers.ValidationError({"hire_date": "Hire date cannot be in the future."})

        valid_statuses = ['active', 'inactive', 'on_leave', 'terminated']
        if data.get('status') and data['status'] not in valid_statuses:
            raise serializers.ValidationError({"status": f"Invalid status. Must be one of: {valid_statuses}"})

        user_data = data.get('user', {})
        if self.context['request'].method == 'POST':
            if not all([user_data.get('email'), user_data.get('name'), user_data.get('role')]):
                raise serializers.ValidationError({"user": "Email, name, and role are required for new staff."})
            if User.objects.filter(email=user_data['email']).exists():
                raise serializers.ValidationError({"user_email": "A user with this email already exists."})

        return data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['user_name'] = instance.user.name
        representation['user_email'] = instance.user.email
        representation['user_role'] = instance.user.role
        representation['department_name'] = instance.department.name if instance.department else ''
        representation['subjects_names'] = [subject['name'] for subject in representation['subjects']] if representation['subjects'] else []
        return representation

    def create(self, validated_data):
        logger.info(f"Creating staff with validated data: {validated_data}")
        try:
            user_data = validated_data.pop('user', {})
            classes = validated_data.pop('classes', [])
            subjects = validated_data.pop('subjects', [])
            school_id = validated_data.pop('school_id')
            staff_role = validated_data.pop('staff_role', None)
            department = validated_data.pop('department', None)

            user = User.objects.create_user(
                email=user_data['email'],
                name=user_data['name'],
                role=user_data['role'],
                password=Staff.generate_credentials()
            )
            logger.info(f"Created user: {user.email}")

            school = School.objects.get(school_id=school_id)
            staff = Staff.objects.create(
                user=user,
                school=school,
                staff_role=staff_role,
                department=department,
                **validated_data
            )
            logger.info(f"Created staff: ID={staff.id}, School ID={school_id}")

            if classes:
                staff.classes.set(classes)
                logger.info(f"Set classes: {[cls.id for cls in classes]}")
            if subjects:
                staff.subjects.set(subjects)
                logger.info(f"Set subjects: {[sub.id for sub in subjects]}")

            return staff
        except Exception as e:
            logger.exception(f"Error creating staff: {str(e)}")
            raise serializers.ValidationError(f"Failed to create staff: {str(e)}")

    def update(self, instance, validated_data):
        logger.info(f"Updating staff ID: {instance.id} with validated_data: {validated_data}")
        try:
            user_data = validated_data.pop('user', None)
            if user_data:
                instance.user.email = user_data.get('email', instance.user.email)
                instance.user.name = user_data.get('name', instance.user.name)
                instance.user.role = user_data.get('role', instance.user.role)
                instance.user.save()
                logger.info(f"Updated user: {instance.user.email}")

            classes = validated_data.pop('classes', None)
            subjects = validated_data.pop('subjects', None)
            school_id = validated_data.pop('school_id', None)
            staff_role = validated_data.pop('staff_role', None)
            department = validated_data.pop('department', None)

            if school_id:
                instance.school = School.objects.get(school_id=school_id)
                logger.info(f"Updated school: {school_id}")

            if staff_role:
                instance.staff_role = staff_role
            if department:
                instance.department = department
            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            if classes is not None:
                instance.classes.set(classes)
                logger.info(f"Updated classes: {[cls.id for cls in classes]}")
            if subjects is not None:
                instance.subjects.set(subjects)
                logger.info(f"Updated subjects: {[sub.id for sub in subjects]}")

            instance.save()
            logger.info(f"Staff updated: ID={instance.id}")
            return instance
        except Exception as e:
            logger.exception(f"Error updating staff: {str(e)}")
            raise serializers.ValidationError(f"Failed to update staff: {str(e)}")

    class Meta:
        model = Staff
        fields = [
            'id', 'user', 'school', 'school_id', 'staff_role', 'staff_role_id',
            'department', 'department_id', 'employee_id', 'first_name', 'last_name',
            'date_of_birth', 'gender', 'address', 'phone', 'emergency_contact_name',
            'emergency_contact_phone', 'hire_date', 'employment_type', 'contract_end_date',
            'status', 'classes', 'classes_ids', 'subjects', 'subjects_ids', 'base_salary',
            'pay_frequency', 'tax_status', 'allowances', 'deductions', 'bank_account_number',
            'bank_name', 'bank_branch', 'health_insurance_number', 'pension_plan_number',
            'provident_fund_number', 'generated_password', 'created_at', 'updated_at',
            'profile_image', 'leaves', 'user_email', 'user_name', 'user_role'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'employee_id', 'generated_password']
        extra_kwargs = {
            'first_name': {'required': True, 'allow_blank': False},
            'last_name': {'required': True, 'allow_blank': False},
            'hire_date': {'required': True},
            'status': {'required': True},
        }