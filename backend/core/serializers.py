from core.serial.admin.teacher_assignment_serializer import ClassTeacherSerializer
from rest_framework import serializers
from .models import User, School, LocaleSettings, AcademicSession, Term, Holiday, GradingSettings, AttendanceSettings, FeeSettings, NotificationSettings, NotificationTemplate, StaffRole, LeaveType, Department, BulkLeaveAssignment, Subject, GradingScale, PromotionRules, ClassCapacity, Campus, Building, Room, Resource, FeeType, Section, Class
from django.contrib.auth.models import Group, Permission
import logging

logger = logging.getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):
    school = serializers.SerializerMethodField()  # Add custom field for school

    class Meta:
        model = User
        fields = ['email', 'name', 'role', 'avatar', 'is_active', 'school', 'is_superuser']
        read_only_fields = ['is_active', 'avatar', 'is_superuser']
        extra_kwargs = {
            'email': {'required': True, 'allow_blank': False},
            'name': {'required': True, 'allow_blank': False},
            'role': {'required': True, 'allow_blank': False},
        }

    def get_school(self, obj):
        if obj.school:
            # Return school_id without hyphens
            return str(obj.school.school_id).replace('-', '')
        return None

    def validate(self, data):
        logger.debug(f"UserSerializer validate data: {data}")
        if not data.get('email') or not data.get('name') or not data.get('role'):
            raise serializers.ValidationError("Email, name, and role are required.")
        if self.context['request'].method == 'POST' and User.objects.filter(email=data.get('email')).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return data

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Provide fallbacks for null values
        representation['email'] = instance.email or 'unknown@example.com'
        representation['name'] = instance.name or 'Unknown'
        representation['role'] = instance.role or 'unknown'
        representation['is_superuser'] = instance.is_superuser
        return representation

    def create(self, validated_data):
        email = validated_data.pop('email')
        name = validated_data.pop('name')
        role = validated_data.pop('role')
        school = validated_data.get('school')
        password = validated_data.get('password', User.objects.make_random_password())
        try:
            user = User.objects.create_user(
                email=email,
                name=name,
                role=role,
                school=school,
                password=password
            )
            return user
        except Exception as e:
            logger.error(f"User creation error: {str(e)}")
            raise serializers.ValidationError(f"Failed to create user: {str(e)}")
        
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
        fields = [
            'timezone', 'language', 'date_format', 'time_format',
            'currency_code', 'currency_symbol', 'first_day_of_week', 'school'
        ]
        read_only_fields = ['school']

    def validate(self, data):
        logger.debug(f"LocaleSettingsSerializer validate data: {data}")
        # Add any custom validation if needed
        return data
    
class AcademicSessionSerializer(serializers.ModelSerializer):
    school_id = serializers.CharField(write_only=True, required=False)  # Allow school_id input if needed

    class Meta:
        model = AcademicSession
        fields = ['id', 'name', 'status', 'start_date', 'end_date', 'school_id']
        read_only_fields = ['school_id']  # Make school_id read-only after creation

    def validate_status(self, value):
        valid_choices = [choice[0] for choice in AcademicSession._meta.get_field('status').choices]
        if value not in valid_choices:
            raise serializers.ValidationError(f"Invalid status. Must be one of: {valid_choices}")
        return value

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date")
        return data

    def create(self, validated_data):
        validated_data.pop('school_id', None)  # Remove school_id if provided
        request = self.context.get('request')
        school = request.user.school
        if not school:
            raise serializers.ValidationError("User is not associated with any school")
        validated_data['school'] = school
        return super().create(validated_data)

class TermSerializer(serializers.ModelSerializer):
    session_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Term
        fields = ['id', 'name', 'start_date', 'end_date', 'is_active', 'session_id']
        read_only_fields = ['school']

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date")
        return data

    def create(self, validated_data):
        session_id = validated_data.pop('session_id')
        request = self.context.get('request')
        school = request.user.school
        if not school:
            raise serializers.ValidationError("User is not associated with any school")
        try:
            session = AcademicSession.objects.get(id=session_id, school=school)
        except AcademicSession.DoesNotExist:
            raise serializers.ValidationError("Invalid session_id or session does not belong to your school")
        validated_data['session'] = session
        validated_data['school'] = school
        return super().create(validated_data)

