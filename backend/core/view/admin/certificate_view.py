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
class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all().select_related(
        'student_id', 'class_id', 'section_id', 'academic_session_id'
    )  # Optimize with select_related
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]

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
    def get(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)
            # Assuming Student has a OneToOneField to User
            student_user = student.user  # Adjust based on your Student model
            credentials = {
                "student": {
                    "email": student_user.email,
                    "password": "******"  # Placeholder; adjust based on your needs
                }
            }
            # Fetch parent credentials if linked
            parent = Parent.objects.filter(students=student).first()  # Adjust based on Parent-Student relationship
            if parent and parent.user:
                credentials["parent"] = {
                    "email": parent.user.email,
                    "password": "******"
                }
            return Response(credentials, status=status.HTTP_200_OK)
        except Student.DoesNotExist:
            return Response({"detail": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)