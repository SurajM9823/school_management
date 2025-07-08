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
        
        # Get all students in the class
        students = Student.objects.filter(class_id=data['class_assigned'], status='active')
        
        # Create assignment for each student
        created_assignments = []
        for student in students:
            assignment = TeacherAssignmentToStudent.objects.create(
                title=data['title'],
                description=data['description'],
                teacher=teacher,
                student=student.user,
                class_assigned_id=data['class_assigned'],
                subject_id=data['subject'],
                due_date=data['due_date'],
                status='active'
            )
            created_assignments.append(assignment)
        
        return Response({'message': f'Assignment created for {len(created_assignments)} students'}, status=status.HTTP_201_CREATED)
    
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
        """Get assignments grouped by title for teacher view"""
        user = request.user
        if user.role != 'teacher':
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get unique assignments by title, class, and subject for this teacher
            assignments = TeacherAssignmentToStudent.objects.filter(
                teacher=user
            ).select_related('class_assigned', 'subject').values(
                'title', 'description', 'class_assigned__name', 'subject__name', 
                'due_date', 'created_at', 'status'
            ).distinct()
            
            # Add submission counts
            result = []
            for assignment in assignments:
                total_students = TeacherAssignmentToStudent.objects.filter(
                    teacher=user,
                    title=assignment['title'],
                    class_assigned__name=assignment['class_assigned__name'],
                    subject__name=assignment['subject__name']
                ).count()
                
                submissions = TeacherAssignmentToStudent.objects.filter(
                    teacher=user,
                    title=assignment['title'],
                    class_assigned__name=assignment['class_assigned__name'],
                    subject__name=assignment['subject__name'],
                    submission_status='submitted'
                ).count()
                
                result.append({
                    'title': assignment['title'],
                    'description': assignment['description'],
                    'class_name': assignment['class_assigned__name'],
                    'subject_name': assignment['subject__name'],
                    'due_date': assignment['due_date'],
                    'created_at': assignment['created_at'],
                    'status': assignment['status'],
                    'total_students': total_students,
                    'submissions': submissions
                })
            
            return Response(result)
        except Exception as e:
            return Response([])
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit assignment (student)"""
        assignment = get_object_or_404(TeacherAssignmentToStudent, pk=pk, student=request.user)
        
        if assignment.submission_status == 'submitted':
            return Response({'error': 'Assignment already submitted'}, status=status.HTTP_400_BAD_REQUEST)
        
        submission_text = request.data.get('submission_text', '')
        submission_file = request.FILES.get('submission_file')
        
        assignment.submission_text = submission_text
        if submission_file:
            assignment.submission_file = submission_file
        assignment.submitted_at = timezone.now()
        assignment.submission_status = 'submitted'
        assignment.save()
        
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