class HolidaySerializer(serializers.ModelSerializer):
    session_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Holiday
        fields = ['id', 'name', 'start_date', 'end_date', 'holiday_type', 'holiday_category', 'is_active', 'session_id']
        read_only_fields = ['school']

    def validate(self, data):
        if data.get('end_date') and data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date")
        return data

    def create(self, validated_data):
        session_id = validated_data.pop('session_id')
        request = self.context.get('request')
        school = request.user.school
        if not school:
            raise serializers.ValidationError("User is not associated with any school")
        try:
            session = AcademicSession.objects.get(id=session_id, school=school)
        except AcademicSession.DoesNotExist:
            raise serializers.ValidationError("Invalid session_id or session does not belong to your school")
        validated_data['session'] = session
        validated_data['school'] = school
        return super().create(validated_data)


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
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        validated_data['school'] = school
        role = super().create(validated_data)
        logger.info(f"Staff role '{role.name}' created by user {self.context['request'].user} for school {school}")
        return role

    def update(self, instance, validated_data):
        if instance.school != self.context['request'].user.school:
            raise serializers.ValidationError({"error": "Cannot modify roles from another school"})
        role = super().update(instance, validated_data)
        logger.info(f"Staff role '{role.name}' updated by user {self.context['request'].user} for school {instance.school}")
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
        if data.get('default_days') and data.get('default_days') < 0:
            raise serializers.ValidationError({
                'default_days': 'Default days cannot be negative.'
            })

        return data

    def create(self, validated_data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        validated_data['school'] = school
        leave_type = super().create(validated_data)
        logger.info(f"Leave type '{leave_type.name}' created for {leave_type.leave_for} by user {self.context['request'].user} for school {school}")
        return leave_type

    def update(self, instance, validated_data):
        if instance.school != self.context['request'].user.school:
            raise serializers.ValidationError({"error": "Cannot modify leave types from another school"})
        if instance.is_system_leave:
            raise serializers.ValidationError({
                'non_field_errors': 'System leave types cannot be modified.'
            })
        leave_type = super().update(instance, validated_data)
        logger.info(f"Leave type '{leave_type.name}' updated for {leave_type.leave_for} by user {self.context['request'].user} for school {instance.school}")
        return leave_type

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'is_active']

    def create(self, validated_data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        validated_data['school'] = school
        dept = super().create(validated_data)
        logger.info(f"Department '{dept.name}' created by user {self.context['request'].user} for school {school}")
        return dept

    def update(self, instance, validated_data):
        if instance.school != self.context['request'].user.school:
            raise serializers.ValidationError({"error": "Cannot modify departments from another school"})
        dept = super().update(instance, validated_data)
        logger.info(f"Department '{dept.name}' updated by user {self.context['request'].user} for school {instance.school}")
        return dept
    
class BulkLeaveAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkLeaveAssignment
        fields = ['id', 'leave_type', 'target_group', 'days', 'start_date', 'end_date', 'reason']


class ClassSerializer(serializers.ModelSerializer):
    teachers = serializers.SerializerMethodField()
    subjects = serializers.SerializerMethodField()
    current_capacity = serializers.SerializerMethodField()
    
    def get_teachers(self, obj):
        latest_teacher = obj.class_teachers.filter(is_active=True).order_by('-created_at').first()
        return ClassTeacherSerializer([latest_teacher], many=True).data if latest_teacher else []

    def get_subjects(self, obj):
        subjects = obj.subjects.filter(is_active=True)
        return SubjectSerializer(subjects, many=True).data
    
    def get_current_capacity(self, obj):
        from core.models import Student
        return Student.objects.filter(class_id=obj, status='active').count()

    class Meta:
        model = Class
        fields = ['id', 'name', 'max_capacity', 'current_capacity', 'is_active', 'teachers', 'subjects']
        extra_kwargs = {
            'is_active': {'read_only': True}
        }

    def validate(self, data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        if 'max_capacity' in data and data['max_capacity'] is not None and data['max_capacity'] < 1:
            raise serializers.ValidationError({'max_capacity': 'Maximum capacity must be at least 1.'})
        name = data.get('name')
        if name:
            instance_id = getattr(self.instance, 'id', None)
            if Class.objects.filter(school=school, name=name, is_active=True).exclude(id=instance_id).exists():
                raise serializers.ValidationError({'name': f"Class name '{name}' already exists for this school."})
        return data

    def create(self, validated_data):
        school = self.context['request'].user.school
        validated_data['school'] = school
        class_obj = super().create(validated_data)
        logger.info(f"Class '{class_obj.name}' created by user {self.context['request'].user} for school {school}")
        return class_obj

    def update(self, instance, validated_data):
        school = self.context['request'].user.school
        if instance.school != school:
            raise serializers.ValidationError({"error": "Cannot update class from another school"})
        class_obj = super().update(instance, validated_data)
        logger.info(f"Class '{class_obj.name}' updated by user {self.context['request'].user} for school {school}")
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
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        if data.get('max_capacity') and data['max_capacity'] < 1:
            raise serializers.ValidationError({'max_capacity': 'Maximum capacity must be at least 1.'})
        # Validate class_id belongs to the user's school
        class_id = data.get('class_id') or (self.instance.class_id if self.instance else None)
        if class_id and not Class.objects.filter(id=class_id.id, school=school, is_active=True).exists():
            raise serializers.ValidationError({'class_id': 'Invalid class for this school.'})
        # Check unique section name per class
        name = data.get('name')
        if name and class_id:
            instance_id = getattr(self.instance, 'id', None)
            if Section.objects.filter(name=name, class_id=class_id, is_active=True).exclude(id=instance_id).exists():
                raise serializers.ValidationError({'name': f"Section name '{name}' already exists for this class."})
        return data

    def create(self, validated_data):
        school = self.context['request'].user.school
        validated_data['school'] = school
        section = super().create(validated_data)
        logger.info(f"Section '{section.name}' for class '{section.class_id.name}' created by user {self.context['request'].user} for school {school}")
        return section

    def update(self, instance, validated_data):
        school = self.context['request'].user.school
        if instance.school != school:
            raise serializers.ValidationError({"error": "Cannot update section from another school"})
        section = super().update(instance, validated_data)
        logger.info(f"Section '{section.name}' for class '{section.class_id.name}' updated by user {self.context['request'].user} for school {school}")
        return section

class SubjectSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    class_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Class.objects.filter(is_active=True),
        source='classes'
    )

    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'subject_type', 'class_ids', 'is_active']
        extra_kwargs = {
            'subject_type': {'required': True, 'allow_blank': False},
            'is_active': {'read_only': True}
        }

    def validate(self, data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        # Validate classes belong to the user's school
        classes = data.get('classes', [])
        if classes:
            invalid_classes = [cls.id for cls in classes if not Class.objects.filter(id=cls.id, school=school, is_active=True).exists()]
            if invalid_classes:
                raise serializers.ValidationError({'class_ids': f"Classes {invalid_classes} are invalid or not part of this school."})
        # Check unique code per school
        code = data.get('code')
        if code:
            instance_id = getattr(self.instance, 'id', None)
            if Subject.objects.filter(school=school, code=code, is_active=True).exclude(id=instance_id).exists():
                raise serializers.ValidationError({'code': f"Subject code '{code}' already exists for this school."})
        return data

    def create(self, validated_data):
        school = self.context['request'].user.school
        classes = validated_data.pop('classes', [])
        validated_data['school'] = school
        subject = super().create(validated_data)
        subject.classes.set(classes)
        logger.info(f"Subject '{subject.name}' created with classes {[c.id for c in classes]} by user {self.context['request'].user} for school {school}")
        return subject

    def update(self, instance, validated_data):
        school = self.context['request'].user.school
        if instance.school != school:
            raise serializers.ValidationError({"error": "Cannot update subject from another school"})
        classes = validated_data.pop('classes', None)
        subject = super().update(instance, validated_data)
        if classes is not None:
            subject.classes.set(classes)
        logger.info(f"Subject '{subject.name}' updated with classes {[c.id for c in classes or []]} by user {self.context['request'].user} for school {school}")
        return subject

class GradingScaleSerializer(serializers.ModelSerializer):
    scale_id = serializers.IntegerField(source='pk', read_only=True)
    min_score = serializers.IntegerField(write_only=True)
    max_score = serializers.IntegerField(write_only=True)

    class Meta:
        model = GradingScale
        fields = ['scale_id', 'grade', 'min_score', 'max_score', 'gpa', 'description', 'is_active']
        extra_kwargs = {
            'percentage_range': {'read_only': True},
            'is_active': {'read_only': True}
        }

    def validate(self, data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        min_score = data.get('min_score')
        max_score = data.get('max_score')
        if min_score is not None and max_score is not None:
            if min_score >= max_score:
                raise serializers.ValidationError({'min_score': 'Min score must be less than max score.'})
            data['percentage_range'] = f"{min_score}-{max_score}%"
        return data

    def create(self, validated_data):
        school = self.context['request'].user.school
        # Remove write-only fields that don't exist in the model
        validated_data.pop('min_score', None)
        validated_data.pop('max_score', None)
        validated_data['school'] = school
        scale = super().create(validated_data)
        logger.info(f"Grading scale '{scale.grade}' created by user {self.context['request'].user} for school {school}")
        return scale

    def update(self, instance, validated_data):
        school = self.context['request'].user.school
        if instance.school != school:
            raise serializers.ValidationError({"error": "Cannot update grading scale from another school"})
        # Remove write-only fields that don't exist in the model
        validated_data.pop('min_score', None)
        validated_data.pop('max_score', None)
        scale = super().update(instance, validated_data)
        logger.info(f"Grading scale '{scale.grade}' updated by user {self.context['request'].user} for school {school}")
        return scale

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        try:
            min_score, max_score = map(float, instance.percentage_range.replace('%', '').split('-'))
            ret['min_score'] = int(min_score)
            ret['max_score'] = int(max_score)
        except:
            ret['min_score'] = 0
            ret['max_score'] = 100
        return ret

class PromotionRulesSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionRules
        fields = ['min_overall_percentage', 'max_failed_subjects', 'consider_attendance', 'updated_at']
        read_only_fields = ['updated_at']

    def validate(self, data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        if 'min_overall_percentage' in data and (data['min_overall_percentage'] < 0 or data['min_overall_percentage'] > 100):
            raise serializers.ValidationError({'min_overall_percentage': 'Percentage must be between 0 and 100.'})
        if 'max_failed_subjects' in data and data['max_failed_subjects'] < 0:
            raise serializers.ValidationError({'max_failed_subjects': 'Cannot be negative.'})
        return data

    def create(self, validated_data):
        school = self.context['request'].user.school
        validated_data['school'] = school
        rules = super().create(validated_data)
        logger.info(f"Promotion rules created by user {self.context['request'].user} for school {school}")
        return rules

    def update(self, instance, validated_data):
        school = self.context['request'].user.school
        if instance.school != school:
            raise serializers.ValidationError({"error": "Cannot update promotion rules from another school"})
        rules = super().update(instance, validated_data)
        logger.info(f"Promotion rules updated by user {self.context['request'].user} for school {school}")
        return rules

class ClassCapacitySerializer(serializers.ModelSerializer):
    max_students = serializers.IntegerField(source='max_capacity')
    min_students = serializers.IntegerField(source='default_capacity')

    class Meta:
        model = ClassCapacity
        fields = ['max_students', 'min_students', 'updated_at']
        read_only_fields = ['updated_at']

    def validate(self, data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        max_capacity = data.get('max_capacity')
        default_capacity = data.get('default_capacity')
        if max_capacity is not None and max_capacity < 1:
            raise serializers.ValidationError({'max_students': 'Maximum capacity must be at least 1.'})
        if default_capacity is not None and default_capacity < 0:
            raise serializers.ValidationError({'min_students': 'Minimum capacity cannot be negative.'})
        if max_capacity is not None and default_capacity is not None and default_capacity > max_capacity:
            raise serializers.ValidationError({'min_students': 'Minimum capacity cannot exceed maximum capacity.'})
        return data

    def create(self, validated_data):
        school = self.context['request'].user.school
        validated_data['school'] = school
        capacity = super().create(validated_data)
        logger.info(f"Class capacity created by user {self.context['request'].user} for school {school}")
        return capacity

    def update(self, instance, validated_data):
        school = self.context['request'].user.school
        if instance.school != school:
            raise serializers.ValidationError({"error": "Cannot update class capacity from another school"})
        capacity = super().update(instance, validated_data)
        logger.info(f"Class capacity updated by user {self.context['request'].user} for school {school}")
        return capacity

    def to_internal_value(self, data):
        data = data.copy()
        data['max_capacity'] = data.get('max_students')
        data['default_capacity'] = data.get('min_students')
        return super().to_internal_value(data)
        
class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'capacity', 'room_type', 'is_active']
        extra_kwargs = {
            'is_active': {'read_only': True}
        }

    def validate(self, data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        if data.get('capacity') < 0:
            raise serializers.ValidationError({'capacity': 'Capacity cannot be negative.'})
        building = data.get('building') or (self.instance.building if self.instance else None)
        if building and not Building.objects.filter(id=building.id, school=school, is_active=True).exists():
            raise serializers.ValidationError({'building': 'Invalid building for this school.'})
        name = data.get('name')
        if name and building:
            instance_id = getattr(self.instance, 'id', None)
            if Room.objects.filter(name=name, building=building, is_active=True).exclude(id=instance_id).exists():
                raise serializers.ValidationError({'name': f"Room name '{name}' already exists in this building."})
        return data

    def create(self, validated_data):
        school = self.context['request'].user.school
        validated_data['school'] = school
        room = super().create(validated_data)
        logger.info(f"Room '{room.name}' created by user {self.context['request'].user} for school {school}")
        return room

    def update(self, instance, validated_data):
        school = self.context['request'].user.school
        if instance.school != school:
            raise serializers.ValidationError({"error": "Cannot update room from another school"})
        room = super().update(instance, validated_data)
        logger.info(f"Room '{room.name}' updated by user {self.context['request'].user} for school {school}")
        return room

class BuildingSerializer(serializers.ModelSerializer):
    rooms = RoomSerializer(many=True, read_only=True)

    class Meta:
        model = Building
        fields = ['id', 'name', 'is_active', 'rooms']
        extra_kwargs = {
            'is_active': {'read_only': True}
        }

    def validate(self, data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        campus = data.get('campus') or (self.instance.campus if self.instance else None)
        if campus and not Campus.objects.filter(id=campus.id, school=school, is_active=True).exists():
            raise serializers.ValidationError({'campus': 'Invalid campus for this school.'})
        name = data.get('name')
        if name and campus:
            instance_id = getattr(self.instance, 'id', None)
            if Building.objects.filter(name=name, campus=campus, is_active=True).exclude(id=instance_id).exists():
                raise serializers.ValidationError({'name': f"Building name '{name}' already exists in this campus."})
        return data

    def create(self, validated_data):
        school = self.context['request'].user.school
        validated_data['school'] = school
        building = super().create(validated_data)
        logger.info(f"Building '{building.name}' created by user {self.context['request'].user} for school {school}")
        return building

    def update(self, instance, validated_data):
        school = self.context['request'].user.school
        if instance.school != school:
            raise serializers.ValidationError({"error": "Cannot update building from another school"})
        building = super().update(instance, validated_data)
        logger.info(f"Building '{building.name}' updated by user {self.context['request'].user} for school {school}")
        return building

class CampusSerializer(serializers.ModelSerializer):
    buildings = BuildingSerializer(many=True, read_only=True)

    class Meta:
        model = Campus
        fields = ['id', 'name', 'address', 'contact_person', 'is_active', 'buildings']
        extra_kwargs = {
            'is_active': {'read_only': True}
        }

    def validate(self, data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        name = data.get('name')
        if name:
            instance_id = getattr(self.instance, 'id', None)
            if Campus.objects.filter(school=school, name=name, is_active=True).exclude(id=instance_id).exists():
                raise serializers.ValidationError({'name': f"Campus name '{name}' already exists for this school."})
        return data

    def create(self, validated_data):
        school = self.context['request'].user.school
        validated_data['school'] = school
        campus = super().create(validated_data)
        logger.info(f"Campus '{campus.name}' created by user {self.context['request'].user} for school {school}")
        return campus

    def update(self, instance, validated_data):
        school = self.context['request'].user.school
        if instance.school != school:
            raise serializers.ValidationError({"error": "Cannot update campus from another school"})
        campus = super().update(instance, validated_data)
        logger.info(f"Campus '{campus.name}' updated by user {self.context['request'].user} for school {school}")
        return campus

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'name', 'total_count', 'available_count', 'is_active']
        extra_kwargs = {
            'is_active': {'read_only': True}
        }

    def validate(self, data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        total_count = data.get('total_count')
        available_count = data.get('available_count', total_count)
        if total_count is not None and total_count < 1:
            raise serializers.ValidationError({'total_count': 'Total count must be at least 1.'})
        if available_count is not None and available_count < 0:
            raise serializers.ValidationError({'available_count': 'Available count cannot be negative.'})
        if total_count is not None and available_count is not None and available_count > total_count:
            raise serializers.ValidationError({'available_count': 'Available count cannot exceed total count.'})
        name = data.get('name')
        if name:
            instance_id = getattr(self.instance, 'id', None)
            if Resource.objects.filter(school=school, name=name, is_active=True).exclude(id=instance_id).exists():
                raise serializers.ValidationError({'name': f"Resource name '{name}' already exists for this school."})
        return data

    def create(self, validated_data):
        school = self.context['request'].user.school
        validated_data['school'] = school
        resource = super().create(validated_data)
        logger.info(f"Resource '{resource.name}' created by user {self.context['request'].user} for school {school}")
        return resource

    def update(self, instance, validated_data):
        school = self.context['request'].user.school
        if instance.school != school:
            raise serializers.ValidationError({"error": "Cannot update resource from another school"})
        resource = super().update(instance, validated_data)
        logger.info(f"Resource '{resource.name}' updated by user {self.context['request'].user} for school {school}")
        return resource