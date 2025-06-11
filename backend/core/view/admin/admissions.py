from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework import status
from core.models import Parent, Student, StudentParent, AdmissionFee, StudentFee, Class, Section
from core.serial.admission_serial import ParentSerializer, StudentSerializer, StudentParentSerializer, AdmissionFeeSerializer, StudentFeeSerializer
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class ParentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        parents = Parent.objects.filter(school=request.user.school, user__is_active=True)
        serializer = ParentSerializer(parents, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ParentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            parent = serializer.save()
            return Response({
                'parent': serializer.data,
                'username': parent.user.username,
                'password': serializer.context.get('generated_password')
            }, status=status.HTTP_201_CREATED)
        logger.error(f"Create parent error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class StudentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get('status', None)
        students = Student.objects.filter(school=request.user.school)
        if status_filter:
            students = students.filter(status=status_filter)
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = StudentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            student = serializer.save()
            admission_fee = AdmissionFee.objects.filter(
                school=request.user.school,
                class_id=student.class_id,
                section=student.section
            ).first()
            if admission_fee:
                StudentFee.objects.create(
                    student=student,
                    admission_fee=admission_fee,
                    amount=admission_fee.amount,
                    due_date=datetime.now().date() + timedelta(days=30),
                    status='pending'
                )
            return Response({
                'student': StudentSerializer(student).data,
                'username': student.user.username,
                'password': serializer.context.get('generated_password')
            }, status=status.HTTP_201_CREATED)
        logger.error(f"Create student error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, student_id):
        student = get_object_or_404(Student, id=student_id, school=request.user.school)
        serializer = StudentSerializer(student, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update student error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class StudentParentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, student_id):
        student = get_object_or_404(Student, id=student_id, school=request.user.school)
        relationships = StudentParent.objects.filter(student=student)
        serializer = StudentParentSerializer(relationships, many=True)
        return Response(serializer.data)

    def post(self, request, student_id):
        student = get_object_or_404(Student, id=student_id, school=request.user.school)
        data = request.data.copy()
        data['student'] = student_id
        serializer = StudentParentSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create student-parent error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdmissionFeeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        fees = AdmissionFee.objects.filter(school=request.user.school, is_active=True)
        serializer = AdmissionFeeSerializer(fees, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AdmissionFeeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create admission fee error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, fee_id):
        fee = get_object_or_404(AdmissionFee, id=fee_id, school=request.user.school)
        serializer = AdmissionFeeSerializer(fee, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update admission fee error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StudentFeeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, student_id):
        student = get_object_or_404(Student, id=student_id, school=request.user.school)
        fees = StudentFee.objects.filter(student=student)
        serializer = StudentFeeSerializer(fees, many=True)
        return Response(serializer.data)