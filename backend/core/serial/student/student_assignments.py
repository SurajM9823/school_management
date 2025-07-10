from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from core.models import Student, TeacherAssignmentToStudent
import logging

logger = logging.getLogger(__name__)

class StudentAssignmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    
    class Meta:
        model = TeacherAssignmentToStudent
        fields = ['id', 'title', 'description', 'due_date', 'subject_name', 'teacher_name', 
                 'submission_status', 'marks', 'feedback', 'submission_file', 'submission_text', 'submitted_at']

class StudentAssignmentsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get student instance
            student = Student.objects.get(user=request.user)
            
            # Get class assignments (assignments without student assigned)
            class_assignments = TeacherAssignmentToStudent.objects.filter(
                class_assigned=student.class_id,
                student__isnull=True,
                status='active'
            ).select_related('teacher', 'class_assigned', 'subject')
            
            result = []
            for assignment in class_assignments:
                # Check if student has submitted this assignment
                submission = TeacherAssignmentToStudent.objects.filter(
                    title=assignment.title,
                    teacher=assignment.teacher,
                    student=request.user
                ).first()
                
                # Build assignment data
                assignment_data = {
                    'id': assignment.id,
                    'title': assignment.title,
                    'description': assignment.description,
                    'due_date': assignment.due_date,
                    'subject_name': assignment.subject.name if assignment.subject else '',
                    'teacher_name': assignment.teacher.name if assignment.teacher else '',
                    'submission_status': submission.submission_status if submission else 'pending',
                    'marks': submission.marks if submission else None,
                    'feedback': submission.feedback if submission else None,
                    'submission_file': submission.submission_file.url if submission and submission.submission_file else None,
                    'submission_text': submission.submission_text if submission else None,
                    'submitted_at': submission.submitted_at if submission else None
                }
                result.append(assignment_data)
            
            return Response(result, status=status.HTTP_200_OK)

        except Student.DoesNotExist:
            return Response({"detail": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching assignments: {str(e)}")
            return Response({"detail": "Failed to fetch assignments"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)