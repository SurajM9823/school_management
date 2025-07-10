from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from core.models import TeacherAssignmentToStudent, Staff, Student
from core.serial.teacher.teacher_assignment_serializers import TeacherAssignmentSerializer, ClassSerializer, SubjectSerializer

class TeacherAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherAssignmentSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'teacher':
            return TeacherAssignmentToStudent.objects.filter(teacher=user)
        elif user.role == 'student':
            return TeacherAssignmentToStudent.objects.filter(student=user)
        return TeacherAssignmentToStudent.objects.all()
    
    def create(self, request, *args, **kwargs):
        teacher = request.user
        data = request.data
        
        # Create single assignment record
        assignment = TeacherAssignmentToStudent.objects.create(
            title=data['title'],
            description=data['description'],
            teacher=teacher,
            class_assigned_id=data['class_assigned'],
            subject_id=data['subject'],
            due_date=data['due_date'],
            status='active',
            attachment=request.FILES.get('attachment')
        )
        
        return Response({'message': 'Assignment created successfully'}, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def teacher_classes_subjects(self, request):
        try:
            staff = Staff.objects.get(user=request.user)
            classes = ClassSerializer(staff.classes.filter(is_active=True), many=True).data
            subjects = SubjectSerializer(staff.subjects.filter(is_active=True), many=True).data
            return Response({'classes': classes, 'subjects': subjects})
        except Staff.DoesNotExist:
            return Response({'classes': [], 'subjects': []})
    
    @action(detail=False, methods=['get'])
    def teacher_assignments(self, request):
        """Get assignments for teacher view"""
        user = request.user
        if user.role != 'teacher':
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            assignments = TeacherAssignmentToStudent.objects.filter(
                teacher=user, student__isnull=True
            ).select_related('class_assigned', 'subject')
            
            result = []
            for assignment in assignments:
                # Count students in the class
                total_students = Student.objects.filter(
                    class_id=assignment.class_assigned_id, status='active'
                ).count()
                
                # Count submissions (assignments with same title but with students)
                submissions = TeacherAssignmentToStudent.objects.filter(
                    teacher=user,
                    title=assignment.title,
                    student__isnull=False,
                    submission_status='submitted'
                ).count()
                
                result.append({
                    'id': assignment.id,
                    'title': assignment.title,
                    'description': assignment.description,
                    'class_name': assignment.class_assigned.name if assignment.class_assigned else '',
                    'subject_name': assignment.subject.name if assignment.subject else '',
                    'due_date': assignment.due_date,
                    'created_at': assignment.created_at,
                    'status': assignment.status,
                    'total_students': total_students,
                    'submissions': submissions,
                    'attachment': assignment.attachment.url if assignment.attachment else None
                })
            
            return Response(result)
        except Exception as e:
            import traceback
            print(f"Error in teacher_assignments: {str(e)}")
            print(traceback.format_exc())
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit assignment (student)"""
        # Get the original assignment
        original_assignment = get_object_or_404(TeacherAssignmentToStudent, pk=pk)
        
        # Check if student already submitted
        existing_submission = TeacherAssignmentToStudent.objects.filter(
            title=original_assignment.title,
            teacher=original_assignment.teacher,
            student=request.user
        ).first()
        
        if existing_submission and existing_submission.submission_status == 'submitted':
            return Response({'error': 'Assignment already submitted'}, status=status.HTTP_400_BAD_REQUEST)
        
        submission_text = request.data.get('submission_text', '')
        submission_file = request.FILES.get('submission_file')
        
        # Create submission record
        TeacherAssignmentToStudent.objects.create(
            title=original_assignment.title,
            description=original_assignment.description,
            teacher=original_assignment.teacher,
            student=request.user,
            class_assigned=original_assignment.class_assigned,
            subject=original_assignment.subject,
            due_date=original_assignment.due_date,
            status=original_assignment.status,
            submission_text=submission_text,
            submission_file=submission_file,
            submitted_at=timezone.now(),
            submission_status='submitted'
        )
        
        return Response({'message': 'Assignment submitted successfully'})
    
    @action(detail=True, methods=['post'])
    def grade(self, request, pk=None):
        """Grade assignment (teacher)"""
        assignment = get_object_or_404(TeacherAssignmentToStudent, pk=pk)
        
        if request.user != assignment.teacher:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        marks = request.data.get('marks')
        feedback = request.data.get('feedback', '')
        
        assignment.marks = marks
        assignment.feedback = feedback
        assignment.submission_status = 'graded'
        assignment.save()
        
        return Response({'message': 'Assignment graded successfully'})
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update assignments with same title, class, and subject"""
        user = request.user
        if user.role != 'teacher':
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        title = data.get('title')
        class_name = data.get('class_name')
        subject_name = data.get('subject_name')
        
        # Update all matching assignments
        assignments = TeacherAssignmentToStudent.objects.filter(
            teacher=user,
            title=title,
            class_assigned__name=class_name,
            subject__name=subject_name
        )
        
        updated_count = 0
        for assignment in assignments:
            assignment.title = data.get('new_title', title)
            assignment.description = data.get('new_description', '')
            assignment.due_date = data.get('new_due_date')
            if request.FILES.get('new_attachment'):
                assignment.attachment = request.FILES.get('new_attachment')
            assignment.save()
            updated_count += 1
        
        return Response({'message': f'Updated {updated_count} assignments'})