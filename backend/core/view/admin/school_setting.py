import logging
import uuid
from decimal import Decimal
from email.mime.text import MIMEText
from smtplib import SMTP, SMTP_SSL, SMTPException

from django.contrib.auth.models import Group
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from drf_rw_serializers import viewsets as rw_viewsets
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from core.domain.teacher_assignment import ClassTeacher
from core.models import Class, FeeType, School, LocaleSettings, AcademicSession, Section, Term, Holiday, GradingSettings, AttendanceSettings, FeeSettings, Subject, FeeStructure
from core.models import NotificationSettings, NotificationTemplate, StaffRole, LeaveType, Department, Subject, GradingScale, PromotionRules, ClassCapacity, Campus, Building, Room, Resource
from core.pagination import CustomLimitOffsetPagination
from core.permissions import IsSuperUser, IsSchoolAssignedAdmin, IsSchoolAccountant
from core.serializers import ClassSerializer, FeeTypeSerializer, FeeSettingsReadSerializer, FeeSettingsWriteSerializer, FeeStructureReadSerializer, FeeStructureWriteSerializer, SchoolSerializer, LocaleSettingsSerializer, AcademicSessionSerializer, SectionSerializer, TermSerializer, HolidaySerializer, GradingSettingsSerializer, AttendanceSettingsSerializer, RoleSerializer, CampusSerializer, BuildingSerializer, RoomSerializer, ResourceSerializer
from core.serializers import NotificationSettingsSerializer, NotificationTemplateSerializer, StaffRoleSerializer, LeaveTypeSerializer, DepartmentSerializer, BulkLeaveAssignmentSerializer, SubjectSerializer, GradingScaleSerializer, PromotionRulesSerializer, ClassCapacitySerializer
from core.serial.admin.teacher_assignment_serializer import ClassTeacherSerializer
from core.views import IsSchoolAdmin

logger = logging.getLogger(__name__)

