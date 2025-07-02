from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import Scholarship, ScholarshipAssignment
from core.serial.admin.scholarshipSerializer import ScholarshipSerializer, ScholarshipAssignmentSerializer
from core.models import Student
from core.models import Exam, Score
from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated

class ScholarshipViewSet(viewsets.ModelViewSet):
    queryset = Scholarship.objects.all()
    serializer_class = ScholarshipSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'])
    def auto_assign(self, request, pk=None):
        scholarship = self.get_object()
        if not scholarship.auto_assign:
            return Response({"error": "This scholarship is not set for automatic assignment."}, status=status.HTTP_400_BAD_REQUEST)

        if not scholarship.linked_exam:
            return Response({"error": "No linked exam specified for auto-assignment."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Fetch students based on exam scores and criteria
            scores = Score.objects.filter(exam=scholarship.linked_exam).values('student').annotate(
                total_marks=Sum('marks_obtained')
            ).order_by('-total_marks')

            eligible_students = []
            for index, score in enumerate(scores):
                student = Student.objects.get(id=score['student'])
                total_max_marks = scholarship.linked_exam.subjects.aggregate(Sum('max_marks'))['max_marks__sum']
                percentage = (score['total_marks'] / total_max_marks) * 100 if total_max_marks else 0

                # Check eligibility
                if (scholarship.max_rank_in_exam and index + 1 > scholarship.max_rank_in_exam) or \
                   (scholarship.min_exam_percentage and percentage < scholarship.min_exam_percentage):
                    continue

                eligible_students.append(student)

            # Assign scholarships (respect number_of_awards if set)
            assignments_made = 0
            max_assignments = scholarship.number_of_awards or len(eligible_students)
            for student in eligible_students[:max_assignments]:
                ScholarshipAssignment.objects.create(
                    scholarship=scholarship,
                    student=student,
                    assignment_type='auto',
                    remarks=f"Auto-assigned based on rank {assignments_made + 1} in exam {scholarship.linked_exam.name}"
                )
                assignments_made += 1

            return Response({"message": f"Assigned scholarship to {assignments_made} students."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ScholarshipAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ScholarshipAssignment.objects.all()
    serializer_class = ScholarshipAssignmentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        assignment = self.get_object()
        if not assignment.is_active:
            return Response({"error": "Assignment is already revoked."}, status=status.HTTP_400_BAD_REQUEST)
        assignment.is_active = False
        assignment.revoked_at = timezone.now()
        assignment.remarks = request.data.get('remarks', assignment.remarks)
        assignment.save()
        return Response({"message": "Scholarship assignment revoked."}, status=status.HTTP_200_OK)