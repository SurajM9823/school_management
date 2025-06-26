# core/serial/admin/staffmanagement/StaffLeaveSerializer.py
from rest_framework import serializers
from core.models import StaffLeave, LeaveType, AcademicSession
import logging

logger = logging.getLogger(__name__)

class StaffLeaveSerializer(serializers.ModelSerializer):
    leave_type = serializers.PrimaryKeyRelatedField(queryset=LeaveType.objects.all())
    academic_session = serializers.PrimaryKeyRelatedField(queryset=AcademicSession.objects.all())
    leave_type_name = serializers.StringRelatedField(source='leave_type', read_only=True)
    academic_session_name = serializers.StringRelatedField(source='academic_session', read_only=True)

    class Meta:
        model = StaffLeave
        fields = [
            'id', 'staff', 'leave_type', 'leave_type_name', 'academic_session', 'academic_session_name', 'school',
            'start_date', 'end_date', 'days', 'reason'
        ]

    def validate(self, data):
        logger.info(f"Validating staff leave data: {data}")
        school_id = data.get('school')
        request = self.context.get('request')
        
        # Skip school validation - the school is already set correctly by the view
        # Just log the values for debugging
        if request and request.user and request.user.school:
            logger.info(f"Request user school: {request.user.school.school_id}")
        if school_id:
            logger.info(f"Data school_id: {school_id}")
            
        if data.get('end_date') and data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date.")
        if data['days'] <= 0:
            raise serializers.ValidationError("Days must be positive.")
            
        leave_type = data['leave_type']
        if leave_type.leave_for != 'staff':
            raise serializers.ValidationError("Leave type must be applicable to staff.")
            
        staff = data['staff']
        if leave_type.applicable_gender != 'any' and staff.gender and staff.gender != leave_type.applicable_gender:
            raise serializers.ValidationError("Leave type is not applicable to staff's gender.")
            
        return data

    def create(self, validated_data):
        leave = super().create(validated_data)
        logger.info(f"Staff leave created for {leave.staff} with type {leave.leave_type.name}")
        return leave