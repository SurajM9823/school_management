from rest_framework import serializers
from core.models import AcademicSession, School, SchoolTiming, Break, ClassSchedule, Staff, StaffDuty, ExamSchedule, Class, Section, Subject, Teacher, Room
from datetime import time
import logging

logger = logging.getLogger(__name__)

class SchoolTimingSerializer(serializers.ModelSerializer):
    school_id = serializers.UUIDField(write_only=True)
    academic_session_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = SchoolTiming
        fields = [
            'id', 'school_id', 'academic_session_id', 'start_time', 'end_time',
            'periods_per_day', 'period_duration', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        school_id = data.get('school_id')
        academic_session_id = data.get('academic_session_id')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        periods_per_day = data.get('periods_per_day')
        period_duration = data.get('period_duration')

        try:
            school = School.objects.get(school_id=school_id)
        except School.DoesNotExist:
            logger.error(f"School with school_id {school_id} does not exist.")
            raise serializers.ValidationError(f"School with school_id {school_id} does not exist.")

        try:
            academic_session = AcademicSession.objects.get(id=academic_session_id, school=school)
        except AcademicSession.DoesNotExist:
            logger.error(f"Academic session {academic_session_id} does not exist for school {school_id}.")
            raise serializers.ValidationError(f"Academic session does not exist.")

        if start_time >= end_time:
            raise serializers.ValidationError("Start time must be before end time.")
        if periods_per_day < 1:
            raise serializers.ValidationError("Periods per day must be at least 1.")
        if period_duration < 1:
            raise serializers.ValidationError("Period duration must be at least 1 minute.")

        data['school'] = school
        data['academic_session'] = academic_session
        return data

class BreakSerializer(serializers.ModelSerializer):
    school_timing_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Break
        fields = ['id', 'school_timing_id', 'break_type', 'start_time', 'duration', 'order']
        read_only_fields = ['id']

    def validate(self, data):
        school_timing_id = data.get('school_timing_id')
        try:
            school_timing = SchoolTiming.objects.get(id=school_timing_id)
        except SchoolTiming.DoesNotExist:
            logger.error(f"SchoolTiming with id {school_timing_id} does not exist.")
            raise serializers.ValidationError(f"SchoolTiming does not exist.")
        
        start_time = data.get('start_time')
        if start_time < school_timing.start_time or start_time > school_timing.end_time:
            raise serializers.ValidationError(f"Break start time must be between {school_timing.start_time} and {school_timing.end_time}.")
        
        data['school_timing'] = school_timing
        return data

class ClassScheduleSerializer(serializers.ModelSerializer):
    school_id = serializers.UUIDField(write_only=True)
    academic_session_id = serializers.IntegerField(write_only=True)
    class_id = serializers.IntegerField()
    section_id = serializers.IntegerField(required=False, allow_null=True)
    subject_id = serializers.IntegerField()
    teacher_id = serializers.IntegerField()
    room_id = serializers.IntegerField(required=False, allow_null=True)
    room_name = serializers.CharField(required=False, allow_null=True, max_length=100)
    
    def to_representation(self, instance):
        # Custom representation to handle class_id properly
        ret = super().to_representation(instance)
        # Ensure class_id is an integer
        if hasattr(instance, 'class_obj'):
            ret['class_id'] = instance.class_obj.id
            ret['class_name'] = instance.class_obj.name
        return ret

    class Meta:
        model = ClassSchedule
        fields = [
            'schedule_id', 'school_id', 'academic_session_id', 'class_id', 'section_id',
            'subject_id', 'teacher_id', 'room_id', 'room_name', 'day_of_week', 'period_number',
            'start_time', 'duration', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['schedule_id', 'created_at', 'updated_at', 'is_active']

    def validate(self, data):
        school_id = data.get('school_id')
        academic_session_id = data.get('academic_session_id')
        class_id = data.get('class_id')
        section_id = data.get('section_id')
        subject_id = data.get('subject_id')
        teacher_id = data.get('teacher_id')
        room_id = data.get('room_id')
        period_number = data.get('period_number')
        start_time = data.get('start_time')

        try:
            school = School.objects.get(school_id=school_id)
        except School.DoesNotExist:
            logger.error(f"School with school_id {school_id} does not exist.")
            raise serializers.ValidationError(f"School with school_id {school_id} does not exist.")

        try:
            academic_session = AcademicSession.objects.get(id=academic_session_id, school=school)
        except AcademicSession.DoesNotExist:
            logger.error(f"Academic session {academic_session_id} does not exist for school {school_id}.")
            raise serializers.ValidationError(f"Academic session does not exist.")

        try:
            class_obj = Class.objects.get(id=class_id, school=school)
        except Class.DoesNotExist:
            raise serializers.ValidationError(f"Class with id {class_id} does not exist.")

        if section_id:
            try:
                section = Section.objects.get(id=section_id, class_id=class_obj)
            except Section.DoesNotExist:
                raise serializers.ValidationError(f"Section with id {section_id} does not belong to class {class_id}.")
        else:
            section = None

        try:
            subject = Subject.objects.get(id=subject_id, classes=class_obj)
        except Subject.DoesNotExist:
            raise serializers.ValidationError(f"Subject with id {subject_id} is not assigned to class {class_id}.")

        try:
            teacher = Teacher.objects.get(id=teacher_id, staff__school=school)
        except Teacher.DoesNotExist:
            raise serializers.ValidationError(f"Teacher with id {teacher_id} does not exist.")

        if room_id:
            try:
                room = Room.objects.get(id=room_id, school=school)
            except Room.DoesNotExist:
                raise serializers.ValidationError(f"Room with id {room_id} does not exist.")
        else:
            room = None

        school_timing = SchoolTiming.objects.filter(school=school, academic_session=academic_session).first()
        if school_timing and period_number > school_timing.periods_per_day:
            raise serializers.ValidationError(f"Period number exceeds configured periods per day ({school_timing.periods_per_day}).")

        # Check for teacher conflicts
        conflicting_schedules = ClassSchedule.objects.filter(
            school=school,
            academic_session=academic_session,
            teacher=teacher,
            day_of_week=data.get('day_of_week'),
            start_time=start_time,
            is_active=True
        ).exclude(schedule_id=data.get('schedule_id'))
        if conflicting_schedules.exists():
            raise serializers.ValidationError(f"Teacher is already assigned at {start_time} on {data.get('day_of_week')}.")

        data['school'] = school
        data['academic_session'] = academic_session
        # Store class_id as integer instead of Class object
        data['class_obj'] = class_obj  # Store the actual object under a different key
        data['section'] = section
        data['subject'] = subject
        data['teacher'] = teacher
        data['room'] = room
        # Keep class_id as integer
        # data['class_id'] is already an integer from the request
        return data

class StaffDutySerializer(serializers.ModelSerializer):
    school_id = serializers.UUIDField(write_only=True)
    academic_session_id = serializers.IntegerField(write_only=True)
    staff_id = serializers.IntegerField()

    class Meta:
        model = StaffDuty
        fields = [
            'duty_id', 'school_id', 'academic_session_id', 'staff_id', 'duty_type',
            'location', 'day_of_week', 'start_time', 'duration', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['duty_id', 'created_at', 'updated_at', 'is_active']

    def validate(self, data):
        school_id = data.get('school_id')
        academic_session_id = data.get('academic_session_id')
        staff_id = data.get('staff_id')
        start_time = data.get('start_time')

        try:
            school = School.objects.get(school_id=school_id)
        except School.DoesNotExist:
            logger.error(f"School with school_id {school_id} does not exist.")
            raise serializers.ValidationError(f"School with school_id {school_id} does not exist.")

        try:
            academic_session = AcademicSession.objects.get(id=academic_session_id, school=school)
        except AcademicSession.DoesNotExist:
            logger.error(f"Academic session {academic_session_id} does not exist for school {school_id}.")
            raise serializers.ValidationError(f"Academic session does not exist.")

        try:
            staff = Staff.objects.get(id=staff_id, school=school)
        except Staff.DoesNotExist:
            raise serializers.ValidationError(f"Staff with id {staff_id} does not exist.")

        # Check for conflicts
        conflicting_duties = StaffDuty.objects.filter(
            school=school,
            academic_session=academic_session,
            staff=staff,
            day_of_week=data.get('day_of_week'),
            start_time=start_time,
            is_active=True
        ).exclude(duty_id=data.get('duty_id'))
        conflicting_schedules = ClassSchedule.objects.filter(
            school=school,
            academic_session=academic_session,
            teacher__staff=staff,
            day_of_week=data.get('day_of_week'),
            start_time=start_time,
            is_active=True
        )
        if conflicting_duties.exists() or conflicting_schedules.exists():
            raise serializers.ValidationError(f"Staff is already assigned at {start_time} on {data.get('day_of_week')}.")

        data['school'] = school
        data['academic_session'] = academic_session
        data['staff'] = staff
        return data

class ExamScheduleSerializer(serializers.ModelSerializer):
    school_id = serializers.UUIDField(write_only=True)
    academic_session_id = serializers.IntegerField(write_only=True)
    class_id = serializers.IntegerField()
    section_id = serializers.IntegerField(required=False, allow_null=True)
    subject_id = serializers.IntegerField()
    room_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = ExamSchedule
        fields = [
            'exam_id', 'school_id', 'academic_session_id', 'class_id', 'section_id',
            'subject_id', 'exam_date', 'start_time', 'duration', 'room_id',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['exam_id', 'created_at', 'updated_at', 'is_active']

    def validate(self, data):
        school_id = data.get('school_id')
        academic_session_id = data.get('academic_session_id')
        class_id = data.get('class_id')
        section_id = data.get('section_id')
        subject_id = data.get('subject_id')
        room_id = data.get('room_id')
        exam_date = data.get('exam_date')
        start_time = data.get('start_time')

        try:
            school = School.objects.get(school_id=school_id)
        except School.DoesNotExist:
            logger.error(f"School with school_id {school_id} does not exist.")
            raise serializers.ValidationError(f"School with school_id {school_id} does not exist.")

        try:
            academic_session = AcademicSession.objects.get(id=academic_session_id, school=school)
        except AcademicSession.DoesNotExist:
            logger.error(f"Academic session {academic_session_id} does not exist for school {school_id}.")
            raise serializers.ValidationError(f"Academic session does not exist.")

        try:
            class_obj = Class.objects.get(id=class_id, school=school)
        except Class.DoesNotExist:
            raise serializers.ValidationError(f"Class with id {class_id} does not exist.")

        if section_id:
            try:
                section = Section.objects.get(id=section_id, class_id=class_obj)
            except Section.DoesNotExist:
                raise serializers.ValidationError(f"Section with id {section_id} does not belong to class {class_id}.")
        else:
            section = None

        try:
            subject = Subject.objects.get(id=subject_id, classes=class_obj)
        except Subject.DoesNotExist:
            raise serializers.ValidationError(f"Subject with id {subject_id} is not assigned to class {class_id}.")

        if room_id:
            try:
                room = Room.objects.get(id=room_id, school=school)
            except Room.DoesNotExist:
                raise serializers.ValidationError(f"Room with id {room_id} does not exist.")
        else:
            room = None

        # Check if exam_date is within academic session
        if exam_date < academic_session.start_date or exam_date > academic_session.end_date:
            raise serializers.ValidationError(f"Exam date must be within the academic session ({academic_session.start_date} to {academic_session.end_date}).")

        data['school'] = school
        data['academic_session'] = academic_session
        data['class_id'] = class_obj
        data['section'] = section
        data['subject'] = subject
        data['room'] = room
        return data