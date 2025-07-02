from rest_framework import serializers
from core.models import Notice
from core.models import AcademicSession, Class, Section, School
import logging

logger = logging.getLogger(__name__)

class NoticeSerializer(serializers.ModelSerializer):
    academic_session_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.all(), source='academic_session'
    )
    class_id = serializers.PrimaryKeyRelatedField(
        queryset=Class.objects.all(), source='class_id', required=False, allow_null=True
    )
    section_id = serializers.PrimaryKeyRelatedField(
        queryset=Section.objects.all(), source='section', required=False, allow_null=True
    )
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    school_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = Notice
        fields = [
            'id', 'notice_id', 'school_id', 'academic_session_id', 'title', 'content',
            'notice_type', 'class_id', 'section_id', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'notice_id']

    def validate(self, data):
        school_id = data.get('school_id')
        notice_type = data.get('notice_type')
        class_id = data.get('class_id')
        section = data.get('section')

        if not school_id:
            logger.error("No school_id provided.")
            raise serializers.ValidationError("School ID is required.")

        try:
            school = School.objects.get(school_id=school_id)
        except School.DoesNotExist:
            logger.error(f"School with school_id {school_id} does not exist.")
            raise serializers.ValidationError(f"School with school_id {school_id} does not exist.")

        if notice_type == 'specific_class':
            if not class_id:
                raise serializers.ValidationError("Class is required for specific_class notice type.")
            if section and section.class_id != class_id:
                raise serializers.ValidationError("Section must belong to the selected class.")

        return data

    def create(self, validated_data):
        school_id = validated_data.pop('school_id')
        try:
            school = School.objects.get(school_id=school_id)
            validated_data['school'] = school
            validated_data['created_by'] = self.context['request'].user
            return super().create(validated_data)
        except School.DoesNotExist:
            logger.error(f"School with school_id {school_id} does not exist.")
            raise serializers.ValidationError(f"School with school_id {school_id} does not exist.")
        except Exception as e:
            logger.error(f"Error creating notice: {str(e)}")
            raise serializers.ValidationError(f"Failed to create notice: {str(e)}")

    def update(self, instance, validated_data):
        school_id = validated_data.pop('school_id', None)
        if school_id:
            try:
                school = School.objects.get(school_id=school_id)
                instance.school = school
            except School.DoesNotExist:
                logger.error(f"School with school_id {school_id} does not exist.")
                raise serializers.ValidationError(f"School with school_id {school_id} does not exist.")
        try:
            return super().update(instance, validated_data)
        except Exception as e:
            logger.error(f"Error updating notice: {str(e)}")
            raise serializers.ValidationError(f"Failed to update notice: {str(e)}")