from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from core.models import Class, FeeType, School,LocaleSettings,AcademicSession, Section, Term, Holiday,GradingSettings, AttendanceSettings, FeeSettings
from core.serializers import ClassSerializer, FeeTypeSerializer, SchoolSerializer,LocaleSettingsSerializer, AcademicSessionSerializer, SectionSerializer, TermSerializer, HolidaySerializer, GradingSettingsSerializer, AttendanceSettingsSerializer, FeeSettingsSerializer, RoleSerializer, CampusSerializer, BuildingSerializer, RoomSerializer, ResourceSerializer
from core.models import NotificationSettings, NotificationTemplate, StaffRole, LeaveType, Department, Subject, GradingScale, PromotionRules, ClassCapacity, Campus, Building, Room, Resource
from core.serializers import NotificationSettingsSerializer, NotificationTemplateSerializer, StaffRoleSerializer, LeaveTypeSerializer, DepartmentSerializer, BulkLeaveAssignmentSerializer, SubjectSerializer, GradingScaleSerializer, PromotionRulesSerializer, ClassCapacitySerializer
from django.contrib.auth.models import Group
from smtplib import SMTP, SMTP_SSL
from email.mime.text import MIMEText

import logging
logger = logging.getLogger(__name__)


class SchoolSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        school = School.objects.first()
        if not school:
            return Response({"error": "School not configured"}, status=status.HTTP_404_NOT_FOUND)
        serializer = SchoolSerializer(school)
        return Response(serializer.data)

    def post(self, request):
        if School.objects.exists():
            return Response({"error": "School already configured"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = SchoolSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        school = School.objects.first()
        if not school:
            return Response({"error": "School not configured"}, status=status.HTTP_404_NOT_FOUND)
        serializer = SchoolSerializer(school, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class LocaleSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        settings = LocaleSettings.objects.first()
        if not settings:
            return Response({"error": "Locale settings not configured"}, status=status.HTTP_404_NOT_FOUND)
        serializer = LocaleSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        logger.info(f"PUT request data: {request.data}")
        settings = LocaleSettings.objects.first()
        if not settings:
            settings = LocaleSettings()
        serializer = LocaleSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AcademicSessionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        sessions = AcademicSession.objects.all()
        serializer = AcademicSessionSerializer(sessions, many=True)
        return Response(serializer.data)

    def post(self, request):
        logger.info(f"POST request data: {request.data}")
        serializer = AcademicSessionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info("Session created successfully")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, session_id):
        try:
            session = AcademicSession.objects.get(id=session_id)
        except AcademicSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
        logger.info(f"PUT request data: {request.data}")
        serializer = AcademicSessionSerializer(session, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info("Session updated successfully")
            return Response(serializer.data)
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, session_id):
        try:
            session = AcademicSession.objects.get(id=session_id)
        except AcademicSession.DoesNotExist:
            return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
        session.delete()
        logger.info("Session deleted successfully")
        return Response(status=status.HTTP_204_NO_CONTENT)

class TermView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, session_id):
        terms = Term.objects.filter(session_id=session_id)
        serializer = TermSerializer(terms, many=True)
        return Response(serializer.data)

    def post(self, request, session_id):
        logger.info(f"POST term request data: {request.data}")
        serializer = TermSerializer(data=request.data, context={'session_id': session_id})
        if serializer.is_valid():
            serializer.save()
            logger.info("Term created successfully")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Term serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, session_id, term_id):
        try:
            term = Term.objects.get(id=term_id, session_id=session_id)
        except Term.DoesNotExist:
            return Response({"error": "Term not found"}, status=status.HTTP_404_NOT_FOUND)
        logger.info(f"PUT term request data: {request.data}")
        serializer = TermSerializer(term, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info("Term updated successfully")
            return Response(serializer.data)
        logger.error(f"Term serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, session_id, term_id):
        try:
            term = Term.objects.get(id=term_id, session_id=session_id)
        except Term.DoesNotExist:
            return Response({"error": "Term not found"}, status=status.HTTP_404_NOT_FOUND)
        term.is_active = False
        term.save()
        logger.info("Term deactivated successfully")
        return Response(status=status.HTTP_204_NO_CONTENT)

class HolidayView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, session_id):
        holidays = Holiday.objects.filter(session_id=session_id)
        serializer = HolidaySerializer(holidays, many=True)
        return Response(serializer.data)

    def post(self, request, session_id):
        logger.info(f"POST holiday request data: {request.data}")
        serializer = HolidaySerializer(data=request.data, context={'session_id': session_id})
        if serializer.is_valid():
            serializer.save()
            logger.info("Holiday created successfully")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Holiday serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, session_id, holiday_id):
        try:
            holiday = Holiday.objects.get(id=holiday_id, session_id=session_id)
        except Holiday.DoesNotExist:
            return Response({"error": "Holiday not found"}, status=status.HTTP_404_NOT_FOUND)
        logger.info(f"PUT holiday request data: {request.data}")
        serializer = HolidaySerializer(holiday, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info("Holiday updated successfully")
            return Response(serializer.data)
        logger.error(f"Holiday serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, session_id, holiday_id):
        try:
            holiday = Holiday.objects.get(id=holiday_id, session_id=session_id)
        except Holiday.DoesNotExist:
            return Response({"error": "Holiday not found"}, status=status.HTTP_404_NOT_FOUND)
        holiday.is_active = False
        holiday.save()
        logger.info("Holiday deactivated successfully")
        return Response(status=status.HTTP_204_NO_CONTENT)


class GradingSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

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
    permission_classes = [IsAuthenticated, IsAdminUser]

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

class FeeTypeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        fee_types = FeeType.objects.filter(school=request.user.school)
        serializer = FeeTypeSerializer(fee_types, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = FeeTypeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            logger.info(f"Fee type created for school {request.user.school}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Fee type errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, fee_type_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        fee_type = get_object_or_404(FeeType, id=fee_type_id, school=request.user.school)
        serializer = FeeTypeSerializer(fee_type, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Fee type updated for school {request.user.school}")
            return Response(serializer.data)
        logger.error(f"Fee type errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, fee_type_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        fee_type = get_object_or_404(FeeType, id=fee_type_id, school=request.user.school)
        fee_type.delete()
        logger.info(f"Fee type deleted for school {request.user.school}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class FeeSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        settings, created = FeeSettings.objects.get_or_create(school=request.user.school, defaults={
            'due_date': 10,
            'late_fee_type': 'fixed',
            'late_fee_amount': 0.00,
            'reminder_days': 5,
        })
        serializer = FeeSettingsSerializer(settings)
        return Response(serializer.data)

    def put(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        settings, created = FeeSettings.objects.get_or_create(school=request.user.school)
        serializer = FeeSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Fee settings updated for school {request.user.school}")
            return Response(serializer.data)
        logger.error(f"Fee settings errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# core/views/admin/school_setting.py
class NotificationSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        settings = NotificationSettings.objects.first()
        if not settings:
            return Response({
                'smtp_host': '',
                'smtp_port': None,
                'smtp_username': '',
                'smtp_password': '',
                'smtp_encryption': 'none',
                'from_email': '',
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
        settings = NotificationSettings.objects.first()
        if not settings:
            settings = NotificationSettings()
        serializer = NotificationSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            data = serializer.data
            data['smtp_password'] = ''  # Don't return password
            return Response(data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# core/views/admin/school_setting.py
import uuid

class NotificationTemplateListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        templates = NotificationTemplate.objects.all()
        serializer = NotificationTemplateSerializer(templates, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        if not data.get('template_id'):
            data['template_id'] = f'template_{uuid.uuid4().hex[:8]}'
        serializer = NotificationTemplateSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NotificationTemplateDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_object(self, template_id):
        try:
            return NotificationTemplate.objects.get(template_id=template_id)
        except NotificationTemplate.DoesNotExist:
            return None

    def put(self, request, template_id):
        template = self.get_object(template_id)
        if not template:
            return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = NotificationTemplateSerializer(template, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, template_id):
        template = self.get_object(template_id)
        if not template:
            return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
        template.is_active = False
        template.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class TestSMTPView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        settings = NotificationSettings.objects.first()
        if not settings or not settings.smtp_host or not settings.smtp_port:
            return Response({"error": "SMTP settings incomplete"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            msg = MIMEText("This is a test email from your school management system.")
            msg['Subject'] = 'Test SMTP Email'
            msg['From'] = settings.from_email or 'test@school.com'
            msg['To'] = settings.from_email or 'test@example.com'  # Replace with a real email

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
            return Response({"status": "SMTP test successful"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RolePermissionsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

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
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        roles = StaffRole.objects.filter(is_active=True)
        serializer = StaffRoleSerializer(roles, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = StaffRoleSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create staff role error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, role_id):
        try:
            role = StaffRole.objects.get(id=role_id, is_active=True)
        except StaffRole.DoesNotExist:
            logger.error(f"Staff role with id {role_id} not found")
            return Response({"error": "Staff role not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = StaffRoleSerializer(role, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update staff role error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, role_id):
        try:
            role = StaffRole.objects.get(id=role_id, is_active=True)
        except StaffRole.DoesNotExist:
            logger.error(f"Staff role with id {role_id} not found")
            return Response({"error": "Staff role not found"}, status=status.HTTP_404_NOT_FOUND)
        role.is_active = False
        role.save()
        logger.info(f"Staff role '{role.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class LeaveTypeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        leave_types = LeaveType.objects.filter(is_active=True)
        serializer = LeaveTypeSerializer(leave_types, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = LeaveTypeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create leave type error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, leave_id):
        try:
            leave = LeaveType.objects.get(id=leave_id, is_active=True)
        except LeaveType.DoesNotExist:
            logger.error(f"Leave type with id {leave_id} not found")
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
        try:
            leave = LeaveType.objects.get(id=leave_id, is_active=True)
        except LeaveType.DoesNotExist:
            logger.error(f"Leave type with id {leave_id} not found")
            return Response({"error": "Leave type not found"}, status=status.HTTP_404_NOT_FOUND)
        if leave.is_system_leave:
            logger.warning(f"Attempt to delete system leave type {leave_id} by user {request.user}")
            return Response({"error": "System leave types cannot be deleted"}, status=status.HTTP_403_FORBIDDEN)
        leave.is_active = False
        leave.save()
        logger.info(f"Leave type '{leave.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class DepartmentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        departments = Department.objects.filter(is_active=True)
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DepartmentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create department error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, dept_id):
        try:
            department = Department.objects.get(id=dept_id, is_active=True)
        except Department.DoesNotExist:
            logger.error(f"Department with id {dept_id} not found")
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = DepartmentSerializer(department, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update department error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, dept_id):
        try:
            department = Department.objects.get(id=dept_id, is_active=True)
        except Department.DoesNotExist:
            logger.error(f"Department with id {dept_id} not found")
            return Response({"error": "Department not found"}, status=status.HTTP_404_NOT_FOUND)
        department.is_active = False
        department.save()
        logger.info(f"Department '{department.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class BulkLeaveAssignmentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        serializer = BulkLeaveAssignmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ClassView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        classes = Class.objects.filter(is_active=True)
        serializer = ClassSerializer(classes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ClassSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create class error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, class_id):
        try:
            class_obj = Class.objects.get(id=class_id, is_active=True)
        except Class.DoesNotExist:
            logger.error(f"Class with id {class_id} not found")
            return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClassSerializer(class_obj, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update class error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, class_id):
        try:
            class_obj = Class.objects.get(id=class_id, is_active=True)
        except Class.DoesNotExist:
            logger.error(f"Class with id {class_id} not found")
            return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
        if class_obj.sections.exists():
            logger.warning(f"Attempt to delete class {class_id} with sections by user {request.user}")
            return Response({"error": "Cannot delete class with associated sections"}, status=status.HTTP_400_BAD_REQUEST)
        class_obj.is_active = False
        class_obj.save()
        logger.info(f"Class '{class_obj.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class SectionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, class_id):
        sections = Section.objects.filter(class_id=class_id, is_active=True)
        serializer = SectionSerializer(sections, many=True)
        return Response(serializer.data)

    def post(self, request, class_id):
        try:
            class_obj = Class.objects.get(id=class_id, is_active=True)
        except Class.DoesNotExist:
            logger.error(f"Class with id {class_id} not found")
            return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data['class_id'] = class_id
        serializer = SectionSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create section error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, class_id, section_id):
        try:
            section = Section.objects.get(id=section_id, class_id=class_id, is_active=True)
        except Section.DoesNotExist:
            logger.error(f"Section with id {section_id} not found")
            return Response({"error": "Section not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = SectionSerializer(section, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update section error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, class_id, section_id):
        try:
            section = Section.objects.get(id=section_id, class_id=class_id, is_active=True)
        except Section.DoesNotExist:
            logger.error(f"Section with id {section_id} not found")
            return Response({"error": "Section not found"}, status=status.HTTP_404_NOT_FOUND)
        section.is_active = False
        section.save()
        logger.info(f"Section '{section.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class SubjectView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        subjects = Subject.objects.filter(is_active=True)
        serializer = SubjectSerializer(subjects, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not Class.objects.filter(is_active=True).exists():
            logger.error("Attempt to create subject with no active classes")
            return Response({"error": "At least one active class must exist before adding subjects"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = SubjectSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create subject error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, subject_id):
        try:
            subject = Subject.objects.get(id=subject_id, is_active=True)
        except Subject.DoesNotExist:
            logger.error(f"Subject with id {subject_id} not found")
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = SubjectSerializer(subject, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update subject error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, subject_id):
        try:
            subject = Subject.objects.get(id=subject_id, is_active=True)
        except Subject.DoesNotExist:
            logger.error(f"Subject with id {subject_id} not found")
            return Response({"error": "Subject not found"}, status=status.HTTP_404_NOT_FOUND)
        subject.is_active = False
        subject.save()
        logger.info(f"Subject '{subject.name}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

# Existing views for GradingScale, PromotionRules, and ClassCapacity remain unchanged
class GradingScaleView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        scales = GradingScale.objects.filter(is_active=True)
        serializer = GradingScaleSerializer(scales, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = GradingScaleSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create grading scale error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, scale_id):
        try:
            scale = GradingScale.objects.get(id=scale_id, is_active=True)
        except GradingScale.DoesNotExist:
            logger.error(f"Grading scale with id {scale_id} not found")
            return Response({"error": "Grading scale not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = GradingScaleSerializer(scale, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update grading scale error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, scale_id):
        try:
            scale = GradingScale.objects.get(id=scale_id, is_active=True)
        except GradingScale.DoesNotExist:
            logger.error(f"Grading scale with id {scale_id} not found")
            return Response({"error": "Grading scale not found"}, status=status.HTTP_404_NOT_FOUND)
        scale.is_active = False
        scale.save()
        logger.info(f"Grading scale '{scale.grade}' deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class PromotionRulesView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        rules = PromotionRules.objects.first()
        if not rules:
            return Response({
                'min_overall_percentage': 0,
                'max_failed_subjects': 0,
                'consider_attendance': False
            })
        serializer = PromotionRulesSerializer(rules)
        return Response(serializer.data)

    def put(self, request):
        rules = PromotionRules.objects.first()
        if not rules:
            rules = PromotionRules()
        serializer = PromotionRulesSerializer(rules, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Promotion rules updated by user {request.user}")
            return Response(serializer.data)
        logger.error(f"Update promotion rules error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ClassCapacityView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        capacity = ClassCapacity.objects.first()
        if not capacity:
            return Response({
                'max_students': 0,
                'min_students': 0
            })
        serializer = ClassCapacitySerializer(capacity)
        return Response(serializer.data)

    def put(self, request):
        capacity = ClassCapacity.objects.first()
        if not capacity:
            capacity = ClassCapacity()
        serializer = ClassCapacitySerializer(capacity, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Class capacity updated by user {request.user}")
            return Response(serializer.data)
        logger.error(f"Update class capacity error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
class CampusView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        campuses = Campus.objects.all()
        serializer = CampusSerializer(campuses, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CampusSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, campus_id):
        campus = Campus.objects.get(id=campus_id)
        serializer = CampusSerializer(campus, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, campus_id):
        campus = Campus.objects.get(id=campus_id)
        campus.is_active = False
        campus.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class BuildingView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, campus_id):
        buildings = Building.objects.filter(campus_id=campus_id)
        serializer = BuildingSerializer(buildings, many=True)
        return Response(serializer.data)

    def post(self, request, campus_id):
        data = request.data.copy()
        data['campus'] = campus_id
        serializer = BuildingSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, campus_id, building_id):
        building = Building.objects.get(id=building_id, campus_id=campus_id)
        serializer = BuildingSerializer(building, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, campus_id, building_id):
        building = Building.objects.get(id=building_id, campus_id=campus_id)
        building.is_active = False
        building.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class RoomView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, building_id):
        rooms = Room.objects.filter(building_id=building_id)
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)

    def post(self, request, building_id):
        data = request.data.copy()
        data['building'] = building_id
        serializer = RoomSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, building_id, room_id):
        room = Room.objects.get(id=room_id, building_id=building_id)
        serializer = RoomSerializer(room, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, building_id, room_id):
        room = Room.objects.get(id=room_id, building_id=building_id)
        room.is_active = False
        room.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ResourceView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        resources = Resource.objects.all()
        serializer = ResourceSerializer(resources, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ResourceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, resource_id):
        resource = Resource.objects.get(id=resource_id)
        serializer = ResourceSerializer(resource, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, resource_id):
        resource = Resource.objects.get(id=resource_id)
        resource.is_active = False
        resource.save()
        return Response(status=status.HTTP_204_NO_CONTENT)