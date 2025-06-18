from rest_framework import serializers
from core.models import StaffLeave, LeaveType, AcademicSession
import logging

logger = logging.getLogger(__name__)

class StaffLeaveSerializer(serializers.ModelSerializer):
    leave_type = serializers.StringRelatedField(read_only=True)  # Returns leave_type.name
    academic_session = serializers.StringRelatedField(read_only=True)  # Returns academic_session.name

    class Meta:
        model = StaffLeave
        fields = [
            'id', 'staff', 'leave_type', 'academic_session', 'school',
            'start_date', 'end_date', 'days', 'reason'
        ]

    def validate(self, data):
        if data.get('end_date') and data['start_date'] > data['end_date']:
            raise serializers.ValidationError("Start date must be before end date.")
        if data['days'] <= 0:
            raise serializers.ValidationError("Days must be positive.")
        leave_type = data['leave_type']
        if leave_type.leave_for != 'staff':
            raise serializers.ValidationError("Leave type must be applicable to staff.")
        staff = data['staff']
        if leave_type.applicable_gender != 'any' and staff.gender != leave_type.applicable_gender:
            raise serializers.ValidationError("Leave type is not applicable to staff's gender.")
        return data

    def create(self, validated_data):
        leave = super().create(validated_data)
        logger.info(f"Staff leave created for {leave.staff} with type {leave.leave_type.name}")
        return leave