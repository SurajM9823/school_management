from rest_framework import serializers
from core.models import AcademicSession, Parent, Student, StudentParent, AdmissionFee, StudentFee, Class, Section, User, School
import logging

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

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        
        if not username or not password:
            username, password = Parent.generate_credentials()
        
        school = self.context['request'].user.school
        user = User.objects.create_user(
            email=user_data['email'],
            name=user_data['name'],
            role='parent',
            password=password
        )
        user.username = username  # Store username if needed
        user.save()
        
        parent = Parent.objects.create(
            user=user,
            school=school,
            phone=validated_data.get('phone'),
            address=validated_data.get('address')
        )
        return parent

from rest_framework import serializers
from core.models import Student, User, Class, Section, AcademicSession
import logging

logger = logging.getLogger(__name__)

class StudentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email')
    name = serializers.CharField(source='user.name')
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True, allow_null=True)
    academic_session_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.all(),
        source='academic_session',
        required=False
    )
    session_name = serializers.CharField(source='academic_session.name', read_only=True)
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Student
        fields = [
            'id', 'email', 'name', 'class_id', 'class_name', 'section', 'section_name',
            'status', 'admission_date', 'alumni_type', 'username', 'password',
            'academic_session_id', 'session_name'
        ]
        extra_kwargs = {
            'username': {'write_only': True},
            'password': {'write_only': True},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    def create(self, validated_data):
        logger.info(f"Received validated_data: {validated_data}")
        user_data = validated_data.pop('user', {})
        email = user_data.get('email') or validated_data.pop('email', None)
        name = user_data.get('name') or validated_data.pop('name', None)
        academic_session = validated_data.pop('academic_session', None)
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)

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
            password=password
        )
        user.username = username
        user.school = school
        user.save()

        if not academic_session:
            try:
                academic_session = AcademicSession.objects.get(status='active')
            except AcademicSession.DoesNotExist:
                raise serializers.ValidationError("No active academic session found")

        student = Student.objects.create(
            user=user,
            school=school,
            class_id=validated_data.get('class_id'),
            section=validated_data.get('section'),
            status=validated_data.get('status', 'active'),
            admission_date=validated_data.get('admission_date'),
            academic_session=academic_session
        )
        self.context['generated_password'] = generated_password
        return student

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
        logger.info(f"Received validated_data: {validated_data}")
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
            password=password
        )
        user.username = username
        user.school = school
        user.save()

        parent = Parent.objects.create(
            user=user,
            school=school,
            phone=validated_data.get('phone'),
            address=validated_data.get('address')
        )
        self.context['generated_password'] = generated_password
        return parent

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['email'] = instance.user.email
        ret['name'] = instance.user.name
        return ret