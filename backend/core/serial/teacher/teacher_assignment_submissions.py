from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from core.models import TeacherAssignmentToStudent, Student
import logging

logger = logging.getLogger(__name__)

class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    
    class Meta:
        model = TeacherAssignmentToStudent
        fields = ['id', 'student_name', 'submission_text', 'submission_file', 'submitted_at', 
                 'submission_status', 'marks', 'feedback']

class TeacherAssignmentSubmissionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, assignment_title):
        try:
            # Get all submissions for assignments with this title
            submissions = TeacherAssignmentToStudent.objects.filter(
                teacher=request.user,
                title=assignment_title,
                submission_status__in=['submitted', 'graded']
            ).select_related('student')
            
            serializer = SubmissionSerializer(submissions, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error fetching submissions: {str(e)}")
            return Response({"detail": "Failed to fetch submissions"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, assignment_title):
        try:
            assignment_id = request.data.get('assignment_id')
            grade = request.data.get('grade')
            comment = request.data.get('comment', '')
            
            assignment = TeacherAssignmentToStudent.objects.get(
                id=assignment_id,
                teacher=request.user,
                title=assignment_title
            )
            
            # Grade mapping
            grade_marks = {
                'excellent': 95,
                'very_good': 85,
                'good': 75,
                'normal': 65
            }
            
            assignment.marks = grade_marks.get(grade, 65)
            assignment.feedback = f"{grade.replace('_', ' ').title()}: {comment}" if comment else grade.replace('_', ' ').title()
            assignment.submission_status = 'graded'
            assignment.save()
            
            return Response({"message": "Assignment graded successfully"}, status=status.HTTP_200_OK)

        except TeacherAssignmentToStudent.DoesNotExist:
            return Response({"detail": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error grading assignment: {str(e)}")
            return Response({"detail": "Failed to grade assignment"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)