from rest_framework import serializers
from core.domain.teacher_assignment import TeacherAssignment
from core.models import Class, Section, Subject

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