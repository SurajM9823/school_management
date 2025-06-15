from rest_framework import serializers
from core.serializers import UserSerializer
from core.models import AcademicSession, Parent, Student, StudentParent, AdmissionFee, StudentFee, Class, Section, User, School, StudentDocument, StudentDocumentType
from django.core.files.storage import default_storage
import logging
from django.conf import settings
from django.db import transaction
import string
import random

logger = logging.getLogger(__name__)

class ParentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=True)
    name = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Parent
        fields = ['id', 'user', 'email', 'name', 'phone', 'address']
        read_only_fields = ['id', 'user']

    def validate(self, data):
        logger.debug(f"ParentSerializer validate data: {data}")
        if not data.get('email') or not data.get('name'):
            raise serializers.ValidationError("Email and name are required.")
        return data

    def create(self, validated_data):
        email = validated_data.pop('email')
        name = validated_data.pop('name')
        phone = validated_data.get('phone', '')
        address = validated_data.get('address', '')
        request = self.context.get('request')

        try:
            if not name or not name.strip():
                raise serializers.ValidationError("Name cannot be empty.")
            logger.debug(f"Creating parent with email: {email}, name: {name}")

            # Generate credentials
            username, password = Parent.generate_credentials()
            logger.debug(f"Generated credentials: username={username}, password=***")

            # Create user
            if User.objects.filter(email=email).exists():
                raise serializers.ValidationError(f"User with email {email} already exists.")
            user = User.objects.create_user(
                email=email,
                name=name,
                role='parent',
                school=request.user.school,
                password=password
            )

            parent = Parent.objects.create(
                user=user,
                school=request.user.school,
                phone=phone,
                address=address
            )

            self.context['generated_password'] = password
            return parent
        except serializers.ValidationError as e:
            logger.error(f"Parent creation validation error: {e}")
            raise
        except Exception as e:
            logger.error(f"Parent creation error: {str(e)}")
            raise serializers.ValidationError(f"Failed to create parent: {str(e)}")

class StudentDocumentSerializer(serializers.ModelSerializer):
    document_type_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentDocumentType.objects.all(), required=False, allow_null=True
    )
    file = serializers.FileField(required=True)
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = StudentDocument
        fields = ['id', 'student', 'document_type_id', 'session', 'file', 'description', 'uploaded_at']

    def validate(self, data):
        logger.debug(f"StudentDocumentSerializer validate data: {data}")
        if not data.get('file'):
            raise serializers.ValidationError("File is required.")
        return data

    def create(self, validated_data):
        student = validated_data.pop('student', None)
        if not student:
            raise serializers.ValidationError("Student is required")
        return StudentDocument.objects.create(student=student, **validated_data)

