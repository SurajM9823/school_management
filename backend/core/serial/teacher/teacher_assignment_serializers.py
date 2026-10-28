from rest_framework import serializers
from core.models import TeacherAssignmentToStudent, Class, Subject, User, Staff, Student

class TeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    class_name = serializers.CharField(source='class_assigned.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    
    class Meta:
        model = TeacherAssignmentToStudent
        fields = ['id', 'title', 'description', 'class_assigned', 'subject', 'due_date', 'status', 'teacher_name', 'class_name', 'subject_name', 'student_name']
        
    def create(self, validated_data):
        # This won't be used since we override create in the viewset
        return super().create(validated_data)

class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ['id', 'name']

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code']