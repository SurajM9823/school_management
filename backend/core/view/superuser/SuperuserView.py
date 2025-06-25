from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import Permission
from core.models import User, School, Subscription
from core.serial.superuser.SuperuserSerializer import SuperuserSerializer, SchoolSerializer, SubscriptionSerializer
import logging
from django.utils.crypto import get_random_string

logger = logging.getLogger(__name__)

class IsSuperuser(Permission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser

class SuperuserView(APIView):
    permission_classes = [IsAuthenticated, IsSuperuser]

    def get(self, request):
        """List all schools (for SuperadminDashboard)."""
        try:
            schools = School.objects.all()
            serializer = SchoolSerializer(schools, many=True, context={'request': request})
            logger.info(f"Superuser {request.user.email} retrieved list of schools")
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error retrieving schools: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Add a new school."""
        serializer = SchoolSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            school = serializer.save()
            logger.info(f"School {school.name} created by superuser {request.user.email}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"School creation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SuperuserSchoolCreateView(APIView):
    permission_classes = [IsAuthenticated, IsSuperuser]

    def post(self, request):
        """Create a school and its admin in one request."""
        school_data = request.data.get('school')
        admin_data = request.data.get('admin')
        if not school_data or not admin_data:
            logger.error("Missing school or admin data")
            return Response({"error": "School and admin data are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Create school
        school_serializer = SchoolSerializer(data=school_data, context={'request': request})
        if not school_serializer.is_valid():
            logger.error(f"School creation failed: {school_serializer.errors}")
            return Response(school_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        school = school_serializer.save()

        # Create default subscription
        subscription_data = {
            'school': school,
            'start_date': school_data.get('start_date', '2025-01-01'),  # Default start date
            'end_date': school_data.get('end_date', '2025-12-31'),  # Default end date
            'status': 'active',
            'fulfillment_status': 'fulfilled'
        }
        subscription = Subscription.objects.create(**subscription_data)
        logger.info(f"Subscription created for school {school.name}")

        # Create admin
        admin_data['school'] = str(school.school_id)
        admin_data['password'] = admin_data.get('password', get_random_string(12))  # Generate password if not provided
        admin_serializer = SuperuserSerializer(data=admin_data, context={'request': request})
        if not admin_serializer.is_valid():
            logger.error(f"Admin creation failed: {admin_serializer.errors}")
            # Rollback school creation
            school.delete()
            subscription.delete()
            return Response(admin_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        admin = admin_serializer.save()

        logger.info(f"School {school.name} and admin {admin.email} created by superuser {request.user.email}")
        return Response({
            'school': school_serializer.data,
            'admin': admin_serializer.data,
            'subscription': SubscriptionSerializer(subscription).data
        }, status=status.HTTP_201_CREATED)

class SuperuserAdminView(APIView):
    permission_classes = [IsAuthenticated, IsSuperuser]

    def post(self, request):
        """Create an admin for a school."""
        serializer = SuperuserSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            admin = serializer.save()
            logger.info(f"Admin {admin.email} created for school {admin.school.name} by superuser {request.user.email}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Admin creation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SuperuserSubscriptionView(APIView):
    permission_classes = [IsAuthenticated, IsSuperuser]

    def get(self, request, school_id):
        """Get subscription details for a school."""
        try:
            subscription = Subscription.objects.filter(school__school_id=school_id).last()
            if not subscription:
                logger.error(f"No subscription found for school ID {school_id}")
                return Response({"error": "No subscription found"}, status=status.HTTP_404_NOT_FOUND)
            serializer = SubscriptionSerializer(subscription, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error retrieving subscription for school ID {school_id}: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request, school_id):
        """Update subscription for a school."""
        try:
            subscription = Subscription.objects.filter(school__school_id=school_id).last()
            if not subscription:
                logger.error(f"No subscription found for school ID {school_id}")
                return Response({"error": "No subscription found"}, status=status.HTTP_404_NOT_FOUND)
            serializer = SubscriptionSerializer(subscription, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                # Sync school's subscription_status
                school = School.objects.get(school_id=school_id)
                school.subscription_status = serializer.validated_data.get('status', school.subscription_status)
                school.save()
                logger.info(f"Subscription for school {school.name} updated by superuser {request.user.email}")
                return Response(serializer.data, status=status.HTTP_200_OK)
            logger.error(f"Subscription update failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except School.DoesNotExist:
            logger.error(f"School with ID {school_id} not found")
            return Response({"error": "School not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error updating subscription for school ID {school_id}: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)