class StudentSerializer(serializers.ModelSerializer):
       # For input
    email = serializers.EmailField(write_only=True, required=True)
    name = serializers.CharField(write_only=True, required=True)
    # For output
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
        # Flat field
    school_id = serializers.UUIDField(required=True)
    class_id = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all(), required=True)
    section_id = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all(), required=False, allow_null=True)
    academic_session_id = serializers.PrimaryKeyRelatedField(queryset=AcademicSession.objects.all(), required=True)
    admission_date = serializers.DateField(required=True)
    dob = serializers.DateField(required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=Student.GENDER_CHOICES, required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_null=True)
    phone = serializers.CharField(required=False, allow_null=True)
    previous_school = serializers.CharField(required=False, allow_null=True)
    profile_image = serializers.ImageField(required=False, allow_null=True)
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True, allow_null=True)
    academic_session_name = serializers.CharField(source='academic_session.name', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'email', 'name', 'user_email', 'user_name', 'school_id', 'class_id', 'section_id', 'academic_session_id',
            'admission_number', 'admission_date', 'dob', 'gender', 'address', 'phone',
            'previous_school', 'profile_image', 'status', 'alumni_type', 'class_name',
            'section_name', 'academic_session_name', 'created_at', 'updated_at'
        ]

    def validate(self, data):
        logger.debug(f"StudentSerializer validate data: {data}")
        if not data.get('email') or not data.get('name'):
            raise serializers.ValidationError("Email and name are required.")
        return data

    def create(self, validated_data):
        email = validated_data.pop('email')
        name = validated_data.pop('name')
        class_id = validated_data.pop('class_id')
        section_id = validated_data.pop('section_id', None)
        academic_session_id = validated_data.pop('academic_session_id')
        school_id = validated_data.pop('school_id', None)

        request = self.context.get('request')
        school = request.user.school if request and request.user else None
        if not school:
            raise serializers.ValidationError("No school associated with user.")
        if school_id and school.school_id != school_id:
            raise serializers.ValidationError("Invalid school ID.")

        with transaction.atomic():
            # Generate credentials
            username, password = Student.generate_credentials()
            logger.debug(f"Generated credentials: username={username}, password=***")

            # Create user
            try:
                if User.objects.filter(email=email).exists():
                    raise serializers.ValidationError(f"User with email {email} already exists.")
                user = User.objects.create_user(
                    email=email,
                    name=name,
                    role='student',
                    school=school,
                    password=password
                )
            except Exception as e:
                logger.error(f"User creation error: {str(e)}")
                raise serializers.ValidationError(f"Failed to create user: {str(e)}")

            # Remove redundant school argument
            student = Student.objects.create(
                user=user,
                class_id=class_id,
                school=school,
                section=section_id,
                academic_session=academic_session_id,
                **validated_data
            )
            return {
                'student': student,
                'username': email,
                'password': password
            }

    def update(self, instance, validated_data):
        email = validated_data.pop('email', None)
        name = validated_data.pop('name', None)
        class_id = validated_data.pop('class_id', None)
        section_id = validated_data.pop('section_id', None)
        academic_session_id = validated_data.pop('academic_session_id', None)
        school_id = validated_data.pop('school_id', None)

        with transaction.atomic():
            if email or name:
                user = instance.user
                if email:
                    user.email = email
                if name:
                    user.name = name
                user.save()

            if school_id:
                try:
                    school = School.objects.get(school_id=school_id)
                    instance.school = school
                except School.DoesNotExist:
                    raise serializers.ValidationError("Invalid school ID")

            instance.class_id = class_id if class_id is not None else instance.class_id
            instance.section = section_id if section_id is not None else instance.section
            instance.academic_session = academic_session_id if academic_session_id is not None else instance.academic_session

            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            instance.save()
            return instance

class StudentParentSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.user.name', read_only=True)
    parent_email = serializers.CharField(source='parent.user.email', read_only=True)

    class Meta:
        model = StudentParent
        fields = ['id', 'student', 'parent', 'parent_name', 'parent_email', 'relationship']

class AdmissionFeeSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True, allow_null=True)

    class Meta:
        model = AdmissionFee
        fields = ['id', 'class_id', 'class_name', 'section', 'section_name', 'amount', 'is_active']

# core/serializers/admission_serial.py, around line 235
class StudentFeeSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), required=True)
    admission_fee = serializers.PrimaryKeyRelatedField(queryset=AdmissionFee.objects.all(), required=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    due_date = serializers.DateField(required=True)
    status = serializers.ChoiceField(
        choices=[('pending', 'Pending'), ('paid', 'Paid'), ('waived', 'Waived')],
        required=False,
        allow_null=True
    )
    student_name = serializers.CharField(source='student.user.name', read_only=True)
    class_name = serializers.CharField(source='student.class_id.name', read_only=True)

    class Meta:
        model = StudentFee
        fields = ['id', 'student', 'student_name', 'class_name', 'admission_fee', 'amount', 'status', 'due_date']

    def validate(self, data):
        logger.debug(f"StudentFeeSerializer validate data: {data}")
        if not data.get('student'):
            raise serializers.ValidationError("Student is required.")
        if not data.get('admission_fee'):
            raise serializers.ValidationError("Admission fee is required.")
        if not data.get('amount') or data.get('amount') <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        if not data.get('due_date'):
            raise serializers.ValidationError("Due date is required.")
        return data

    def create(self, validated_data):
        try:
            student_fee = StudentFee.objects.create(**validated_data)
            logger.debug(f"Created StudentFee: {student_fee.id}")
            return student_fee
        except Exception as e:
            logger.error(f"StudentFee creation error: {str(e)}")
            raise serializers.ValidationError(f"Failed to create student fee: {str(e)}")

    def update(self, instance, validated_data):
        try:
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            logger.debug(f"Updated StudentFee: {instance.id}")
            return instance
        except Exception as e:
            logger.error(f"StudentFee update error: {str(e)}")
            raise serializers.ValidationError(f"Failed to update student fee: {str(e)}")