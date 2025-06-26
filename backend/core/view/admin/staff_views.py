from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.models import Staff, User, School
from core.serial.staff_serializers import StaffSerializer
from rest_framework.exceptions import ValidationError
from uuid import UUID
from rest_framework.views import APIView
from django.core.files.storage import default_storage
from django.conf import settings
import os
from django.shortcuts import get_object_or_404
from core.views import IsSchoolAdmin
import logging

logger = logging.getLogger(__name__)


class StaffViewSet(viewsets.ModelViewSet):
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        logger.info(f"Fetching staff queryset for user: {self.request.user.email}")
        school_id = self.get_user_school_id(self.request.user)
        logger.info(f"Using school_id: {school_id} for staff query")
        queryset = Staff.objects.filter(
            user__email__isnull=False,
            user__name__isnull=False,
            school__school_id=school_id  # Changed from school_id to school__school_id
        ).select_related(
            'user', 'school', 'staff_role', 'department'
        ).prefetch_related('classes', 'subjects', 'leaves')
        
        # Log the query results for debugging
        staff_count = queryset.count()
        logger.info(f"Found {staff_count} staff members for school_id: {school_id}")
        if staff_count > 0:
            for staff in queryset:
                logger.info(f"Staff: ID={staff.id}, Name={staff.user.name}, Email={staff.user.email}")
        else:
            logger.warning(f"No staff found for school_id: {school_id}")
            
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_user_school_id(self, user):
        logger.info(f"Fetching school_id for user: {user.email}")
        # Check User.school (ForeignKey to School in core_user)
        if user.school:
            try:
                # Get the school_id from the related School object
                school_id = user.school.school_id
                normalized_school_id = str(school_id)
                logger.info(f"Found User.school.school_id: {normalized_school_id}")
                return normalized_school_id
            except Exception as e:
                logger.error(f"Error accessing school_id: {str(e)}")
                raise ValidationError({"detail": f"Error accessing school for user {user.email}: {str(e)}"})
        # Fallback to Staff record
        try:
            staff = Staff.objects.get(user=user)
            if staff.school:
                normalized_school_id = str(staff.school.school_id)
                logger.info(f"Found Staff record with school_id: {normalized_school_id}")
                return normalized_school_id
            else:
                logger.error(f"Staff record exists but has no school: {user.email}")
                raise ValidationError({"detail": f"Staff record exists but has no associated school."})
        except Staff.DoesNotExist:
            logger.error(f"No Staff record found for user: {user.email}")
            raise ValidationError({"detail": f"User is not associated with a school."})

    def create(self, request, *args, **kwargs):
        logger.info(f"Received staff creation request with data: {request.data}")
        try:
            user = request.user
            school_id = self.get_user_school_id(user)
            logger.info(f"User's school ID: {school_id}")
        except ValidationError as e:
            logger.error(f"School ID retrieval failed: {e.detail}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Error fetching user's school: {str(e)}")
            return Response({"detail": "Error determining user's school."}, status=status.HTTP_400_BAD_REQUEST)

        mutable_data = request.data.copy()
        # Format the school_id properly with hyphens for UUID format
        formatted_school_id = str(school_id)
        if len(formatted_school_id) == 32:  # If it's a UUID without hyphens
            formatted_school_id = f"{formatted_school_id[:8]}-{formatted_school_id[8:12]}-{formatted_school_id[12:16]}-{formatted_school_id[16:20]}-{formatted_school_id[20:]}"
        mutable_data['school_id'] = formatted_school_id
        logger.info(f"Updated request data with school_id: {mutable_data['school_id']}")

        serializer = self.get_serializer(data=mutable_data)
        if serializer.is_valid():
            logger.info("Serializer validated successfully")
            self.perform_create(serializer)
            logger.info(f"Staff created successfully: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Staff creation failed. Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        logger.info("Performing staff creation")
        try:
            staff = serializer.save()
            logger.info(f"Staff created with ID: {staff.id}, Email: {staff.user.email}")
        except Exception as e:
            logger.exception(f"Error during staff creation: {str(e)}")
            raise

    def update(self, request, *args, **kwargs):
        logger.info(f"Received staff update request for ID: {kwargs.get('pk')} with data: {request.data}")
        try:
            user = request.user
            school_id = self.get_user_school_id(user)
            logger.info(f"User's school ID: {school_id}")
        except ValidationError as e:
            logger.error(f"School ID retrieval failed: {e.detail}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception(f"Error fetching user's school: {str(e)}")
            return Response({"detail": "Error determining user's school."}, status=status.HTTP_400_BAD_REQUEST)

        mutable_data = request.data.copy()
        # Format the school_id properly with hyphens for UUID format
        formatted_school_id = str(school_id)
        if len(formatted_school_id) == 32:  # If it's a UUID without hyphens
            formatted_school_id = f"{formatted_school_id[:8]}-{formatted_school_id[8:12]}-{formatted_school_id[12:16]}-{formatted_school_id[16:20]}-{formatted_school_id[20:]}"
        mutable_data['school_id'] = formatted_school_id
        logger.info(f"Updated request data with school_id: {mutable_data['school_id']}")

        serializer = self.get_serializer(self.get_object(), data=mutable_data, partial=True)
        if serializer.is_valid():
            logger.info("Serializer validated successfully")
            self.perform_update(serializer)
            logger.info(f"Staff updated successfully: {serializer.data}")
            return Response(serializer.data)
        else:
            logger.error(f"Staff update failed. Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def perform_update(self, serializer):
        logger.info(f"Updating staff ID: {self.get_object().id}")
        try:
            staff = serializer.save()
            if 'generated_password' in serializer.validated_data:
                staff.user.set_password(serializer.validated_data['generated_password'])
                staff.user.save()
                logger.info(f"Password updated for staff ID: {staff.id}")
        except Exception as e:
            logger.exception(f"Error during staff update: {str(e)}")
            raise

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        logger.info(f"Resetting password for staff ID: {pk}")
        try:
            staff = self.get_object()
            new_password = request.data.get('new_password')
            if not new_password:
                return Response({'detail': 'New password is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            staff.user.set_password(new_password)
            staff.generated_password = new_password
            staff.user.save()
            staff.save()
            logger.info(f"Password reset for staff ID: {staff.id}, Email: {staff.user.email}")
            return Response({
                'email': staff.user.email,
                'new_password': new_password
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error resetting password: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='credentials')
    def get_credentials(self, request, pk=None):
        logger.info(f"Fetching credentials for staff ID: {pk}")
        try:
            staff = self.get_object()
            return Response({
                'email': staff.user.email,
                'password': staff.generated_password or ''
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching credentials: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StaffProfileImageView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request, pk):
        staff = get_object_or_404(Staff, pk=pk, school_id=request.user.school.school_id)
        if 'profile_image' not in request.FILES:
            return Response({"error": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['profile_image']
        valid_types = ['image/png', 'image/jpeg']
        if file.content_type not in valid_types:
            return Response({"error": "Only PNG or JPG images are allowed"}, status=status.HTTP_400_BAD_REQUEST)
        if file.size > 2 * 1024 * 1024:  # 2MB
            return Response({"error": "Image must be less than 2MB"}, status=status.HTTP_400_BAD_REQUEST)
        
        if staff.profile_image:
            old_path = os.path.join(settings.MEDIA_ROOT, staff.profile_image.name)
            if os.path.exists(old_path):
                os.remove(old_path)
        
        file_name = f"staff_profiles/{staff.employee_id}_{file.name}"
        file_path = default_storage.save(file_name, file)
        staff.profile_image = file_path
        staff.save()
        return Response({"profile_image": request.build_absolute_uri(staff.profile_image.url)}, status=status.HTTP_200_OK)