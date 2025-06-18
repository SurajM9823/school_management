import logging
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

logger = logging.getLogger(__name__)

class StaffViewSet(viewsets.ModelViewSet):
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        logger.info(f"Fetching staff queryset for user: {self.request.user.email}")
        return Staff.objects.filter(
            user__email__isnull=False,
            user__name__isnull=False
        ).select_related(
            'user', 'school', 'staff_role', 'department'
        ).prefetch_related('classes', 'subjects', 'leaves')

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_user_school_id(self, user):
        logger.info(f"Fetching school_id for user: {user.email}")
        # Check User.school_id (UUID in core_user)
        if user.school_id:
            logger.info(f"Found User.school_id: {user.school_id}")
            try:
                school = School.objects.get(school_id=user.school_id)
                return str(school.school_id)
            except School.DoesNotExist:
                logger.error(f"School does not exist for school_id: {user.school_id}")
                raise ValidationError({"detail": f"School does not exist for user {user.email}"})
            except ValueError:
                logger.error(f"Invalid UUID format for school_id: {user.school_id}")
                raise ValidationError({"detail": f"Invalid school ID format: {user.school_id}"})
        # Fallback to Staff record
        try:
            staff = Staff.objects.get(user=user)
            logger.info(f"Found Staff record with school_id: {staff.school.school_id}")
            return str(staff.school.school_id)
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
        mutable_data['school_id'] = school_id
        logger.info(f"Updated request data with school_id: {mutable_data}")

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
        mutable_data['school_id'] = school_id
        logger.info(f"Updated request data with school_id: {mutable_data}")

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
            new_password = Staff.generate_credentials()
            staff.generated_password = new_password
            staff.user.set_password(new_password)
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
                'password': staff.generated_password
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching credentials: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StaffProfileImageView(APIView):
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