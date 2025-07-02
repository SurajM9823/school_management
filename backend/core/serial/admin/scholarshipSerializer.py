from rest_framework import serializers
from core.models import Scholarship, ScholarshipAssignment
from core.serial.admission_serial import StudentSerializer
from core.serial.admin.exam import ExamSerializer
from core.serializers import AcademicSessionSerializer, TermSerializer

class ScholarshipSerializer(serializers.ModelSerializer):
    awarded_to = serializers.SerializerMethodField()
    academic_session = AcademicSessionSerializer(read_only=True)
    academic_session_id = serializers.IntegerField(write_only=True)
    term = TermSerializer(read_only=True, required=False)
    term_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    linked_exam = ExamSerializer(read_only=True, required=False)
    linked_exam_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Scholarship
        fields = [
            'id', 'name', 'description', 'scholarship_type', 'amount', 'percentage_waiver',
            'is_full_waiver', 'duration_months', 'academic_session', 'academic_session_id',
            'term', 'term_id', 'status', 'number_of_awards', 'general_criteria',
            'min_overall_percentage', 'min_exam_percentage', 'linked_exam', 'linked_exam_id',
            'max_rank_in_exam', 'auto_assign', 'created_at', 'updated_at', 'awarded_to'
        ]

    def get_awarded_to(self, obj):
        assignments = obj.assignments.filter(is_active=True)
        return [{
            'id': assignment.id,
            'student_id': assignment.student.id,
            'student_name': assignment.student.user.name,
            'assignment_type': assignment.assignment_type,
            'assigned_at': assignment.assigned_at,
            'remarks': assignment.remarks
        } for assignment in assignments]

    def validate(self, data):
        if data.get('scholarship_type') in ['full-waiver', 'partial-waiver']:
            if data.get('scholarship_type') == 'full-waiver' and not data.get('is_full_waiver'):
                raise serializers.ValidationError("Full waiver scholarships must have is_full_waiver set to True.")
            if data.get('scholarship_type') == 'partial-waiver' and not data.get('percentage_waiver'):
                raise serializers.ValidationError("Partial waiver scholarships must specify a percentage_waiver.")
        elif data.get('scholarship_type') == 'monthly' and not data.get('amount'):
            raise serializers.ValidationError("Monthly stipend scholarships must specify an amount.")
        return data

class ScholarshipAssignmentSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    student_id = serializers.IntegerField(write_only=True)
    scholarship = ScholarshipSerializer(read_only=True)
    scholarship_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ScholarshipAssignment
        fields = [
            'id', 'scholarship', 'scholarship_id', 'student', 'student_id',
            'assignment_type', 'assigned_at', 'revoked_at', 'remarks', 'is_active'
        ]

    def validate(self, data):
        if data.get('is_active') and ScholarshipAssignment.objects.filter(
            scholarship_id=data['scholarship_id'],
            student_id=data['student_id'],
            is_active=True
        ).exists():
            raise serializers.ValidationError("This student is already assigned to this scholarship.")
        return data