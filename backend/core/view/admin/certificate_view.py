from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from core.models import Student, Parent
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import Certificate
from core.serial.certificate_serial import CertificateSerializer
from core.views import IsSchoolAdmin
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from core.models import Student, StudentParent
from core.views import IsSchoolAdmin
from core.serial.admission_serial import StudentSerializer, ParentSerializer
import logging

logger = logging.getLogger(__name__)

class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all().select_related(
        'student_id', 'class_id', 'section_id', 'academic_session_id'
    )  # Optimize with select_related
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def perform_create(self, serializer):
        certificate = serializer.save()
        # Update student status
        student = certificate.student_id
        if certificate.certificate_type == 'graduation':
            student.status = 'alumni'
            student.alumni_type = 'graduated'
        elif certificate.certificate_type == 'leave':
            student.status = 'alumni'
            student.alumni_type = 'transferred'
        student.save()

    def perform_update(self, serializer):
        certificate = serializer.save()
        # Update student status based on certificate_type
        student = certificate.student_id
        if certificate.certificate_type == 'graduation':
            student.status = 'alumni'
            student.alumni_type = 'graduated'
        elif certificate.certificate_type == 'leave':
            student.status = 'alumni'
            student.alumni_type = 'transferred'
        student.save()

    @action(detail=False, methods=['get'], url_path='by-student/(?P<student_id>\d+)')
    def by_student(self, request, student_id=None):
        certificates = self.queryset.filter(student_id=student_id)
        serializer = self.get_serializer(certificates, many=True)
        return Response(serializer.data)






class StudentCredentialsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request, student_id):
        try:
            school_id = request.user.school.school_id
            student = get_object_or_404(Student, id=student_id, school__school_id=school_id)
            student_user = student.user

            credentials = {
                "student": {
                    "email": student_user.email,
                    "password": student_user.plaintext_password,
                    "user_id": student_user.id
                },
                "parent": None
            }

            student_parent = StudentParent.objects.filter(student=student, parent__school__school_id=school_id).first()
            if student_parent:
                parent = student_parent.parent
                credentials["parent"] = {
                    "email": parent.user.email,
                    "password": parent.user.plaintext_password,
                    "user_id": parent.user.id
                }

            logger.info(f"Fetched credentials for student {student_id} in school_id: {school_id}")
            return Response(credentials, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            logger.error(f"Student {student_id} not found for school_id {school_id}")
            return Response({"detail": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Fetch credentials error: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, student_id):
        try:
            school_id = request.user.school.school_id
            student = get_object_or_404(Student, id=student_id, school__school_id=school_id)
            student_user = student.user
            new_student_password = request.data.get('student_password')
            new_parent_password = request.data.get('parent_password')

            credentials = {
                "student": {
                    "email": student_user.email,
                    "password": student_user.plaintext_password,
                    "user_id": student_user.id
                },
                "parent": None
            }

            if new_student_password:
                student_user.set_password(new_student_password)
                student_user.plaintext_password = new_student_password
                student_user.save()
                credentials["student"]["password"] = new_student_password
                logger.info(f"Password reset for student {student_id}")

            student_parent = StudentParent.objects.filter(student=student, parent__school__school_id=school_id).first()
            if student_parent and new_parent_password:
                parent = student_parent.parent
                parent.user.set_password(new_parent_password)
                parent.user.plaintext_password = new_parent_password
                parent.user.save()
                credentials["parent"] = {
                    "email": parent.user.email,
                    "password": new_parent_password,
                    "user_id": parent.user.id
                }
                logger.info(f"Password reset for parent of student {student_id}")

            return Response(credentials, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            logger.error(f"Student {student_id} not found for school_id {school_id}")
            return Response({"detail": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Change password error: {str(e)}")
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)