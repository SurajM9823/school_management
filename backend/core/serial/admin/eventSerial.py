from rest_framework import serializers
from core.models import Event, EventAssignment
from core.models import AcademicSession, Student
import logging

logger = logging.getLogger(__name__)

class EventSerializer(serializers.ModelSerializer):
    academic_session = serializers.PrimaryKeyRelatedField(queryset=AcademicSession.objects.all())
    number_of_participants = serializers.SerializerMethodField()
    assignments = serializers.SerializerMethodField()  # Add assignments dynamically

    class Meta:
        model = Event
        fields = [
            'id', 'name', 'description', 'event_type', 'academic_session',
            'start_date', 'end_date', 'is_open_for_applications', 'number_of_participants', 'assignments'
        ]

    def get_number_of_participants(self, obj):
        return obj.assignments.filter(is_active=True).count()

    def get_assignments(self, obj):
        assignments = obj.assignments.filter(is_active=True)
        return EventAssignmentSerializer(assignments, many=True, context=self.context).data

    def validate(self, data):
        if data.get('end_date') and data['start_date'] > data['end_date']:
            raise serializers.ValidationError("End date must be after start date.")
        return data

class EventAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user_name', read_only=True)
    event = EventSerializer(read_only=True)
    event_id = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(), source='event'
    )
    student_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = EventAssignment
        fields = [
            'id', 'event', 'event_id', 'student', 'student_id', 'student_name',
            'is_active', 'assigned_at', 'revoked_at', 'remarks'
        ]
        read_only_fields = ['student']

    def get_student(self, obj):
        return {
            'id': str(obj.student.user_id),  # Match frontend student.id
            'user_id': obj.student.user_id,  # Include user_id
            'user_name': obj.student.user_name
        }

    def validate_student_id(self, value):
        try:
            student = Student.objects.get(user_id=value)
        except Student.DoesNotExist:
            logger.error(f"Student with user_id {value} does not exist.")
            raise serializers.ValidationError(f"Student with user_id {value} does not exist.")
        except Exception as e:
            logger.error(f"Error validating student_id {value}: {str(e)}")
            raise serializers.ValidationError(f"Invalid student_id: {str(e)}")
        return value

    def validate(self, data):
        try:
            data['student'] = Student.objects.get(user_id=data['student_id'])
            # Check for existing active assignment
            existing = EventAssignment.objects.filter(
                event=data['event'],
                student=data['student'],
                is_active=True
            ).exists()
            if existing:
                logger.warning(f"Duplicate assignment for event {data['event'].id} and student {data['student'].user_id}")
                raise serializers.ValidationError("This student is already assigned to the event.")
        except Student.DoesNotExist:
            logger.error(f"Student with user_id {data['student_id']} does not exist in validate.")
            raise serializers.ValidationError(f"Student with user_id {data['student_id']} does not exist.")
        except Exception as e:
            logger.error(f"Error in validate: {str(e)}")
            raise serializers.ValidationError(f"Validation error: {str(e)}")
        return data

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except Exception as e:
            logger.error(f"Error creating EventAssignment: {str(e)}")
            raise serializers.ValidationError(f"Failed to create assignment: {str(e)}")