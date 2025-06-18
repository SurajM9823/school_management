from django.shortcuts import get_object_or_404
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
import logging
logger = logging.getLogger(__name__)

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            'id': str(user.id),
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'avatar': user.avatar,
        }
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer




class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = {
            'id': str(user.id),
            'name': user.name,  # Use user.name directly
            'email': user.email,
            'role': user.role,
            'avatar': user.avatar if user.avatar else None
        }
        return Response(data, status=status.HTTP_200_OK)

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