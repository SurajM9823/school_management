# core/serial/admin/staffmanagement/StaffLeaveSerializer.py
from rest_framework import serializers
from core.models import StaffLeave, LeaveType, AcademicSession
import logging

logger = logging.getLogger(__name__)

class StaffLeaveSerializer(serializers.ModelSerializer):
    leave_type = serializers.StringRelatedField(read_only=True)
    academic_session = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = StaffLeave
        fields = [
            'id', 'staff', 'leave_type', 'academic_session', 'school',
            'start_date', 'end_date', 'days', 'reason'
        ]

    def validate(self, data):
        logger.info(f"Validating staff leave data: {data}")
        school_id = data.get('school')
        request = self.context.get('request')
        # Normalize school_id
        normalized_school_id = str(school_id).replace('-', '') if school_id else None
        if request and normalized_school_id != str(request.user.school.school_id).replace('-', ''):
            raise serializers.ValidationError({"school": "Leave must be associated with the user's school."})
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
        # Update school_id in validated data
        data['school'] = normalized_school_id
        return data

    def create(self, validated_data):
        leave = super().create(validated_data)
        logger.info(f"Staff leave created for {leave.staff} with type {leave.leave_type.name}")
        return leave