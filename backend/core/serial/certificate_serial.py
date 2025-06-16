from rest_framework import serializers
from core.models import Certificate, Student, Class, Section, AcademicSession

class CertificateSerializer(serializers.ModelSerializer):
    class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(),
        required=True
    )
    section_id = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.all(),
        required=False,
        allow_null=True
    )
    academic_session_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.all(),
        required=True
    )
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        required=True
    )
    
    # Add read-only fields for names
    student_name = serializers.CharField(source='student_id.user_name', read_only=True)
    class_name = serializers.CharField(source='class_id.name', read_only=True)
    section_name = serializers.CharField(source='section_id.name', read_only=True, allow_null=True)
    academic_session_name = serializers.CharField(source='academic_session_id.name', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id',
            'student_id',
            'student_name',
            'certificate_type',
            'issue_date',
            'class_id',
            'class_name',
            'section_id',
            'section_name',
            'academic_session_id',
            'academic_session_name',
            'completion_date',
            'reason',
            'remarks',
            'created_at',
            'updated_at'
        ]