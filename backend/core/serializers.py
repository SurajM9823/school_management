from rest_framework import serializers
from .models import User, School, LocaleSettings, AcademicSession, Term, Holiday, GradingSettings, AttendanceSettings, FeeSettings, NotificationSettings, NotificationTemplate, StaffRole, LeaveType, Department, BulkLeaveAssignment, Subject, GradingScale, PromotionRules, ClassCapacity, Campus, Building, Room, Resource, FeeType, Section, Class
from django.contrib.auth.models import Group, Permission
import logging

logger = logging.getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'avatar']


class SchoolSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = School
        fields = [
            'school_id', 'name', 'address', 'phone', 'email', 'website',
            'academic_year', 'logo', 'founded_date', 'affiliation', 'motto'
        ]
        read_only_fields = ['school_id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.logo:
            representation['logo'] = instance.logo.url
        else:
            representation['logo'] = None
        return representation


class LocaleSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocaleSettings
        fields = ['timezone', 'language', 'date_format', 'time_format', 'currency_code', 'currency_symbol', 'first_day_of_week']


class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ['id', 'name', 'start_date', 'end_date', 'is_active', 'session_id']

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date")
        return data

    def create(self, validated_data):
        session_id = self.context.get('session_id')
        if not session_id:
            raise serializers.ValidationError("session_id is required")
        validated_data['session_id'] = session_id
        return super().create(validated_data)

class HolidaySerializer(serializers.ModelSerializer):
    session_id = serializers.IntegerField(write_only=True)  # Explicitly define session_id for input

    class Meta:
        model = Holiday
        fields = ['id', 'name', 'start_date', 'end_date', 'holiday_type', 'holiday_category', 'is_active', 'session_id']

    def validate(self, data):
        if data.get('end_date') and data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date")
        return data

    def create(self, validated_data):
        session_id = validated_data.pop('session_id')  # Extract session_id from validated data
        try:
            session = AcademicSession.objects.get(id=session_id)
        except AcademicSession.DoesNotExist:
            raise serializers.ValidationError("Invalid session_id")
        validated_data['session'] = session  # Map to the session ForeignKey
        return super().create(validated_data)

class AcademicSessionSerializer(serializers.ModelSerializer):
    def validate_status(self, value):
        valid_choices = [choice[0] for choice in AcademicSession._meta.get_field('status').choices]
        if value not in valid_choices:
            raise serializers.ValidationError(f"Invalid status. Must be one of: {valid_choices}")
        return value

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date")
        return data

    class Meta:
        model = AcademicSession
        fields = ['id', 'name', 'status', 'start_date', 'end_date']

class GradingSettingsSerializer(serializers.ModelSerializer):
    grading_system = serializers.CharField(source='grading_type')
    passing_percentage = serializers.CharField(source='default_passing_grade')

    class Meta:
        model = GradingSettings
        fields = ['grading_system', 'passing_percentage', 'grade_ranges']

    def validate(self, data):
        grading_type = data.get('grading_type', self.instance.grading_type if self.instance else None)
        passing_grade = data.get('default_passing_grade')
        if grading_type == 'percentage':
            try:
                value = float(passing_grade)
                if not (0 <= value <= 100):
                    raise serializers.ValidationError("Passing percentage must be between 0 and 100")
            except ValueError:
                raise serializers.ValidationError("Invalid percentage value")
        elif grading_type == 'gpa':
            try:
                value = float(passing_grade)
                if not (0 <= value <= 4.0):
                    raise serializers.ValidationError("GPA must be between 0 and 4.0")
            except ValueError:
                raise serializers.ValidationError("Invalid GPA value")
        elif grading_type == 'letter':
            valid_letters = ['A', 'B', 'C', 'D', 'F']
            if passing_grade not in valid_letters:
                raise serializers.ValidationError(f"Letter grade must be one of {valid_letters}")
        return data
    
class AttendanceSettingsSerializer(serializers.ModelSerializer):
    attendance_type = serializers.CharField(source='marking_scheme')
    minimum_attendance = serializers.IntegerField(source='min_attendance_percentage')

    class Meta:
        model = AttendanceSettings
        fields = ['attendance_type', 'default_marking', 'custom_statuses', 'minimum_attendance', 'auto_notification', 'notification_threshold']

    def validate(self, data):
        marking_scheme = data.get('marking_scheme', self.instance.marking_scheme if self.instance else None)
        custom_statuses = data.get('custom_statuses')
        if marking_scheme == 'custom' and not custom_statuses:
            raise serializers.ValidationError("Custom statuses are required for custom marking scheme")
        return data

class FeeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeType
        fields = ['id', 'name', 'default_amount', 'is_mandatory']

class FeeSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeSettings
        fields = ['due_date', 'late_fee_type', 'late_fee_amount', 'reminder_days']



class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        fields = [
            'smtp_host',
            'smtp_port',
            'smtp_username',
            'smtp_password',
            'smtp_encryption',
            'from_email',
            'from_name',
            'sms_provider',
            'sms_api_key',
            'sms_sender_id',
            'updated_at'
        ]
        read_only_fields = ['updated_at']
        extra_kwargs = {
            'smtp_password': {'write_only': True},
            'sms_api_key': {'write_only': True}
        }

class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = ['template_id', 'name', 'content', 'is_active']

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename']

class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions']


class StaffRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffRole
        fields = ['id', 'name', 'is_active']

    def create(self, validated_data):
        role = super().create(validated_data)
        logger.info(f"Staff role '{role.name}' created by user {self.context['request'].user}")
        return role

    def update(self, instance, validated_data):
        role = super().update(instance, validated_data)
        logger.info(f"Staff role '{role.name}' updated by user {self.context['request'].user}")
        return role

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = [
            'id', 'name', 'default_days', 'unit', 'allow_carry_over',
            'max_carry_over_days', 'paid_status', 'applicable_gender', 'leave_for',
            'is_system_leave', 'is_active'
        ]

    def validate(self, data):
        leave_for = data.get('leave_for', 'staff')
        paid_status = data.get('paid_status')
        allow_carry_over = data.get('allow_carry_over')
        max_carry_over_days = data.get('max_carry_over_days')

        if leave_for == 'staff' and not paid_status:
            raise serializers.ValidationError({
                'paid_status': 'Paid status is required for staff leave types.'
            })
        if leave_for == 'students':
            data['paid_status'] = None
        if allow_carry_over and max_carry_over_days is None:
            raise serializers.ValidationError({
                'max_carry_over_days': 'Max carry over days is required when carry over is allowed.'
            })
        if not allow_carry_over:
            data['max_carry_over_days'] = None
        if data.get('default_days') < 0:
            raise serializers.ValidationError({
                'default_days': 'Default days cannot be negative.'
            })

        return data

    def create(self, validated_data):
        leave_type = super().create(validated_data)
        logger.info(f"Leave type '{leave_type.name}' created for {leave_type.leave_for} by user {self.context['request'].user}")
        return leave_type

    def update(self, instance, validated_data):
        if instance.is_system_leave:
            raise serializers.ValidationError({
                'non_field_errors': 'System leave types cannot be modified.'
            })
        leave_type = super().update(instance, validated_data)
        logger.info(f"Leave type '{leave_type.name}' updated for {leave_type.leave_for} by user {self.context['request'].user}")
        return leave_type
    
class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'is_active']

    def create(self, validated_data):
        dept = super().create(validated_data)
        logger.info(f"Department '{dept.name}' created by user {self.context['request'].user}")
        return dept

    def update(self, instance, validated_data):
        dept = super().update(instance, validated_data)
        logger.info(f"Department '{dept.name}' updated by user {self.context['request'].user}")
        return dept

class BulkLeaveAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkLeaveAssignment
        fields = ['id', 'leave_type', 'target_group', 'days', 'start_date', 'end_date', 'reason']

class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ['id', 'name', 'max_capacity', 'is_active']
        extra_kwargs = {
            'is_active': {'read_only': True}
        }

    def validate(self, data):
        if data['max_capacity'] < 1:
            raise serializers.ValidationError({'max_capacity': 'Maximum capacity must be at least 1.'})
        return data

    def create(self, validated_data):
        class_obj = super().create(validated_data)
        logger.info(f"Class '{class_obj.name}' created by user {self.context['request'].user}")
        return class_obj

    def update(self, validated_data):
        class_obj = super().update(validated_data)
        logger.info(f"Class '{class_obj.name}' updated by user {self.context['request'].user}")
        return class_obj

class SectionSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_id.name', read_only=True)

    class Meta:
        model = Section
        fields = ['id', 'name', 'class_id', 'class_name', 'max_capacity', 'is_active']
        extra_kwargs = {
            'is_active': {'read_only': True}
        }

    def validate(self, data):
        if data.get('max_capacity') and data['max_capacity'] < 1:
            raise serializers.ValidationError({'max_capacity': 'Maximum capacity must be at least 1.'})
        return data

    def create(self, validated_data):
        section = super().create(validated_data)
        logger.info(f"Section '{section.name}' for class '{section.class_id.name}' created by user {self.context['request'].user}")
        return section

    def update(self, instance, validated_data):
        section = super().update(instance, validated_data)
        logger.info(f"Section '{section.name}' for class '{section.class_id.name}' updated by user {self.context['request'].user}")
        return section
    

class SubjectSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    class_ids = serializers.PrimaryKeyRelatedField(many=True, queryset=Class.objects.filter(is_active=True), source='classes')

    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'subject_type', 'class_ids', 'is_active']
        extra_kwargs = {
            'subject_type': {'required': True, 'allow_blank': False},
            'is_active': {'read_only': True}
        }

    def create(self, validated_data):
        classes = validated_data.pop('classes', [])
        subject = super().create(validated_data)
        subject.classes.set(classes)
        logger.info(f"Subject '{subject.name}' created with classes {classes} by user {self.context['request'].user}")
        return subject

    def update(self, instance, validated_data):
        classes = validated_data.pop('classes', None)
        subject = super().update(instance, validated_data)
        if classes is not None:
            subject.classes.set(classes)
        logger.info(f"Subject '{subject.name}' updated with classes {classes} by user {self.context['request'].user}")
        return subject
    

class GradingScaleSerializer(serializers.ModelSerializer):
    scale_id = serializers.IntegerField(source='pk', read_only=True)
    min_score = serializers.SerializerMethodField()
    max_score = serializers.SerializerMethodField()

    class Meta:
        model = GradingScale
        fields = ['scale_id', 'grade', 'min_score', 'max_score', 'gpa', 'description', 'is_active']
        extra_kwargs = {
            'percentage_range': {'write_only': True},
            'is_active': {'read_only': True}
        }

    def get_min_score(self, obj):
        try:
            min_score, _ = map(float, obj.percentage_range.replace('%', '').split('-'))
            return int(min_score)
        except:
            return 0

    def get_max_score(self, obj):
        try:
            _, max_score = map(float, obj.percentage_range.replace('%', '').split('-'))
            return int(max_score)
        except:
            return 100

    def validate(self, data):
        min_score = self.context['request'].data.get('min_score')
        max_score = self.context['request'].data.get('max_score')
        if min_score is not None and max_score is not None:
            if int(min_score) >= int(max_score):
                raise serializers.ValidationError({'min_score': 'Min score must be less than max score.'})
            data['percentage_range'] = f"{min_score}-{max_score}%"
        return data
    
class PromotionRulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionRules
        fields = ['min_overall_percentage', 'max_failed_subjects', 'consider_attendance', 'updated_at']
        read_only_fields = ['updated_at']

class ClassCapacitySerializer(serializers.ModelSerializer):
    max_students = serializers.IntegerField(source='max_capacity')
    min_students = serializers.IntegerField(source='default_capacity')

    class Meta:
        model = ClassCapacity
        fields = ['max_students', 'min_students', 'updated_at']
        read_only_fields = ['updated_at']

    def to_internal_value(self, data):
        data = data.copy()
        data['max_capacity'] = data.get('max_students')
        data['default_capacity'] = data.get('min_students')
        return super().to_internal_value(data)
    
class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'capacity', 'room_type', 'is_active']

class BuildingSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)

    class Meta:
        model = Building
        fields = ['id', 'name', 'is_active', 'rooms']

class CampusSerializer(serializers.ModelSerializer):
    buildings = BuildingSerializer(many=True, read_only=True)

    class Meta:
        model = Campus
        fields = ['id', 'name', 'address', 'contact_person', 'is_active', 'buildings']

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'name', 'total_count', 'available_count', 'is_active']