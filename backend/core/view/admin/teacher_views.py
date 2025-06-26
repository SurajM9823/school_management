from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from core.domain.teacher import Teacher
from core.domain.teacher_assignment import TeacherAssignment
from core.models import Staff
from core.serial.admin.teacher_assignment_serializer import TeacherAssignmentSerializer
from core.serial.admin.teacher_serializer import TeacherSerializer
import logging

logger = logging.getLogger(__name__)

class TeacherViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing teachers.
    """
    serializer_class = TeacherSerializer
    
    def get_queryset(self):
        """
        Get teachers for the current user's school.
        """
        logger.info(f"Fetching teachers for user: {self.request.user.email}")
        school_id = self.request.user.school.school_id if self.request.user.school else None
        
        if not school_id:
            logger.warning(f"No school_id found for user: {self.request.user.email}")
            return Teacher.objects.none()
        
        logger.info(f"Fetching teachers for school_id: {school_id}")
        queryset = Teacher.objects.filter(
            staff__school__school_id=school_id
        ).select_related(
            'staff', 'staff__user', 'staff__school', 'staff__staff_role', 'staff__department', 'primary_subject'
        )
        
        # Log the query results for debugging
        teacher_count = queryset.count()
        logger.info(f"Found {teacher_count} teachers for school_id: {school_id}")
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """
        Create a new teacher.
        """
        logger.info(f"Creating teacher with data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            teacher = serializer.save()
            logger.info(f"Teacher created successfully: {teacher}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        logger.error(f"Teacher creation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """
        Update an existing teacher.
        """
        instance = self.get_object()
        logger.info(f"Updating teacher {instance.id} with data: {request.data}")
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            teacher = serializer.save()
            logger.info(f"Teacher updated successfully: {teacher}")
            return Response(serializer.data)
        
        logger.error(f"Teacher update failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def upload_documents(self, request, pk=None):
        """
        Upload documents for a teacher.
        """
        teacher = self.get_object()
        logger.info(f"Uploading documents for teacher: {teacher}")
        
        # Handle document upload logic here
        # This is a placeholder for future implementation
        
        return Response({"detail": "Document upload functionality not implemented yet"}, 
                        status=status.HTTP_501_NOT_IMPLEMENTED)
                        
    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        """
        Reset password for a teacher's user account.
        """
        teacher = self.get_object()
        logger.info(f"Resetting password for teacher: {teacher}")
        
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({"detail": "New password is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = teacher.staff.user
        user.set_password(new_password)
        user.save()
        
        # Store the plaintext password for display
        teacher.staff.generated_password = new_password
        teacher.staff.save()
        
        return Response({"detail": "Password reset successfully", "new_password": new_password})
    
    @action(detail=True, methods=['get'])
    def get_credentials(self, request, pk=None):
        """
        Get credentials for a teacher's user account.
        """
        teacher = self.get_object()
        logger.info(f"Getting credentials for teacher: {teacher}")
        
        return Response({
            "email": teacher.staff.user.email,
            "password": teacher.staff.generated_password or "Password not available"
        })
    
    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        """
        Get all assignments for a teacher.
        """
        teacher = self.get_object()
        logger.info(f"Getting assignments for teacher: {teacher}")
        
        assignments = TeacherAssignment.objects.filter(teacher=teacher)
        serializer = TeacherAssignmentSerializer(assignments, many=True)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_assignment(self, request, pk=None):
        """
        Add a new assignment for a teacher.
        """
        teacher = self.get_object()
        logger.info(f"Adding assignment for teacher: {teacher}")
        
        # Add teacher to the data
        data = request.data.copy()
        data['teacher'] = teacher.id
        
        serializer = TeacherAssignmentSerializer(data=data)
        if serializer.is_valid():
            assignment = serializer.save()
            logger.info(f"Assignment created successfully: {assignment}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        logger.error(f"Assignment creation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)