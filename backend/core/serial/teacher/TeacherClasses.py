import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from core.domain.teacher import Teacher
from core.domain.teacher_assignment import ClassTeacher, TeacherAssignment

logger = logging.getLogger(__name__)

# Serializers
class TeacherClassesSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_obj.name')
    subject_name = serializers.CharField(source='subject.name')
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = TeacherAssignment
        fields = ['id', 'class_obj', 'subject', 'class_name', 'subject_name', 'student_count']

    def get_student_count(self, obj):
        # Use 'students' instead of 'student_set' to match the related_name
        return obj.class_obj.students.filter(status='active').count()

class ClassTeacherSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_id.name')
    section_name = serializers.CharField(source='section.name', allow_null=True)

    class Meta:
        model = ClassTeacher
        fields = ['id', 'class_id', 'section', 'class_name', 'section_name']

# API View
class TeacherClassesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Check if user is a teacher
        if not hasattr(request.user, 'role') or request.user.role != 'teacher':
            return Response(
                {"detail": "Only teachers can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # Retrieve the teacher instance linked to the authenticated user
            teacher = Teacher.objects.get(staff__user=request.user)

            # Get subject-teacher assignments
            subject_assignments = TeacherAssignment.objects.filter(
                teacher=teacher,
                class_obj__is_active=True
            ).select_related('class_obj', 'subject')

            # Get class-teacher assignments
            class_teacher_assignments = ClassTeacher.objects.filter(
                teacher=teacher,
                is_active=True
            ).select_related('class_id', 'section')

            # Serialize both assignments
            subject_serializer = TeacherClassesSerializer(subject_assignments, many=True, context={'request': request})
            class_teacher_serializer = ClassTeacherSerializer(class_teacher_assignments, many=True, context={'request': request})

            # Combine the data
            return Response({
                "subject_assignments": subject_serializer.data,
                "class_teacher_assignments": class_teacher_serializer.data,
            }, status=status.HTTP_200_OK)

        except Teacher.DoesNotExist:
            logger.error(f"Teacher profile not found for user {request.user.id}")
            return Response(
                {"detail": "Teacher profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching classes: {str(e)}", exc_info=True)
            return Response(
                {"detail": "Failed to fetch classes. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




        from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from core.models import Class, Student
from core.domain.teacher import Teacher

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'name', 'roll_number']

class ClassStudentsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, class_id):
        try:
            # Ensure the user is a teacher
            if not hasattr(request.user, 'role') or request.user.role != 'teacher':
                return Response(
                    {"detail": "Only teachers can access this endpoint"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Verify the teacher is associated with the class
            teacher = Teacher.objects.get(staff__user=request.user)
            if not TeacherAssignment.objects.filter(
                    teacher=teacher, class_obj__id=class_id, class_obj__is_active=True
            ).exists() and not ClassTeacher.objects.filter(
                teacher=teacher, class_id__id=class_id, is_active=True
            ).exists():
                return Response(
                    {"detail": "You are not authorized to view students for this class"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Fetch students
            students = Student.objects.filter(class_obj__id=class_id, status='active')
            serializer = StudentSerializer(students, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Teacher.DoesNotExist:
            logger.error(f"Teacher profile not found for user {request.user.id}")
            return Response(
                {"detail": "Teacher profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Class.DoesNotExist:
            logger.error(f"Class with ID {class_id} not found")
            return Response(
                {"detail": "Class not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching students: {str(e)}", exc_info=True)
            return Response(
                {"detail": "Failed to fetch students. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )