from core.domain.teacher import Teacher
from rest_framework import serializers
from core.domain.teacher_assignment import ClassTeacher, TeacherAssignment
from core.models import Class, Section, Subject
import logging
logger = logging.getLogger(__name__)


class TeacherAssignmentSerializer(serializers.ModelSerializer):
    class_name = serializers.SerializerMethodField()
    section_name = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TeacherAssignment
        fields = [
            'id', 'teacher', 'class_obj', 'section', 'subject',
            'is_primary', 'hours_per_week', 'class_name',
            'section_name', 'subject_name'
        ]
    
    def get_class_name(self, obj):
        return obj.class_obj.name if obj.class_obj else None
    
    def get_section_name(self, obj):
        return obj.section.name if obj.section else None
    
    def get_subject_name(self, obj):
        return obj.subject.name if obj.subject else None


class ClassTeacherSerializer(serializers.ModelSerializer):
    class_id = serializers.PrimaryKeyRelatedField(queryset=Class.objects.all())
    section = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all(), allow_null=True)
    teacher = serializers.PrimaryKeyRelatedField(queryset=Teacher.objects.all())
    teacher_name = serializers.SerializerMethodField()
    section_name = serializers.SerializerMethodField()

    class Meta:
        model = ClassTeacher
        fields = ['id', 'class_id', 'section', 'teacher', 'assignment_start_date', 'assignment_end_date', 'teacher_name', 'section_name']
    
    def get_teacher_name(self, obj):
        if obj.teacher and obj.teacher.staff:
            return f"{obj.teacher.staff.first_name} {obj.teacher.staff.last_name}"
        return "Unknown Teacher"
    
    def get_section_name(self, obj):
        return obj.section.name if obj.section else None

    def validate(self, data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})
        
        class_id = data.get('class_id')
        if class_id and not Class.objects.filter(id=class_id.id, school=school, is_active=True).exists():
            raise serializers.ValidationError({'class_id': 'Invalid class for this school.'})
        
        section = data.get('section')
        if section and not Section.objects.filter(id=section.id, class_id=class_id, school=school, is_active=True).exists():
            raise serializers.ValidationError({'section': 'Invalid section for this class.'})
        
        teacher = data.get('teacher')
        if teacher and not Teacher.objects.filter(id=teacher.id, staff__school=school).exists():
            raise serializers.ValidationError({'teacher': f'Teacher ID {teacher.id} not found for this school.'})
        
        return data
    
    def create(self, validated_data):
        # Deactivate previous class teachers for this class
        ClassTeacher.objects.filter(
            class_id=validated_data['class_id'],
            is_active=True
        ).update(is_active=False)
        
        return super().create(validated_data)