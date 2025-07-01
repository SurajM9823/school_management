from core.views import IsSchoolAdmin
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from core.domain.teacher import Teacher
from core.domain.teacher_assignment import ClassTeacher, TeacherAssignment
from core.models import Staff, Subject, Class, Section
from core.serial.admin.teacher_assignment_serializer import ClassTeacherSerializer, TeacherAssignmentSerializer
from core.serial.admin.teacher_serializer import TeacherSerializer
import logging
from rest_framework.views import APIView

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
        
        # Log that we're returning all teachers regardless of status
        logger.info("Returning all teachers regardless of status")
        
        return queryset
        
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
        
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
        
        # Ensure user_role is set to 'teacher'
        if 'user_role' not in request.data:
            request.data['user_role'] = 'teacher'
            
        # Ensure last_name is not blank
        if 'last_name' in request.data and not request.data['last_name']:
            request.data['last_name'] = 'Teacher'
            
        # Ensure user_name is set if first_name and last_name are provided
        if 'first_name' in request.data and 'user_name' not in request.data:
            first_name = request.data.get('first_name', '')
            last_name = request.data.get('last_name', 'Teacher')
            request.data['user_name'] = f"{first_name} {last_name}".strip()
            
        # Ensure tax_status is set
        if 'tax_status' not in request.data:
            request.data['tax_status'] = 'non_exempt'
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        if serializer.is_valid():
            teacher = serializer.save()
            logger.info(f"Teacher updated successfully: {teacher}")
            return Response(serializer.data)
        
        logger.error(f"Teacher update failed: {serializer.errors}")
        logger.error(f"Request data: {request.data}")
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
        
    @action(detail=True, methods=['put'])
    def update_assignment(self, request, pk=None):
        """
        Update an existing assignment for a teacher.
        """
        teacher = self.get_object()
        assignment_id = request.data.get('id')
        
        if not assignment_id:
            return Response({"detail": "Assignment ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            assignment = TeacherAssignment.objects.get(id=assignment_id, teacher=teacher)
        except TeacherAssignment.DoesNotExist:
            return Response({"detail": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = TeacherAssignmentSerializer(assignment, data=request.data, partial=True)
        if serializer.is_valid():
            updated_assignment = serializer.save()
            logger.info(f"Assignment updated successfully: {updated_assignment}")
            return Response(serializer.data)
        
        logger.error(f"Assignment update failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    @action(detail=True, methods=['delete'])
    def delete_assignment(self, request, pk=None):
        """
        Delete an assignment for a teacher.
        """
        teacher = self.get_object()
        assignment_id = request.query_params.get('assignment_id')
        
        if not assignment_id:
            return Response({"detail": "Assignment ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            assignment = TeacherAssignment.objects.get(id=assignment_id, teacher=teacher)
        except TeacherAssignment.DoesNotExist:
            return Response({"detail": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)
        
        assignment.delete()
        logger.info(f"Assignment deleted successfully: {assignment_id}")
        return Response({"detail": "Assignment deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
    
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
        
        # Validate class, section, and subject
        class_id = data.get('class_obj')
        section_id = data.get('section')
        subject_id = data.get('subject')
        
        try:
            class_obj = Class.objects.get(id=class_id)
            section = Section.objects.get(id=section_id)
            subject = Subject.objects.get(id=subject_id)
        except (Class.DoesNotExist, Section.DoesNotExist, Subject.DoesNotExist) as e:
            logger.error(f"Invalid class, section, or subject: {e}")
            return Response({"detail": "Invalid class, section, or subject"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if assignment already exists
        existing = TeacherAssignment.objects.filter(
            teacher=teacher,
            class_obj=class_obj,
            section=section,
            subject=subject
        ).first()
        
        if existing:
            logger.warning(f"Assignment already exists: {existing}")
            return Response({"detail": "This assignment already exists"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create the assignment
        serializer = TeacherAssignmentSerializer(data=data)
        if serializer.is_valid():
            assignment = serializer.save()
            logger.info(f"Assignment created successfully: {assignment}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        logger.error(f"Assignment creation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClassTeacherView(APIView):
    permission_classes = [ IsSchoolAdmin]

    def get(self, request, class_id=None):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        if class_id:
            try:
                Class.objects.get(id=class_id, school=request.user.school, is_active=True)
            except Class.DoesNotExist:
                logger.error(f"Class with id {class_id} not found for school {request.user.school}")
                return Response({"error": "Class not found"}, status=status.HTTP_404_NOT_FOUND)
            assignments = ClassTeacher.objects.filter(class_id=class_id, school=request.user.school, is_active=True)
        else:
            assignments = ClassTeacher.objects.filter(school=request.user.school, is_active=True)
        serializer = ClassTeacherSerializer(assignments, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        data = request.data.copy()
        data['school'] = request.user.school.id
        logger.info(f"ClassTeacher POST payload: {data}")
        serializer = ClassTeacherSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create class teacher error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, assignment_id=None, class_id=None):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Use assignment_id if provided, otherwise use class_id (for backward compatibility)
        lookup_id = assignment_id or class_id
        if not lookup_id:
            return Response({"error": "Assignment ID or Class ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            assignment = ClassTeacher.objects.get(id=lookup_id, school=request.user.school, is_active=True)
        except ClassTeacher.DoesNotExist:
            logger.error(f"ClassTeacher with id {lookup_id} not found for school {request.user.school}")
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClassTeacherSerializer(assignment, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update class teacher error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, assignment_id):
        if not request.user.school:
            return Response({"error": "User is not associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            assignment = ClassTeacher.objects.get(id=assignment_id, school=request.user.school, is_active=True)
        except ClassTeacher.DoesNotExist:
            logger.error(f"ClassTeacher with id {assignment_id} not found for school {request.user.school}")
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)
        assignment.is_active = False
        assignment.save()
        logger.info(f"ClassTeacher assignment {assignment_id} deactivated by user {request.user}")
        return Response(status=status.HTTP_204_NO_CONTENT)