# core/views.py
class SchoolSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        logger.info(f"Fetching school settings for user: {request.user}")
        # Fetch the school associated with the logged-in user
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"Found school: {school.name}, ID: {school.school_id}")
        serializer = SchoolSerializer(school)
        return Response(serializer.data)

    def post(self, request):
        # Check if a school already exists for the user
        if request.user.school:
            return Response({"error": "School already configured for this user"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = SchoolSerializer(data=request.data)
        if serializer.is_valid():
            school = serializer.save()
            # Associate the school with the user
            request.user.school = school
            request.user.save()
            logger.info(f"School created and associated with user: {request.user}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        # Fetch the school associated with the logged-in user
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        serializer = SchoolSerializer(school, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"School updated: {school.name}, ID: {school.school_id}")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LocaleSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        logger.info(f"Fetching locale settings for user: {request.user}")
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        try:
            settings = LocaleSettings.objects.get(school=school)
            serializer = LocaleSettingsSerializer(settings)
            logger.info(f"Locale settings found for school: {school.name}")
            return Response(serializer.data)
        except LocaleSettings.DoesNotExist:
            logger.info(f"No locale settings found for school: {school.name}")
            return Response({"error": "Locale settings not configured"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        logger.info(f"Creating locale settings for user: {request.user}")
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        if LocaleSettings.objects.filter(school=school).exists():
            logger.warning(f"Locale settings already exist for school: {school.name}")
            return Response({"error": "Locale settings already configured for this school"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = LocaleSettingsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(school=school)
            logger.info(f"Locale settings created for school: {school.name}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        logger.info(f"Updating locale settings for user: {request.user}")
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        try:
            settings = LocaleSettings.objects.get(school=school)
        except LocaleSettings.DoesNotExist:
            logger.info(f"No locale settings found for school: {school.name}, creating new")
            settings = LocaleSettings(school=school)

        serializer = LocaleSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Locale settings updated for school: {school.name}")
            return Response(serializer.data)
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AcademicSessionView(APIView):
    permission_classes = [IsSchoolAssignedAdmin | IsSchoolAccountant]

    def get(self, request):
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        sessions = AcademicSession.objects.filter(school=school)
        serializer = AcademicSessionSerializer(sessions, many=True)
        logger.info(f"Fetched {len(sessions)} sessions for school: {school.name}")
        return Response(serializer.data)

    def post(self, request):
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"POST request data: {request.data}")
        serializer = AcademicSessionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Session created for school: {school.name}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, session_id):
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        try:
            session = AcademicSession.objects.get(id=session_id, school=school)
        except AcademicSession.DoesNotExist:
            logger.info(f"Session {session_id} not found for school: {school.name}")
            return Response({"error": "Session not found or does not belong to your school"}, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"PUT request data: {request.data}")
        serializer = AcademicSessionSerializer(session, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Session {session_id} updated for school: {school.name}")
            return Response(serializer.data)
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, session_id):
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        try:
            session = AcademicSession.objects.get(id=session_id, school=school)
        except AcademicSession.DoesNotExist:
            logger.info(f"Session {session_id} not found for school: {school.name}")
            return Response({"error": "Session not found or does not belong to your school"}, status=status.HTTP_404_NOT_FOUND)

        session.delete()
        logger.info(f"Session {session_id} deleted for school: {school.name}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class TermView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request, session_id):
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        try:
            AcademicSession.objects.get(id=session_id, school=school)
        except AcademicSession.DoesNotExist:
            logger.info(f"Session {session_id} not found for school: {school.name}")
            return Response({"error": "Session not found or does not belong to your school"}, status=status.HTTP_404_NOT_FOUND)

        terms = Term.objects.filter(session_id=session_id, school=school)
        serializer = TermSerializer(terms, many=True)
        logger.info(f"Fetched {len(terms)} terms for session {session_id} in school: {school.name}")
        return Response(serializer.data)

    def post(self, request, session_id):
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"POST term request data: {request.data}")
        serializer = TermSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Term created for session {session_id} in school: {school.name}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Term serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, session_id, term_id):
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        try:
            term = Term.objects.get(id=term_id, session_id=session_id, school=school)
        except Term.DoesNotExist:
            logger.info(f"Term {term_id} not found for session {session_id} in school: {school.name}")
            return Response({"error": "Term not found or does not belong to your school"}, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"PUT term request data: {request.data}")
        serializer = TermSerializer(term, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Term {term_id} updated for session {session_id} in school: {school.name}")
            return Response(serializer.data)
        logger.error(f"Term serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, session_id, term_id):
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        try:
            term = Term.objects.get(id=term_id, session_id=session_id, school=school)
        except Term.DoesNotExist:
            logger.info(f"Term {term_id} not found for session {session_id} in school: {school.name}")
            return Response({"error": "Term not found or does not belong to your school"}, status=status.HTTP_404_NOT_FOUND)

        term.is_active = False
        term.save()
        logger.info(f"Term {term_id} deactivated for session {session_id} in school: {school.name}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class HolidayView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request, session_id):
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        try:
            AcademicSession.objects.get(id=session_id, school=school)
        except AcademicSession.DoesNotExist:
            logger.info(f"Session {session_id} not found for school: {school.name}")
            return Response({"error": "Session not found or does not belong to your school"}, status=status.HTTP_404_NOT_FOUND)

        holidays = Holiday.objects.filter(session_id=session_id, school=school)
        serializer = HolidaySerializer(holidays, many=True)
        logger.info(f"Fetched {len(holidays)} holidays for session {session_id} in school: {school.name}")
        return Response(serializer.data)

    def post(self, request, session_id):
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"POST holiday request data: {request.data}")
        serializer = HolidaySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Holiday created for session {session_id} in school: {school.name}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Holiday serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, session_id, holiday_id):
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        try:
            holiday = Holiday.objects.get(id=holiday_id, session_id=session_id, school=school)
        except Holiday.DoesNotExist:
            logger.info(f"Holiday {holiday_id} not found for session {session_id} in school: {school.name}")
            return Response({"error": "Holiday not found or does not belong to your school"}, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"PUT holiday request data: {request.data}")
        serializer = HolidaySerializer(holiday, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Holiday {holiday_id} updated for session {session_id} in school: {school.name}")
            return Response(serializer.data)
        logger.error(f"Holiday serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, session_id, holiday_id):
        try:
            school = request.user.school
            if not school:
                logger.warning(f"No school associated with user: {request.user}")
                return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)
        except AttributeError:
            logger.warning(f"User {request.user} has no school attribute")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        try:
            holiday = Holiday.objects.get(id=holiday_id, session_id=session_id, school=school)
        except Holiday.DoesNotExist:
            logger.info(f"Holiday {holiday_id} not found for session {session_id} in school: {school.name}")
            return Response({"error": "Holiday not found or does not belong to your school"}, status=status.HTTP_404_NOT_FOUND)

        holiday.is_active = False
        holiday.save()
        logger.info(f"Holiday {holiday_id} deactivated for session {session_id} in school: {school.name}")
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    
class GradingSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        settings, created = GradingSettings.objects.get_or_create(school=request.user.school, defaults={
            'grading_type': 'percentage',
            'default_passing_grade': '40',
        })
        serializer = GradingSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        settings, created = GradingSettings.objects.get_or_create(school=request.user.school)
        serializer = GradingSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Grading settings updated for school {request.user.school}")
            return Response(serializer.data)
        logger.error(f"Grading settings errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AttendanceSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        settings, created = AttendanceSettings.objects.get_or_create(school=request.user.school, defaults={
            'marking_scheme': 'basic',
            'default_marking': 'P',
            'min_attendance_percentage': 75,
            'auto_notification': 'none',
            'notification_threshold': 75,
        })
        serializer = AttendanceSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        settings, created = AttendanceSettings.objects.get_or_create(school=request.user.school)
        serializer = AttendanceSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Attendance settings updated for school {request.user.school}")
            return Response(serializer.data)
        logger.error(f"Attendance settings errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FeeTypeViewSet(viewsets.ModelViewSet):
    queryset = FeeType.objects.all()
    serializer_class = FeeTypeSerializer
    lookup_url_kwarg = "fee_type_id"

    def get_school(self):
        return self.request.user.school

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        if user.is_superuser:
            return qs

        return qs.filter(school=user.school)

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsSchoolAssignedAdmin | IsSchoolAccountant]
        else:
            permission_classes = [IsSuperUser | IsSchoolAssignedAdmin | IsSchoolAccountant]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Create a single fee type or multiple fee types in bulk."""
        # Check if the incoming payload is a list (bulk creation)
        is_many = isinstance(request.data, list)

        serializer = self.get_serializer(data=request.data, many=is_many)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class FeeSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = FeeSettingsReadSerializer
    permission_classes = [IsSuperUser | IsSchoolAssignedAdmin]
    http_method_names = ["get", "put"]

    def get_object(self):
        school = self.request.user.school

        fee_settings, created = FeeSettings.objects.get_or_create(
            school=school,
            defaults={
                "due_day": 10,
                "late_fee_type": FeeSettings.LateFeeType.FIXED,
                "late_fee_amount": Decimal("0.00"),
                "grace_period_days": 0,
                "allow_partial_payment": True,
                "reminder_days": 5,
            },
        )

        return fee_settings

    def get_serializer_class(self):
        if self.request.method == "PUT":
            return FeeSettingsWriteSerializer
        return super().get_serializer_class()

    @extend_schema(request=FeeSettingsWriteSerializer, responses={200: FeeSettingsReadSerializer})
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)


class FeeStructureViewSet(rw_viewsets.ModelViewSet):
    queryset = FeeStructure.objects.select_related("academic_session", "school_class", "fee_type")
    pagination_class = CustomLimitOffsetPagination
    read_serializer_class = FeeStructureReadSerializer
    write_serializer_class = FeeStructureWriteSerializer
    lookup_url_kwarg = "fee_structure_id"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        if user.is_superuser:
            return qs

        return qs.filter(school=user.school)

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsSchoolAssignedAdmin | IsSchoolAccountant]
        else:
            permission_classes = [IsSuperUser | IsSchoolAssignedAdmin | IsSchoolAccountant]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(school=user.school, created_by=user, updated_by=user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if instance.status != FeeStructure.Status.DRAFT:
            raise ValidationError("Only draft fee structure can be deleted.")

        instance.delete()

    @action(detail=True, methods=["post"])
    def activate(self, request: Request, fee_structure_id=None):
        obj = self.get_object()

        if obj.status != FeeStructure.Status.DRAFT:
            raise ValidationError("Only draft fee structure can be activated.")

        obj.status = FeeStructure.Status.ACTIVE
        obj.save(update_fields=["status", "updated_at"])
        serializer = FeeStructureReadSerializer(obj, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def deactivate(self, request: Request, fee_structure_id=None):
        obj = self.get_object()

        if obj.status != FeeStructure.Status.ACTIVE:
            raise ValidationError("Only active fee structure can be deactivated.")

        obj.status = FeeStructure.Status.INACTIVE
        obj.save(update_fields=["status", "updated_at"])
        serializer = FeeStructureReadSerializer(obj, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_200_OK)


class NotificationSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        settings, created = NotificationSettings.objects.get_or_create(school=request.user.school, defaults={
            'smtp_host': '',
            'smtp_port': None,
            'smtp_username': '',
            'smtp_password': '',
            'smtp_encryption': 'none',
            'from_email': None,
            'from_name': '',
            'sms_provider': 'none',
            'sms_api_key': '',
            'sms_sender_id': ''
        })
        serializer = NotificationSettingsSerializer(settings)
        data = serializer.data
        data['smtp_password'] = ''  # Don't expose password
        return Response(data)

    def put(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        settings, created = NotificationSettings.objects.get_or_create(school=request.user.school)
        serializer = NotificationSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            data = serializer.data
            data['smtp_password'] = ''  # Don't return password
            return Response(data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NotificationTemplateListView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        templates = NotificationTemplate.objects.filter(school=request.user.school)
        serializer = NotificationTemplateSerializer(templates, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        if not data.get('template_id'):
            data['template_id'] = f'template_{uuid.uuid4().hex[:8]}'
        data['school'] = request.user.school.id
        serializer = NotificationTemplateSerializer(data=data)
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NotificationTemplateDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get_object(self, template_id, school):
        try:
            return NotificationTemplate.objects.get(template_id=template_id, school=school)
        except NotificationTemplate.DoesNotExist:
            return None

    def get(self, request, template_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        template = self.get_object(template_id, request.user.school)
        if not template:
            return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = NotificationTemplateSerializer(template)
        return Response(serializer.data)

    def put(self, request, template_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        template = self.get_object(template_id, request.user.school)
        if not template:
            return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = NotificationTemplateSerializer(template, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, template_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        template = self.get_object(template_id, request.user.school)
        if not template:
            return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
        template.is_active = False
        template.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class TestSMTPView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def post(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        settings = NotificationSettings.objects.filter(school=request.user.school).first()
        if not settings or not settings.smtp_host or not settings.smtp_port:
            return Response({"error": "SMTP settings incomplete"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            msg = MIMEText("This is a test email from your school management system.")
            msg['Subject'] = 'Test SMTP Email'
            msg['From'] = settings.from_email or 'test@school.com'
            msg['To'] = settings.from_email or 'test@testing.com'

            server = None
            if settings.smtp_encryption == 'ssl':
                server = SMTP_SSL(settings.smtp_host, settings.smtp_port)
            else:
                server = SMTP(settings.smtp_host, settings.smtp_port)
                if settings.smtp_encryption == 'tls':
                    server.starttls()

            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            
            server.send_message(msg)
            server.quit()
            return Response({"success": "SMTP test successful"}, status=status.HTTP_200_OK)
        except SMTPException as e:
            return Response({"error": f"SMTP error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
class RolePermissionsView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        roles = Group.objects.all()
        serializer = RoleSerializer(roles, many=True)
        return Response(serializer.data)

    def put(self, request, role_id):
        role = Group.objects.get(id=role_id)
        serializer = RoleSerializer(role, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StaffRoleView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        roles = StaffRole.objects.filter(school=request.user.school, is_active=True)
        serializer = StaffRoleSerializer(roles, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data['school'] = request.user.school.id
        serializer = StaffRoleSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create staff role error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, role_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            role = StaffRole.objects.get(id=role_id, school=request.user.school, is_active=True)
        except StaffRole.DoesNotExist:
            logger.error(f"Staff role with id {role_id} not found for school {request.user.school}")
            return Response({"error": "Staff role not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = StaffRoleSerializer(role, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update staff role error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, role_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            role = StaffRole.objects.get(id=role_id, school=request.user.school, is_active=True)
        except StaffRole.DoesNotExist:
            logger.error(f"Staff role with id {role_id} not found for school {request.user.school}")
            return Response({"error": "Staff role not found"}, status=status.HTTP_404_NOT_FOUND)
        role.is_active = False
        role.save()
        logger.info(f"Staff role '{role.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class LeaveTypeView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        leave_types = LeaveType.objects.filter(school=request.user.school, is_active=True)
        serializer = LeaveTypeSerializer(leave_types, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data['school'] = request.user.school.id
        serializer = LeaveTypeSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create leave type error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, leave_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            leave = LeaveType.objects.get(id=leave_id, school=request.user.school, is_active=True)
        except LeaveType.DoesNotExist:
            logger.error(f"Leave type with id {leave_id} not found for school {request.user.school}")
            return Response({"error": "Leave type not found"}, status=status.HTTP_404_NOT_FOUND)
        if leave.is_system_leave:
            logger.warning(f"Attempt to modify system leave type {leave_id} by user {request.user}")
            return Response({"error": "System leave types cannot be modified"}, status=status.HTTP_403_FORBIDDEN)
        serializer = LeaveTypeSerializer(leave, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update leave type error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, leave_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            leave = LeaveType.objects.get(id=leave_id, school=request.user.school, is_active=True)
        except LeaveType.DoesNotExist:
            logger.error(f"Leave type with id {leave_id} not found for school {request.user.school}")
            return Response({"error": "Leave type not found"}, status=status.HTTP_404_NOT_FOUND)
        if leave.is_system_leave:
            logger.warning(f"Attempt to delete system leave type {leave_id} by user {request.user}")
            return Response({"error": "System leave types cannot be deleted"}, status=status.HTTP_403_FORBIDDEN)
        leave.is_active = False
        leave.save()
        logger.info(f"Leave type '{leave.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class DepartmentView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        departments = Department.objects.filter(school=request.user.school, is_active=True)
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data['school'] = request.user.school.id
        serializer = DepartmentSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create department error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, dept_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            department = Department.objects.get(id=dept_id, school=request.user.school, is_active=True)
        except Department.DoesNotExist:
            logger.error(f"Department with id {dept_id} not found for school {request.user.school}")
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = DepartmentSerializer(department, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update department error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, dept_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            department = Department.objects.get(id=dept_id, school=request.user.school, is_active=True)
        except Department.DoesNotExist:
            logger.error(f"Department with id {dept_id} not found for school {request.user.school}")
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)
        department.is_active = False
        department.save()
        logger.info(f"Department '{department.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)
        
class BulkLeaveAssignmentView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def post(self, request):
        serializer = BulkLeaveAssignmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ClassView(APIView):
    permission_classes = [IsSchoolAssignedAdmin | IsSchoolAccountant]

    def get(self, request, class_id=None):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        if class_id:
            try:
                class_obj = Class.objects.get(id=class_id, school=request.user.school, is_active=True)
                serializer = ClassSerializer(class_obj)
                return Response(serializer.data)
            except Class.DoesNotExist:
                logger.error(f"Class with id {class_id} not found for school {request.user.school}")
                return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
        classes = Class.objects.filter(school=request.user.school, is_active=True)
        serializer = ClassSerializer(classes, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data['school'] = request.user.school.id
        serializer = ClassSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create class error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, class_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            class_obj = Class.objects.get(id=class_id, school=request.user.school, is_active=True)
        except Class.DoesNotExist:
            logger.error(f"Class with id {class_id} not found for school {request.user.school}")
            return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
        if 'subject_ids' in request.data:
            subject_ids = request.data.get('subject_ids', [])
            subjects = Subject.objects.filter(id__in=subject_ids, school=request.user.school, is_active=True)
            class_obj.subjects.set(subjects)
            logger.info(f"Updated subjects for class {class_id} by user {request.user}")
            return Response(ClassSerializer(class_obj).data)
        serializer = ClassSerializer(class_obj, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update class error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, class_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            class_obj = Class.objects.get(id=class_id, school=request.user.school, is_active=True)
        except Class.DoesNotExist:
            logger.error(f"Class with id {class_id} not found for school {request.user.school}")
            return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
        if class_obj.sections.exists() or class_obj.class_teachers.exists():
            logger.warning(f"Attempt to delete class {class_id} with sections or teachers by user {request.user}")
            return Response({"error": "Cannot delete class with associated sections or teacher assignments"}, status=status.HTTP_400_BAD_REQUEST)
        class_obj.is_active = False
        class_obj.save()
        logger.info(f"Class '{class_obj.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class SectionView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request, class_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            class_obj = Class.objects.get(id=class_id, school=request.user.school, is_active=True)
        except Class.DoesNotExist:
            logger.error(f"Class with id {class_id} not found for school {request.user.school}")
            return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
        sections = Section.objects.filter(class_id=class_obj, is_active=True)
        serializer = SectionSerializer(sections, many=True)
        return Response(serializer.data)

    def post(self, request, class_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            class_obj = Class.objects.get(id=class_id, school=request.user.school, is_active=True)
        except Class.DoesNotExist:
            logger.error(f"Class with id {class_id} not found for school {request.user.school}")
            return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data['class_id'] = class_id
        data['school'] = request.user.school.id
        serializer = SectionSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school, class_id=class_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create section error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, class_id, section_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            section = Section.objects.get(id=section_id, class_id=class_id, school=request.user.school, is_active=True)
        except Section.DoesNotExist:
            logger.error(f"Section with id {section_id} not found for school {request.user.school}")
            return Response({"error": "Section not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = SectionSerializer(section, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update section error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, class_id, section_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            section = Section.objects.get(id=section_id, class_id=class_id, school=request.user.school, is_active=True)
        except Section.DoesNotExist:
            logger.error(f"Section with id {section_id} not found for school {request.user.school}")
            return Response({"error": "Section not found"}, status=status.HTTP_404_NOT_FOUND)
        section.is_active = False
        section.save()
        logger.info(f"Section '{section.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class ClassSubjectsView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request, class_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            class_obj = Class.objects.get(id=class_id, school=request.user.school, is_active=True)
        except Class.DoesNotExist:
            return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
        
        subjects = class_obj.subjects.filter(is_active=True)
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)

    def put(self, request, class_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            class_obj = Class.objects.get(id=class_id, school=request.user.school, is_active=True)
        except Class.DoesNotExist:
            return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
        
        subject_ids = request.data.get('subject_ids', [])
        subjects = Subject.objects.filter(id__in=subject_ids, school=request.user.school, is_active=True)
        class_obj.subjects.set(subjects)
        logger.info(f"Subjects updated for class '{class_obj.name}' by user {request.user}")
        return Response({"message": "Subjects updated successfully"})

class SubjectView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        subjects = Subject.objects.filter(school=request.user.school, is_active=True)
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        if not Class.objects.filter(school=request.user.school, is_active=True).exists():
            logger.error("Attempt to create subject with no active classes")
            return Response({"error": "At least one active class must exist before adding subjects"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data['school'] = request.user.school.id
        serializer = SubjectSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create subject error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, subject_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            subject = Subject.objects.get(id=subject_id, school=request.user.school, is_active=True)
        except Subject.DoesNotExist:
            logger.error(f"Subject with id {subject_id} not found for school {request.user.school}")
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = SubjectSerializer(subject, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update subject error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, subject_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            subject = Subject.objects.get(id=subject_id, school=request.user.school, is_active=True)
        except Subject.DoesNotExist:
            logger.error(f"Subject with id {subject_id} not found for school {request.user.school}")
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)
        subject.is_active = False
        subject.save()
        logger.info(f"Subject '{subject.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class GradingScaleView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        scales = GradingScale.objects.filter(school=request.user.school, is_active=True)
        serializer = GradingScaleSerializer(scales, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data['school'] = request.user.school.id
        serializer = GradingScaleSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create grading scale error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, scale_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            scale = GradingScale.objects.get(id=scale_id, school=request.user.school, is_active=True)
        except GradingScale.DoesNotExist:
            logger.error(f"Grading scale with id {scale_id} not found for school {request.user.school}")
            return Response({"error": "Grading scale not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = GradingScaleSerializer(scale, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update grading scale error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, scale_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            scale = GradingScale.objects.get(id=scale_id, school=request.user.school, is_active=True)
        except GradingScale.DoesNotExist:
            logger.error(f"Grading scale with id {scale_id} not found for school {request.user.school}")
            return Response({"error": "Grading scale not found"}, status=status.HTTP_404_NOT_FOUND)
        scale.is_active = False
        scale.save()
        logger.info(f"Grading scale '{scale.grade}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class PromotionRulesView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        rules = PromotionRules.objects.filter(school=request.user.school).first()
        if not rules:
            return Response({
                'min_overall_percentage': 0,
                'max_failed_subjects': 0,
                'consider_attendance': False
            })
        serializer = PromotionRulesSerializer(rules)
        return Response(serializer.data)

    def put(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        rules = PromotionRules.objects.filter(school=request.user.school).first()
        data = request.data.copy()
        data['school'] = request.user.school.id
        serializer = PromotionRulesSerializer(rules, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            if not rules:
                serializer.save(school=request.user.school)
            else:
                serializer.save()
            logger.info(f"Promotion rules updated by user {request.user} for school {request.user.school}")
            return Response(serializer.data)
        logger.error(f"Update promotion rules error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ClassCapacityView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        capacity = ClassCapacity.objects.filter(school=request.user.school).first()
        if not capacity:
            return Response({
                'max_students': 0,
                'min_students': 0
            })
        serializer = ClassCapacitySerializer(capacity)
        return Response(serializer.data)

    def put(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        capacity = ClassCapacity.objects.filter(school=request.user.school).first()
        data = request.data.copy()
        data['school'] = request.user.school.id
        serializer = ClassCapacitySerializer(capacity, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            if not capacity:
                serializer.save(school=request.user.school)
            else:
                serializer.save()
            logger.info(f"Class capacity updated by user {request.user} for school {request.user.school}")
            return Response(serializer.data)
        logger.error(f"Update class capacity error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
class CampusView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        campuses = Campus.objects.filter(school=request.user.school, is_active=True)
        serializer = CampusSerializer(campuses, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data['school'] = request.user.school.id
        serializer = CampusSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            logger.info(f"Campus '{serializer.data['name']}' created by user {request.user}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create campus error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, campus_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            campus = Campus.objects.get(id=campus_id, school=request.user.school, is_active=True)
        except Campus.DoesNotExist:
            logger.error(f"Campus with id {campus_id} not found for school {request.user.school}")
            return Response({"error": "Campus not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = CampusSerializer(campus, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Campus '{campus.name}' updated by user {request.user}")
            return Response(serializer.data)
        logger.error(f"Update campus error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, campus_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            campus = Campus.objects.get(id=campus_id, school=request.user.school, is_active=True)
        except Campus.DoesNotExist:
            logger.error(f"Campus with id {campus_id} not found for school {request.user.school}")
            return Response({"error": "Campus not found"}, status=status.HTTP_404_NOT_FOUND)
        if campus.buildings.filter(is_active=True).exists():
            logger.warning(f"Attempt to delete campus {campus_id} with active buildings by user {request.user}")
            return Response({"error": "Cannot delete campus with active buildings"}, status=status.HTTP_400_BAD_REQUEST)
        campus.is_active = False
        campus.save()
        logger.info(f"Campus '{campus.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class BuildingView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request, campus_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            campus = Campus.objects.get(id=campus_id, school=request.user.school, is_active=True)
        except Campus.DoesNotExist:
            logger.error(f"Campus with id {campus_id} not found for school {request.user.school}")
            return Response({"error": "Campus not found"}, status=status.HTTP_404_NOT_FOUND)
        buildings = Building.objects.filter(campus_id=campus, school=request.user.school, is_active=True)
        serializer = BuildingSerializer(buildings, many=True)
        return Response(serializer.data)

    def post(self, request, campus_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            campus = Campus.objects.get(id=campus_id, school=request.user.school, is_active=True)
        except Campus.DoesNotExist:
            logger.error(f"Campus with id {campus_id} not found for school {request.user.school}")
            return Response({"error": "Campus not found"}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data['campus'] = campus_id
        data['school'] = request.user.school.id
        serializer = BuildingSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school, campus=campus)
            logger.info(f"Building '{serializer.data['name']}' created by user {request.user}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create building error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, campus_id, building_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            building = Building.objects.get(id=building_id, campus_id=campus_id, school=request.user.school, is_active=True)
        except Building.DoesNotExist:
            logger.error(f"Building with id {building_id} not found for campus {campus_id} and school {request.user.school}")
            return Response({"error": "Building not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = BuildingSerializer(building, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Building '{building.name}' updated by user {request.user}")
            return Response(serializer.data)
        logger.error(f"Update building error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, campus_id, building_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            building = Building.objects.get(id=building_id, campus_id=campus_id, school=request.user.school, is_active=True)
        except Building.DoesNotExist:
            logger.error(f"Building with id {building_id} not found for campus {campus_id} and school {request.user.school}")
            return Response({"error": "Building not found"}, status=status.HTTP_404_NOT_FOUND)
        if building.rooms.filter(is_active=True).exists():
            logger.warning(f"Attempt to delete building {building_id} with active rooms by user {request.user}")
            return Response({"error": "Cannot delete building with active rooms"}, status=status.HTTP_400_BAD_REQUEST)
        building.is_active = False
        building.save()
        logger.info(f"Building '{building.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class RoomView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request, building_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            building = Building.objects.get(id=building_id, school=request.user.school, is_active=True)
        except Building.DoesNotExist:
            logger.error(f"Building with id {building_id} not found for school {request.user.school}")
            return Response({"error": "Building not found"}, status=status.HTTP_404_NOT_FOUND)
        rooms = Room.objects.filter(building_id=building, school=request.user.school, is_active=True)
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)

    def post(self, request, building_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            building = Building.objects.get(id=building_id, school=request.user.school, is_active=True)
        except Building.DoesNotExist:
            logger.error(f"Building with id {building_id} not found for school {request.user.school}")
            return Response({"error": "Building not found"}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data['building'] = building_id
        data['school'] = request.user.school.id
        serializer = RoomSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school, building=building)
            logger.info(f"Room '{serializer.data['name']}' created by user {request.user}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create room error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, building_id, room_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            room = Room.objects.get(id=room_id, building_id=building_id, school=request.user.school, is_active=True)
        except Room.DoesNotExist:
            logger.error(f"Room with id {room_id} not found for building {building_id} and school {request.user.school}")
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = RoomSerializer(room, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Room '{room.name}' updated by user {request.user}")
            return Response(serializer.data)
        logger.error(f"Update room error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, building_id, room_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            room = Room.objects.get(id=room_id, building_id=building_id, school=request.user.school, is_active=True)
        except Room.DoesNotExist:
            logger.error(f"Room with id {room_id} not found for building {building_id} and school {request.user.school}")
            return Response({"error": "Room not found"}, status=status.HTTP_404_NOT_FOUND)
        room.is_active = False
        room.save()
        logger.info(f"Room '{room.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class ResourceView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        resources = Resource.objects.filter(school=request.user.school, is_active=True)
        serializer = ResourceSerializer(resources, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data['school'] = request.user.school.id
        serializer = ResourceSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            logger.info(f"Resource '{serializer.data['name']}' created by user {request.user}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create resource error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, resource_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            resource = Resource.objects.get(id=resource_id, school=request.user.school, is_active=True)
        except Resource.DoesNotExist:
            logger.error(f"Resource with id {resource_id} not found for school {request.user.school}")
            return Response({"error": "Resource not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ResourceSerializer(resource, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Resource '{resource.name}' updated by user {request.user}")
            return Response(serializer.data)
        logger.error(f"Update resource error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, resource_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            resource = Resource.objects.get(id=resource_id, school=request.user.school, is_active=True)
        except Resource.DoesNotExist:
            logger.error(f"Resource with id {resource_id} not found for school {request.user.school}")
            return Response({"error": "Resource not found"}, status=status.HTTP_404_NOT_FOUND)
        resource.is_active = False
        resource.save()
        logger.info(f"Resource '{resource.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)