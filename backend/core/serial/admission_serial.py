# core/serial/admission_serial.py
from rest_framework import serializers
from core.models import AcademicSession, Parent, Student, StudentParent, AdmissionFee, StudentFee, Class, Section, User, School, StudentDocument, StudentDocumentType
from django.core.files.storage import default_storage
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class ParentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    name = serializers.CharField(source='user.name')
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Parent
        fields = ['id', 'email', 'name', 'phone', 'address', 'username', 'password']
        extra_kwargs = {
            'username': {'write_only': True},
            'password': {'write_only': True},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def create(self, validated_data):
        user_data = validated_data.pop('user', {})
        email = user_data.get('email') or validated_data.pop('email', None)
        name = user_data.get('name') or validated_data.pop('name', None)
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)

        if not email or not name:
            raise serializers.ValidationError("Email and name are required.")

        if not username or not password:
            username, generated_password = Parent.generate_credentials()
            password = generated_password
        else:
            generated_password = password

        school = self.context['request'].user.school
        user = User.objects.create_user(
            email=email,
            name=name,
            role='parent',
            password=password,
            school=school
        )
        user.username = username
        user.save()

        parent = Parent.objects.create(
            user=user,
            school=school,
            phone=validated_data.get('phone'),
            address=validated_data.get('address')
        )
        self.context['generated_password'] = generated_password
        return parent

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        email = user_data.get('email')
        name = user_data.get('name')

        if email:
            instance.user.email = email
        if name:
            instance.user.name = name
        instance.user.save()

        instance.phone = validated_data.get('phone', instance.phone)
        instance.address = validated_data.get('address', instance.address)
        instance.save()
        return instance

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['email'] = instance.user.email
        ret['name'] = instance.user.name
        return ret

class StudentDocumentSerializer(serializers.ModelSerializer):
    document_type_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentDocumentType.objects.all(),
        source='document_type',
        required=False
    )
    document_type_name = serializers.CharField(source='document_type.name', read_only=True)
    file = serializers.FileField(required=False)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = StudentDocument
        fields = ['id', 'document_type_id', 'document_type_name', 'file', 'file_url', 'description', 'uploaded_at']

    def get_file_url(self, obj):
        if obj.file:
            return f"{settings.MEDIA_URL}{obj.file.name}"
        return None

class StudentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    name = serializers.CharField(source='user.name')
    class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        required=False,
        allow_null=True
    )
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    section_id = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.all(),
        source='section',
        required=False,
        allow_null=True
    )
    section_name = serializers.CharField(source='section.name', read_only=True, allow_null=True)
    academic_session_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.all(),
        source='academic_session',
        required=False
    )
    session_name = serializers.CharField(source='academic_session.name', read_only=True)
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    profile_image = serializers.ImageField(required=False, allow_null=True)
    profile_image_url = serializers.SerializerMethodField()
    documents = StudentDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'email', 'name', 'class_id', 'class_name', 'section_id', 'section_name',
            'academic_session_id', 'session_name', 'status', 'admission_date', 'alumni_type',
            'username', 'password', 'profile_image', 'profile_image_url', 'documents',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'username': {'write_only': True},
            'password': {'write_only': True},
        }

    def get_profile_image_url(self, obj):
        if obj.profile_image:
            return f"{settings.MEDIA_URL}{obj.profile_image.name}"
        return None

    def validate_email(self, value):
        if User.objects.filter(email=value).exclude(id=self.instance.user.id if self.instance else None).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def create(self, validated_data):
        user_data = validated_data.pop('user', {})
        email = user_data.get('email') or validated_data.pop('email', None)
        name = user_data.get('name') or validated_data.pop('name', None)
        academic_session = validated_data.pop('academic_session', None)
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        profile_image = validated_data.pop('profile_image', None)

        if not email or not name:
            raise serializers.ValidationError("Email and name are required.")

        if not username or not password:
            username, generated_password = Student.generate_credentials()
            password = generated_password
        else:
            generated_password = password

        school = self.context['request'].user.school
        user = User.objects.create_user(
            email=email,
            name=name,
            role='student',
            password=password,
            school=school
        )
        user.username = username
        user.save()

        if not academic_session:
            try:
                academic_session = AcademicSession.objects.get(status='active', school=school)
            except AcademicSession.DoesNotExist:
                raise serializers.ValidationError("No active academic session found")

        student = Student.objects.create(
            user=user,
            school=school,
            class_id=validated_data.get('class_id'),
            section=validated_data.get('section'),
            status=validated_data.get('status', 'active'),
            admission_date=validated_data.get('admission_date'),
            academic_session=academic_session,
            alumni_type=validated_data.get('alumni_type', None),
            profile_image=profile_image
        )
        self.context['generated_password'] = generated_password
        return student

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        email = user_data.get('email')
        name = user_data.get('name')

        if email:
            instance.user.email = email
        if name:
            instance.user.name = name
        instance.user.save()

        instance.class_id = validated_data.get('class_id', instance.class_id)
        instance.section = validated_data.get('section', instance.section)
        instance.academic_session = validated_data.get('academic_session', instance.academic_session)
        instance.status = validated_data.get('status', instance.status)
        instance.admission_date = validated_data.get('admission_date', instance.admission_date)
        instance.alumni_type = validated_data.get('alumni_type', instance.alumni_type)
        if 'profile_image' in validated_data:
            if instance.profile_image:
                default_storage.delete(instance.profile_image.path)
            instance.profile_image = validated_data.get('profile_image')
        instance.save()
        return instance

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['email'] = instance.user.email
        ret['name'] = instance.user.name
        return ret

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

class StudentFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.name', read_only=True)
    class_name = serializers.CharField(source='student.class_id.name', read_only=True)

    class Meta:
        model = StudentFee
        fields = ['id', 'student', 'student_name', 'class_name', 'admission_fee', 'amount', 'status', 'due_date']