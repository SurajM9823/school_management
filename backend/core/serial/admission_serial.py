from rest_framework import serializers
from core.serializers import ClassSerializer, UserSerializer
from core.models import AcademicSession, Certificate, Parent, Student, StudentParent, AdmissionFee, StudentFee, Class, Section, User, School, StudentDocument, StudentDocumentType
from django.core.files.storage import default_storage
import logging
from django.conf import settings
from django.db import transaction
import string
import random

logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name']

class ParentSerializer(serializers.ModelSerializer):
    input_email = serializers.EmailField(write_only=True, required=True)
    input_name = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    name = serializers.CharField(source='user.name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Parent
        fields = ['id', 'user', 'user_id', 'email', 'name', 'phone', 'address', 'input_email', 'input_name', 'student_name']
        read_only_fields = ['id', 'user', 'user_id', 'email', 'name']

    def get_student_name(self, obj):
        student_parents = StudentParent.objects.filter(parent=obj)
        student_names = [sp.student.user.name for sp in student_parents if sp.student.user.name]
        return ", ".join(student_names) if student_names else "No Student"

    def validate(self, data):
        logger.debug(f"ParentSerializer validate data: {data}")
        school_id_uuid = self.context.get('school_id') or (self.context.get('request').user.school_id if self.context.get('request') else None)
        if not school_id_uuid:
            raise serializers.ValidationError("No school_id provided.")
        try:
            school = School.objects.get(school_id=school_id_uuid)
        except School.DoesNotExist:
            raise serializers.ValidationError(f"School with school_id {school_id_uuid} does not exist")

        if not data.get('input_email') or not data.get('input_name'):
            raise serializers.ValidationError("Email and name are required.")
        email = data.get('input_email')
        if email:
            existing_user = User.objects.filter(email=email, school_id=school.id)
            if self.instance:
                existing_user = existing_user.exclude(id=self.instance.user.id)
            if existing_user.exists():
                raise serializers.ValidationError(f"User with email {email} already exists in this school.")
        return data

    def create(self, validated_data):
        email = validated_data.pop('input_email')
        name = validated_data.pop('input_name')
        phone = validated_data.get('phone', '')
        address = validated_data.get('address', '')
        school_id_uuid = self.context.get('school_id') or (self.context.get('request').user.school_id if self.context.get('request') else None)
        if not school_id_uuid:
            raise serializers.ValidationError("No school_id provided.")

        try:
            if not name or not name.strip():
                raise serializers.ValidationError("Name cannot be empty.")
            logger.debug(f"Creating parent with email: {email}, name: {name}")

            with transaction.atomic():
                school = School.objects.get(school_id=school_id_uuid)
                school_id = school.id
                logger.debug(f"Mapping school_id {school_id_uuid} to School.id {school_id}")
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
                user = User.objects.create_user(
                    email=email,
                    name=name,
                    role='parent',
                    school=school,
                    password=password
                )
                parent = Parent.objects.create(
                    user=user,
                    school_id=school_id,
                    phone=phone,
                    address=address
                )
                logger.info(f"Created parent {parent.id} for school_id: {school_id}")
                return {
                    'parent': parent,
                    'email': email,
                    'password': password,
                    'user_id': user.id
                }
        except School.DoesNotExist:
            logger.error(f"School with school_id {school_id_uuid} does not exist")
            raise serializers.ValidationError(f"School with school_id {school_id_uuid} does not exist")
        except Exception as e:
            logger.error(f"Parent creation error: {str(e)}")
            raise serializers.ValidationError(f"Failed to create parent: {str(e)}")

    def update(self, instance, validated_data):
        email = validated_data.pop('input_email', None)
        name = validated_data.pop('input_name', None)
        phone = validated_data.pop('phone', instance.phone)
        address = validated_data.pop('address', instance.address)
        school_id_uuid = self.context.get('school_id') or (self.context.get('request').user.school_id if self.context.get('request') else None)
        if not school_id_uuid:
            raise serializers.ValidationError("No school_id provided.")

        try:
            with transaction.atomic():
                if email or name:
                    user = instance.user
                    if email and email != user.email:
                        user.email = email
                    if name and name != user.name:
                        user.name = name
                    if school_id_uuid:
                        school = School.objects.get(school_id=school_id_uuid)
                        user.school_id = school.id
                    user.save()
                instance.phone = phone
                instance.address = address
                instance.save()
                logger.info(f"Updated parent {instance.id} for school_id: {school_id_uuid}")
                return instance
        except School.DoesNotExist:
            logger.error(f"School with school_id {school_id_uuid} does not exist")
            raise serializers.ValidationError(f"School with school_id {school_id_uuid} does not exist")
        except Exception as e:
            logger.error(f"Parent update error: {str(e)}")
            raise serializers.ValidationError(f"Failed to update parent: {str(e)}")
                
class StudentDocumentSerializer(serializers.ModelSerializer):
    document_type_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentDocumentType.objects.all(), required=False, allow_null=True
    )
    file = serializers.FileField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = StudentDocument
        fields = ['id', 'student', 'document_type_id', 'session', 'file', 'description', 'uploaded_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school_id = self.context.get('school_id') or (self.context.get('request') and self.context.get('request').user.school_id)
        if school_id:
            self.fields['document_type_id'].queryset = StudentDocumentType.objects.filter(school__school_id=school_id)

    def validate(self, data):
        logger.debug(f"StudentDocumentSerializer validate data: {data}")
        school_id = self.context.get('school_id') or (self.context.get('request').user.school_id if self.context.get('request') else None)
        if not school_id:
            raise serializers.ValidationError("No school_id provided.")
        if not self.instance and not data.get('file'):
            raise serializers.ValidationError("File is required.")
        if 'document_type_id' in data and data['document_type_id']:
            if not StudentDocumentType.objects.filter(id=data['document_type_id'].id, school__school_id=school_id).exists():
                raise serializers.ValidationError("Invalid document type for this school.")
        if 'student' in data and not Student.objects.filter(id=data['student'].id, school__school_id=school_id).exists():
            raise serializers.ValidationError("Invalid student for this school.")
        return data

    def create(self, validated_data):
        student = validated_data.pop('student', None)
        school_id = self.context.get('school_id')
        if not student or not school_id:
            raise serializers.ValidationError("Student and school_id are required.")
        document = StudentDocument.objects.create(student=student, school_id=school_id, **validated_data)
        logger.info(f"Created document {document.id} for student {student.id} in school_id: {school_id}")
        return document

    def update(self, instance, validated_data):
        school_id = self.context.get('school_id')
        if not school_id:
            raise serializers.ValidationError("No school_id provided.")
        try:
            if 'file' in validated_data and instance.file:
                default_storage.delete(instance.file.path)
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            logger.info(f"Updated document {instance.id} for student {instance.student.id} in school_id: {school_id}")
            return instance
        except Exception as e:
            logger.error(f"Document update error: {str(e)}")
            raise serializers.ValidationError(f"Failed to update document: {str(e)}")

class StudentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=True)
    name = serializers.CharField(write_only=True, required=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
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
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'email', 'name', 'user_email', 'user_name', 'class_id', 'section_id', 'academic_session_id',
            'admission_number', 'admission_date', 'dob', 'gender', 'address', 'phone',
            'previous_school', 'profile_image', 'status', 'alumni_type', 'class_name',
            'section_name', 'academic_session_name', 'created_at', 'updated_at', 'user_id'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school_id = self.context.get('school_id') or (self.context.get('request') and self.context.get('request').user.school_id)
        logger.debug(f"StudentSerializer init - school_id: {school_id}")
        if school_id:
            try:
                school = School.objects.get(school_id=school_id)
                logger.debug(f"School found: id={school.id}, school_id={school.school_id}")
                self.fields['class_id'].queryset = Class.objects.filter(school_id=school.school_id, is_active=True)
                self.fields['section_id'].queryset = Section.objects.filter(school_id=school.school_id, is_active=True)
                self.fields['academic_session_id'].queryset = AcademicSession.objects.filter(school_id=school.school_id)
                logger.debug(f"Class queryset: {list(self.fields['class_id'].queryset.values('id', 'school_id'))}")
                logger.debug(f"Section queryset: {list(self.fields['section_id'].queryset.values('id', 'school_id'))}")
                logger.debug(f"AcademicSession queryset: {list(self.fields['academic_session_id'].queryset.values('id', 'school_id'))}")
            except School.DoesNotExist:
                logger.error(f"School with school_id {school_id} does not exist")
                raise serializers.ValidationError(f"School with school_id {school_id} does not exist")

    def validate_profile_image(self, value):
        if value:
            valid_types = ['image/png', 'image/jpeg']
            if value.content_type not in valid_types:
                raise serializers.ValidationError("Only PNG or JPEG images are allowed.")
            max_size = 2 * 1024 * 1024  # 2MB
            if value.size > max_size:
                raise serializers.ValidationError("Image must be less than 2MB.")
        return value

    def validate(self, data):
        school_id = self.context.get('school_id') or (self.context.get('request').user.school_id if self.context.get('request') else None)
        logger.debug(f"StudentSerializer validate - school_id: {school_id}, data: {data}")
        if not school_id:
            raise serializers.ValidationError("No school_id provided.")
        try:
            school = School.objects.get(school_id=school_id)
            logger.debug(f"School found in")
            logger.debug(f"School found in validate: id={school.id}, school_id={school.school_id}")
        except School.DoesNotExist:
            raise serializers.ValidationError(f"School with school_id {school_id} does not exist")

        if not self.partial:
            if not data.get('email') or not data.get('name'):
                raise serializers.ValidationError("Email and name are required.")
        
        if 'email' in data:
            existing_user = User.objects.filter(email=data['email'], school_id=school.id)
            if self.instance:
                existing_user = existing_user.exclude(id=self.instance.user_id)
            if existing_user.exists():
                raise serializers.ValidationError(f"User with email {data['email']} already exists in this school.")
        return data

    def create(self, validated_data):
        email = validated_data.pop('email')
        name = validated_data.pop('name')
        class_id = validated_data.pop('class_id')
        section_id = validated_data.pop('section_id', None)
        academic_session_id = validated_data.pop('academic_session_id')
        school_id_uuid = self.context.get('school_id') or (self.context.get('request').user.school_id if self.context.get('request') else None)
        logger.debug(f"StudentSerializer create - school_id: {school_id_uuid}, data: {validated_data}")
        if not school_id_uuid:
            raise serializers.ValidationError("No school_id provided.")

        try:
            with transaction.atomic():
                school = School.objects.get(school_id=school_id_uuid)
                logger.debug(f"Using school instance with school_id: {school.school_id}")
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
                user = User.objects.create_user(
                    email=email,
                    name=name,
                    role='student',
                    school=school,  # Pass School instance
                    password=password
                )
                student = Student.objects.create(
                    user=user,
                    class_id=class_id,
                    school_id=school.id,  # Pass School.id (integer)
                    section=section_id,
                    academic_session=academic_session_id,
                    **validated_data
                )
                logger.info(f"Created student {student.id} for school_id: {school.id}")
                return {
                    'student': student,
                    'email': email,
                    'password': password,
                    'user_id': user.id
                }
        except School.DoesNotExist:
            logger.error(f"School with school_id {school_id_uuid} does not exist")
            raise serializers.ValidationError(f"School with school_id {school_id_uuid} does not exist")
        except Exception as e:
            logger.error(f"Student creation error: {str(e)}")
            raise serializers.ValidationError(f"Failed to create student: {str(e)}")

    def update(self, instance, validated_data):
        email = validated_data.pop('email', None)
        name = validated_data.pop('name', None)
        class_id = validated_data.pop('class_id', None)
        section_id = validated_data.pop('section_id', None)
        academic_session_id = validated_data.pop('academic_session_id', None)
        school_id_uuid = self.context.get('school_id') or (self.context.get('request').user.school_id if self.context.get('request') else None)
        if not school_id_uuid:
            raise serializers.ValidationError("No school_id provided.")

        try:
            with transaction.atomic():
                school = School.objects.get(school_id=school_id_uuid)
                if email or name:
                    user = instance.user
                    if email and email != user.email:   
                        user.email = email
                    if name and name != user.name:
                        user.name = name
                    user.school = school  # Update User school
                    user.save()
                if class_id is not None:
                    instance.class_id = class_id
                if section_id is not None:
                    instance.section = section_id
                if academic_session_id is not None:
                    instance.academic_session = academic_session_id
                for attr, value in validated_data.items():
                    setattr(instance, attr, value)
                instance.school = school  # Set school instance, not school_id
                instance.save()
                logger.info(f"Updated student {instance.id} for school_id: {school.id}")
                return instance
        except School.DoesNotExist:
            logger.error(f"School with school_id {school_id_uuid} does not exist")
            raise serializers.ValidationError(f"School with school_id {school_id_uuid} does not exist")
        except Exception as e:
            logger.error(f"Student update error: {str(e)}")
            raise serializers.ValidationError(f"Failed to update student: {str(e)}")
          
class StudentParentSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.user.name', read_only=True)
    parent_email = serializers.CharField(source='parent.user.email', read_only=True)
    parent = serializers.PrimaryKeyRelatedField(queryset=Parent.objects.all(), required=True)

    class Meta:
        model = StudentParent
        fields = ['id', 'student', 'parent', 'parent_name', 'parent_email', 'relationship']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school_id = self.context.get('school_id') or (self.context.get('request') and self.context.get('request').user.school_id)
        if school_id:
            self.fields['parent'].queryset = Parent.objects.filter(school__school_id=school_id)

    def validate(self, data):
        logger.debug(f"StudentParentSerializer validate data: {data}")
        school_id = self.context.get('school_id') or (self.context.get('request').user.school_id if self.context.get('request') else None)
        if not school_id:
            raise serializers.ValidationError("No school_id provided.")
        if 'parent' in data and not Parent.objects.filter(id=data['parent'].id, school__school_id=school_id).exists():
            raise serializers.ValidationError("Invalid parent ID for this school.")
        if 'student' in data and not Student.objects.filter(id=data['student'].id, school__school_id=school_id).exists():
            raise serializers.ValidationError("Invalid student ID for this school.")
        return data

    def create(self, validated_data):
        school_id = self.context.get('school_id')
        if not school_id:
            raise serializers.ValidationError("No school_id provided.")
        student_parent = super().create(validated_data)
        logger.info(f"Created student-parent link for student {student_parent.student.id} and parent {student_parent.parent.id} in school_id: {school_id}")
        return student_parent
    
class AdmissionFeeSerializer(serializers.ModelSerializer):
    class_id = ClassSerializer(read_only=True)
    class_id_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.filter(is_active=True),
        source='class_id',
        write_only=True
    )
    section = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.filter(is_active=True),
        allow_null=True
    )
    section_name = serializers.CharField(source='section.name', read_only=True, allow_null=True)

    class Meta:
        model = AdmissionFee
        fields = ['id', 'class_id', 'class_id_id', 'section', 'section_name', 'amount', 'is_active']
        extra_kwargs = {
            'is_active': {'read_only': True}
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school_id = self.context.get('school_id') or (self.context.get('request') and self.context.get('request').user.school_id)
        if school_id:
            self.fields['class_id_id'].queryset = Class.objects.filter(school__school_id=school_id, is_active=True)
            self.fields['section'].queryset = Section.objects.filter(school__school_id=school_id, is_active=True)

    def validate(self, data):
        school_id = self.context.get('school_id') or (self.context.get('request').user.school_id if self.context.get('request') else None)
        if not school_id:
            raise serializers.ValidationError({"error": "No school_id provided."})
        
        class_id = data.get('class_id')
        section = data.get('section')
        amount = data.get('amount')

        if class_id and not Class.objects.filter(id=class_id.id, school__school_id=school_id, is_active=True).exists():
            logger.error(f"Invalid class_id {class_id.id} for school_id: {school_id}")
            raise serializers.ValidationError({'class_id': 'Invalid class for this school.'})

        if section and not Section.objects.filter(id=section.id, class_id=class_id, school__school_id=school_id, is_active=True).exists():
            logger.error(f"Invalid section_id {section.id} for class_id {class_id.id} and school_id: {school_id}")
            raise serializers.ValidationError({'section': 'Invalid section for this class and school.'})

        if amount is not None:
            if amount <= 0:
                raise serializers.ValidationError({'amount': 'Amount must be greater than 0.'})
            if len(str(amount).split('.')[-1]) > 2:
                raise serializers.ValidationError({'amount': 'Amount cannot have more than 2 decimal places.'})

        instance_id = getattr(self.instance, 'id', None)
        section_value = section if section else None
        if AdmissionFee.objects.filter(
            school__school_id=school_id,
            class_id=class_id,
            section=section_value,
            is_active=True
        ).exclude(id=instance_id).exists():
            section_str = section_value.name if section_value else 'All Sections'
            logger.error(f"Duplicate admission fee for class {class_id.name}, section {section_str} in school_id: {school_id}")
            raise serializers.ValidationError({
                'non_field_errors': f"Admission fee for class {class_id.name} and section {section_str} already exists for this school."
            })

        return data

    def create(self, validated_data):
        school_id = self.context.get('school_id')
        if not school_id:
            raise serializers.ValidationError("No school_id provided.")
        validated_data['school_id'] = school_id
        fee = super().create(validated_data)
        section_str = fee.section.name if fee.section else 'All Sections'
        logger.info(f"Created admission fee {fee.id} for class {fee.class_id.name}, section {section_str} in school_id: {school_id}")
        return fee

    def update(self, instance, validated_data):
        school_id = self.context.get('school_id')
        if not school_id or instance.school_id != school_id:
            logger.error(f"Invalid school_id {school_id} for updating admission fee {instance.id}")
            raise serializers.ValidationError("Invalid school_id.")
        fee = super().update(instance, validated_data)
        section_str = fee.section.name if fee.section else 'All Sections'
        logger.info(f"Updated admission fee {fee.id} for class {fee.class_id.name}, section {section_str} in school_id: {school_id}")
        return fee
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        school_id = self.context.get('school_id') or (self.context.get('request') and self.context.get('request').user.school_id)
        if school_id:
            self.fields['student'].queryset = Student.objects.filter(school__school_id=school_id)
            self.fields['admission_fee'].queryset = AdmissionFee.objects.filter(school__school_id=school_id, is_active=True)

    def validate(self, data):
        logger.debug(f"StudentFeeSerializer validate data: {data}")
        school_id = self.context.get('school_id') or (self.context.get('request').user.school_id if self.context.get('request') else None)
        if not school_id:
            raise serializers.ValidationError("No school_id provided.")
        if not data.get('student'):
            raise serializers.ValidationError("Student is required.")
        if not Student.objects.filter(id=data['student'].id, school__school_id=school_id).exists():
            logger.error(f"Invalid student_id {data['student'].id} for school_id: {school_id}")
            raise serializers.ValidationError("Invalid student for this school.")
        if not data.get('admission_fee'):
            raise serializers.ValidationError("Admission fee is required.")
        if not AdmissionFee.objects.filter(id=data['admission_fee'].id, school__school_id=school_id, is_active=True).exists():
            logger.error(f"Invalid admission_fee_id {data['admission_fee'].id} for school_id: {school_id}")
            raise serializers.ValidationError("Invalid admission fee for this school.")
        if not data.get('amount') or data.get('amount') <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        if not data.get('due_date'):
            raise serializers.ValidationError("Due date is required.")
        return data

    def create(self, validated_data):
        try:
            school_id = self.context.get('school_id')
            if not school_id:
                raise serializers.ValidationError("No school_id provided.")
            student_fee = StudentFee.objects.create(**validated_data)
            logger.info(f"Created StudentFee {student_fee.id} for student {student_fee.student.id} in school_id: {school_id}")
            return student_fee
        except Exception as e:
            logger.error(f"StudentFee creation error: {str(e)}")
            raise serializers.ValidationError(f"Failed to create student fee: {str(e)}")

    def update(self, instance, validated_data):
        try:
            school_id = self.context.get('school_id')
            if not school_id:
                raise serializers.ValidationError("No school_id provided.")
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            logger.info(f"Updated StudentFee {instance.id} for student {instance.student.id} in school_id: {school_id}")
            return instance
        except Exception as e:
            logger.error(f"StudentFee update error: {str(e)}")
            raise serializers.ValidationError(f"Failed to update student fee: {str(e)}")