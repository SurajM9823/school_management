from django.shortcuts import get_object_or_404
from core.serializers import UserSerializer
from core.serial.ChangePasswordSerializer import ChangePasswordSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from .models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from datetime import date
from core.models import User, School, Subscription
import logging
logger = logging.getLogger(__name__)

# core/views.py
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
            user = self.user
            if not user.is_superuser:
                try:
                    school = user.school
                    subscription = Subscription.objects.get(school=school)
                    if subscription.status != 'active' or subscription.end_date < date.today():
                        raise serializers.ValidationError({"non_field_errors": ["School subscription is inactive or expired"]})
                except School.DoesNotExist:
                    raise serializers.ValidationError({"non_field_errors": ["User is not associated with any school"]})
                except Subscription.DoesNotExist:
                    raise serializers.ValidationError({"non_field_errors": ["No subscription found for the school"]})
            data['user'] = {
                'id': str(user.id),
                'name': user.name,
                'email': user.email,
                'role': user.role,
                'avatar': user.avatar if user.avatar else None,
                'is_superuser': user.is_superuser,
            }
            logger.info(f"Successful login for {user.email}")
            return data
        except serializers.ValidationError as e:
            logger.error(f"Login validation error for {attrs.get('email')}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected login error for {attrs.get('email')}: {str(e)}")
            raise serializers.ValidationError({"non_field_errors": ["An unexpected error occurred during login"]})
        
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class UserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, pk):
        user = get_object_or_404(User, id=pk, school=request.user.school)
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                logger.info(f"Password changed for user ID {pk} by admin {request.user.email}")
                return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
            except Exception as e:
                logger.error(f"Change password error for user ID {pk}: {str(e)}")
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.permissions import BasePermission

class IsSchoolAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'
    

