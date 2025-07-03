from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import SchoolTiming, Break, ClassSchedule, StaffDuty, ExamSchedule, Class, Section, Subject, Teacher, Room, AcademicSession
from core.serial.admin.sheduleSerial import SchoolTimingSerializer, BreakSerializer, ClassScheduleSerializer, StaffDutySerializer, ExamScheduleSerializer
from django.db.models import Q
from datetime import time, timedelta, timezone
import random
import logging

logger = logging.getLogger(__name__)

class SchoolTimingViewSet(viewsets.ModelViewSet):
    queryset = SchoolTiming.objects.all()
    serializer_class = SchoolTimingSerializer

    def get_queryset(self):
        return SchoolTiming.objects.filter(school__school_id=self.request.user.school.school_id)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

class BreakViewSet(viewsets.ModelViewSet):
    queryset = Break.objects.all()
    serializer_class = BreakSerializer

    def get_queryset(self):
        return Break.objects.filter(school_timing__school__school_id=self.request.user.school.school_id)

class ClassScheduleViewSet(viewsets.ModelViewSet):
    queryset = ClassSchedule.objects.all()
    serializer_class = ClassScheduleSerializer

    def get_queryset(self):
        school_id = self.request.user.school.school_id
        academic_session_id = self.request.query_params.get('academic_session_id')
        queryset = ClassSchedule.objects.filter(school__school_id=school_id, is_active=True)
        if academic_session_id:
            queryset = queryset.filter(academic_session_id=academic_session_id)
        return queryset.order_by('day_of_week', 'period_number')

    @action(detail=False, methods=['post'], url_path='auto-generate')
    def auto_generate_schedule(self, request):
        school_id = request.user.school.school_id
        academic_session_id = request.data.get('academic_session_id')
        try:
            academic_session = AcademicSession.objects.get(id=academic_session_id, school__school_id=school_id, status='active')
        except AcademicSession.DoesNotExist:
            logger.error(f"Active academic session {academic_session_id} not found for school {school_id}.")
            return Response({"error": "Active academic session not found."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            school_timing = SchoolTiming.objects.get(school__school_id=school_id, academic_session=academic_session)
        except SchoolTiming.DoesNotExist:
            logger.error(f"School timing not configured for academic session {academic_session_id}.")
            return Response({"error": "School timing not configured."}, status=status.HTTP_400_BAD_REQUEST)

        # Clear existing schedules for the academic session
        ClassSchedule.objects.filter(school__school_id=school_id, academic_session=academic_session).delete()

        classes = Class.objects.filter(school__school_id=school_id, is_active=True)
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        schedules = []

        for class_obj in classes:
            sections = Section.objects.filter(class_id=class_obj, is_active=True)
            subjects = Subject.objects.filter(classes=class_obj, is_active=True)
            for section in sections or [None]:
                for day in days:
                    current_time = school_timing.start_time
                    period = 1
                    breaks = Break.objects.filter(school_timing=school_timing).order_by('order')
                    break_index = 0

                    while period <= school_timing.periods_per_day and current_time < school_timing.end_time:
                        # Check for breaks
                        if break_index < len(breaks) and current_time >= breaks[break_index].start_time:
                            current_time = (timezone.datetime.combine(timezone.now(), breaks[break_index].start_time) + 
                                            timedelta(minutes=breaks[break_index].duration)).time()
                            break_index += 1
                            continue

                        # Find available teacher
                        teachers = Teacher.objects.filter(
                            staff__school__school_id=school_id,
                            subjects__in=subjects
                        ).distinct()
                        random.shuffle(list(teachers))
                        available_teacher = None
                        for teacher in teachers:
                            if not ClassSchedule.objects.filter(
                                school__school_id=school_id,
                                academic_session=academic_session,
                                teacher=teacher,
                                day_of_week=day,
                                start_time=current_time,
                                is_active=True
                            ).exists() and not StaffDuty.objects.filter(
                                school__school_id=school_id,
                                academic_session=academic_session,
                                staff=teacher.staff,
                                day_of_week=day,
                                start_time=current_time,
                                is_active=True
                            ).exists():
                                available_teacher = teacher
                                break

                        if not available_teacher:
                            logger.warning(f"No available teacher for {class_obj.name} {section.name if section else ''} on {day} period {period}")
                            continue

                        # Select subject
                        subject = random.choice(list(subjects))
                        # Select room (optional)
                        room = Room.objects.filter(school__school_id=school_id, is_active=True).order_by('?').first()

                        schedules.append({
                            'school': request.user.school,
                            'academic_session': academic_session,
                            'class_id': class_obj,
                            'section': section,
                            'subject': subject,
                            'teacher': available_teacher,
                            'room': room,
                            'day_of_week': day,
                            'period_number': period,
                            'start_time': current_time,
                            'duration': school_timing.period_duration,
                            'is_active': True
                        })

                        current_time = (timezone.datetime.combine(timezone.now(), current_time) + 
                                        timedelta(minutes=school_timing.period_duration)).time()
                        period += 1

        serializer = ClassScheduleSerializer(data=schedules, many=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Auto-generated {len(schedules)} schedules for school {school_id}.")
            return Response({"message": f"Generated {len(schedules)} schedules."}, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Auto-generate schedule errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StaffDutyViewSet(viewsets.ModelViewSet):
    queryset = StaffDuty.objects.all()
    serializer_class = StaffDutySerializer

    def get_queryset(self):
        school_id = self.request.user.school.school_id
        academic_session_id = self.request.query_params.get('academic_session_id')
        queryset = StaffDuty.objects.filter(school__school_id=school_id, is_active=True)
        if academic_session_id:
            queryset = queryset.filter(academic_session_id=academic_session_id)
        return queryset.order_by('day_of_week', 'start_time')

class ExamScheduleViewSet(viewsets.ModelViewSet):
    queryset = ExamSchedule.objects.all()
    serializer_class = ExamScheduleSerializer

    def get_queryset(self):
        school_id = self.request.user.school.school_id
        academic_session_id = self.request.query_params.get('academic_session_id')
        queryset = ExamSchedule.objects.filter(school__school_id=school_id, is_active=True)
        if academic_session_id:
            queryset = queryset.filter(academic_session_id=academic_session_id)
        return queryset.order_by('exam_date', 'start_time')