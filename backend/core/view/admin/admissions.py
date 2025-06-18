from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import action
from rest_framework import status
from core.models import (
    Parent, Student, StudentParent, AdmissionFee, StudentFee,
    Class, Section, StudentDocument, StudentDocumentType, AcademicSession, School
)
from core.serial.admission_serial import (
    ParentSerializer, StudentSerializer, StudentParentSerializer,
    AdmissionFeeSerializer, StudentFeeSerializer, StudentDocumentSerializer
)
from rest_framework import serializers
from django.db import transaction
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class ParentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            school = request.user.school
            if school is None:
                logger.error(f"No school associated with user {request.user.email}")
                return Response({"error": "No school associated with this user"}, status=status.HTTP_400_BAD_REQUEST)
            parents = Parent.objects.filter(school=school, user__is_active=True)
            serializer = ParentSerializer(parents, many=True)
            return Response(serializer.data)
        except ObjectDoesNotExist:
            logger.error(f"School does not exist for user {request.user.email}")
            return Response({"error": "School does not exist"}, status=status.HTTP_400_BAD_REQUEST)

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

    def put(self, request, parent_id):
        parent = get_object_or_404(Parent, id=parent_id, school=request.user.school)
        serializer = ParentSerializer(parent, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update parent error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, parent_id):
        parent = get_object_or_404(Parent, id=parent_id, school=request.user.school)
        try:
            parent.user.is_active = False
            parent.user.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete parent error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StudentView(ModelViewSet):
    queryset = Student.objects.all().select_related('user', 'school', 'class_id', 'section', 'academic_session')
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    # In core/view/admin/admissions.py

from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status

class ParentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            school = request.user.school
            if school is None:
                logger.error(f"No school associated with user {request.user.email}")
                return Response({"error": "No school associated with this user"}, status=status.HTTP_400_BAD_REQUEST)
            parents = Parent.objects.filter(school=school, user__is_active=True)
            serializer = ParentSerializer(parents, many=True)
            return Response(serializer.data)
        except ObjectDoesNotExist:
            logger.error(f"School does not exist for user {request.user.email}")
            return Response({"error": "School does not exist"}, status=status.HTTP_400_BAD_REQUEST)

class StudentView(ModelViewSet):
    queryset = Student.objects.all().select_related('user', 'school', 'class_id', 'section', 'academic_session')
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        try:
            school = self.request.user.school
            if school is None:
                logger.error(f"No school associated with user {self.request.user.email}")
                return self.queryset.none()  # Return empty queryset if no school
            queryset = super().get_queryset().filter(school=school)
            status_filter = self.request.query_params.get('status', None)
            class_id = self.request.query_params.get('class_id', None)
            section_id = self.request.query_params.get('section_id', None)
            academic_session_id = self.request.query_params.get('academic_session_id', None)
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            if class_id:
                queryset = queryset.filter(class_id=class_id)
            if section_id:
                queryset = queryset.filter(section_id=section_id)
            if academic_session_id:
                queryset = queryset.filter(academic_session_id=academic_session_id)
            return queryset
        except ObjectDoesNotExist:
            logger.error(f"School does not exist for user {self.request.user.email}")
            return self.queryset.none()  # Return empty queryset if school doesn't exist
        
    def perform_create(self, serializer):
        try:
            with transaction.atomic():
                result = serializer.save()
                student = result['student']
                admission_fee = AdmissionFee.objects.filter(
                    school=self.request.user.school,
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
                    'username': result['username'],
                    'password': result['password']
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Create student error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # In StudentView, modify perform_update
    def perform_update(self, serializer):
        try:
            with transaction.atomic():
                instance = serializer.save()
                return Response(StudentSerializer(instance).data)
        except serializers.ValidationError as e:
            logger.error(f"Update student validation error: {e.detail}")
            return Response({"errors": e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Update student error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_destroy(self, instance):
        try:
            with transaction.atomic():
                instance.user.is_active = False
                instance.user.save()
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete student error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'], url_path='documents')
    def documents(self, request, pk=None):
        student = self.get_object()
        if request.method == 'GET':
            documents = StudentDocument.objects.filter(student=student)
            serializer = StudentDocumentSerializer(documents, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            files = request.FILES.getlist('documents')
            responses = []
            document_type_id = request.data.get('document_type_id')
            description = request.data.get('description', '')
            for file in files:
                data = {
                    'file': file,
                    'description': description or file.name,
                    'document_type_id': document_type_id or StudentDocumentType.objects.filter(
                        school=self.request.user.school
                    ).first().id if StudentDocumentType.objects.exists() else None,
                    'student': student.id
                }
                serializer = StudentDocumentSerializer(data=data, context={'request': request})
                if serializer.is_valid():
                    document = serializer.save(student=student)
                    responses.append(serializer.data)
                else:
                    logger.error(f"Create document error: {serializer.errors}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            return Response(responses, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put', 'delete'], url_path='documents/(?P<doc_id>\d+)')
    def document_detail(self, request, pk=None, doc_id=None):
        student = self.get_object()
        try:
            document = StudentDocument.objects.get(id=doc_id, student=student)
        except StudentDocument.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
        if request.method == 'PUT':
            serializer = StudentDocumentSerializer(document, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                if 'file' in request.FILES and document.file:
                    default_storage.delete(document.file.path)
                serializer.save()
                return Response(serializer.data)
            logger.error(f"Update document error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        elif request.method == 'DELETE':
            if document.file:
                default_storage.delete(document.file.path)
            document.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get', 'post'], url_path='parents')
    def parents(self, request, pk=None):
        student = self.get_object()
        if request.method == 'GET':
            student_parents = StudentParent.objects.filter(student=student)
            serializer = StudentParentSerializer(student_parents, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            serializer = StudentParentSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save(student=student)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.error(f"Create student parent error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StudentParentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def delete(self, request, student_id, parent_id):
        student = get_object_or_404(Student, id=student_id, school=request.user.school)
        student_parent = get_object_or_404(StudentParent, student=student, parent__id=parent_id)
        try:
            student_parent.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete student parent error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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

    def delete(self, request, fee_id):
        fee = get_object_or_404(AdmissionFee, id=fee_id, school=request.user.school)
        try:
            fee.is_active = False
            fee.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete admission fee error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StudentFeeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, student_id=None):
        if student_id:
            student = get_object_or_404(Student, id=student_id, school=request.user.school)
            fees = StudentFee.objects.filter(student=student)
        else:
            fees = StudentFee.objects.filter(student__school=request.user.school)
        serializer = StudentFeeSerializer(fees, many=True)
        return Response(serializer.data)

    def put(self, request, student_id, fee_id):
        student = get_object_or_404(Student, id=student_id, school=request.user.school)
        fee = get_object_or_404(StudentFee, id=fee_id, student=student)
        serializer = StudentFeeSerializer(fee, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update student fee error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ClassView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        classes = Class.objects.filter(school=request.user.school)
        serializer = serializers.ModelSerializer(
            Class, fields=['id', 'name', 'school']
        )(classes, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = serializers.ModelSerializer(
            Class, fields=['id', 'name', 'school']
        )(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create class error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, class_id):
        class_obj = get_object_or_404(Class, id=class_id, school=request.user.school)
        serializer = serializers.ModelSerializer(
            Class, fields=['id', 'name', 'school']
        )(class_obj, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update class error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, class_id):
        class_obj = get_object_or_404(Class, id=class_id, school=request.user.school)
        try:
            class_obj.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete class error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SectionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, class_id=None):
        if class_id:
            sections = Section.objects.filter(class_id=class_id, school=request.user.school)
        else:
            sections = Section.objects.filter(school=request.user.school)
        serializer = serializers.ModelSerializer(
            Section, fields=['id', 'name', 'class_id']
        )(sections, many=True)
        return Response(serializer.data)

    def post(self, request, class_id):
        class_obj = get_object_or_404(Class, id=class_id, school=request.user.school)
        serializer = serializers.ModelSerializer(
            Section, fields=['id', 'name', 'class_id']
        )(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school, class_id=class_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create section error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, class_id, section_id):
        section = get_object_or_404(Section, id=section_id, class_id=class_id, school=request.user.school)
        serializer = serializers.ModelSerializer(
            Section, fields=['id', 'name', 'class_id']
        )(section, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update section error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, class_id, section_id):
        section = get_object_or_404(Section, id=section_id, class_id=class_id, school=request.user.school)
        try:
            section.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete section error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AcademicSessionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        sessions = AcademicSession.objects.filter(school=request.user.school)
        serializer = serializers.ModelSerializer(
            AcademicSession, fields=['id', 'name', 'start_date', 'end_date', 'status']
        )(sessions, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = serializers.ModelSerializer(
            AcademicSession, fields=['id', 'name', 'start_date', 'end_date', 'status']
        )(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create academic session error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, session_id):
        session = get_object_or_404(AcademicSession, id=session_id, school=request.user.school)
        serializer = serializers.ModelSerializer(
            AcademicSession, fields=['id', 'name', 'start_date', 'end_date', 'status']
        )(session, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update academic session error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, session_id):
        session = get_object_or_404(AcademicSession, id=session_id, school=request.user.school)
        try:
            session.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete academic session error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StudentDocumentTypeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        doc_types = StudentDocumentType.objects.filter(school=request.user.school)
        serializer = serializers.ModelSerializer(
            StudentDocumentType, fields=['id', 'name']
        )(doc_types, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = serializers.ModelSerializer(
            StudentDocumentType, fields=['id', 'name']
        )(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(school=request.user.school)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Create document type error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, doc_type_id):
        doc_type = get_object_or_404(StudentDocumentType, id=doc_type_id, school=request.user.school)
        serializer = serializers.ModelSerializer(
            StudentDocumentType, fields=['id', 'name']
        )(doc_type, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        logger.error(f"Update document type error: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, doc_type_id):
        doc_type = get_object_or_404(StudentDocumentType, id=doc_type_id, school=request.user.school)
        try:
            doc_type.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete document type error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SchoolSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        school = get_object_or_404(School, id=request.user.school.id)
        serializer = serializers.ModelSerializer(
            School, fields=['id', 'school_id', 'name']
        )(school)
        return Response([serializer.data])

class AdmissionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @transaction.atomic
    def post(self, request):
        try:
            logger.debug(f"Raw request data: {dict(request.data)}")
            logger.debug(f"Request files: {request.FILES}")
            logger.debug(f"Request content type: {request.content_type}")

            # Construct student data
            student_data = {
                'email': request.data.get('email'),
                'name': request.data.get('name'),
                'school_id': request.data.get('school_id'),
                'class_id': request.data.get('class_id'),
                'section_id': request.data.get('section_id'),
                'admission_date': request.data.get('admission_date'),
                'academic_session_id': request.data.get('academic_session_id'),
                'status': request.data.get('status', 'active'),
                'dob': request.data.get('dob'),
                'gender': request.data.get('gender'),
                'address': request.data.get('address'),
                'phone': request.data.get('phone'),
                'previous_school': request.data.get('previous_school'),
                'profile_image': request.FILES.get('profile_image'),
            }
            logger.debug(f"Student data before cleaning: {student_data}")
            student_data = {k: v for k, v in student_data.items() if v not in (None, '')}
            logger.debug(f"Student data after cleaning: {student_data}")

            # Validate and create student
            student_serializer = StudentSerializer(data=student_data, context={'request': request})
            logger.debug(f"Student serializer initial data: {student_serializer.initial_data}")
            if not student_serializer.is_valid():
                logger.error(f"Student creation error: {student_serializer.errors}")
                return Response({"student_errors": student_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            result = student_serializer.save()
            student = result['student']

            # Construct parent data
            parent_id = None
            parent_credentials = None
            parent_option = request.data.get('parent_option')
            logger.debug(f"Parent option: {parent_option}")
            if parent_option == 'new':
                parent_data = {
                    'email': request.data.get('parent_email'),
                    'name': request.data.get('parent_name'),
                    'phone': request.data.get('parent_phone'),
                    'address': request.data.get('parent_address'),
                }
                logger.debug(f"Parent data before cleaning: {parent_data}")
                parent_data = {k: v for k, v in parent_data.items() if v not in (None, '')}
                logger.debug(f"Parent data after cleaning: {parent_data}")

                parent_serializer = ParentSerializer(data=parent_data, context={'request': request})
                logger.debug(f"Parent serializer initial data: {parent_serializer.initial_data}")
                if not parent_serializer.is_valid():
                    logger.error(f"Parent creation error: {parent_serializer.errors}")
                    return Response({"parent_errors": parent_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
                parent_result = parent_serializer.save()
                parent = parent_result['parent']
                parent_id = parent.id
                parent_credentials = {
                    'email': parent_result['email'],
                    'password': parent_result['password'],
                    'user_id': parent_result['user_id']
                }
            elif parent_option == 'existing':
                parent_id = request.data.get('parent_id')
                if not parent_id:
                    return Response({"parent_errors": "Parent ID is required for existing parent."}, status=status.HTTP_400_BAD_REQUEST)
                logger.debug(f"Using existing parent ID: {parent_id}")

            # Link parent to student
            relationship = request.data.get('relationship')
            if parent_id and relationship:
                parent = get_object_or_404(Parent, id=parent_id, school=request.user.school)
                StudentParent.objects.create(student=student, parent=parent, relationship=relationship)

            # Upload documents
            documents = request.FILES.getlist('documents')
            document_type_id = request.data.get('document_type_id')
            for file in documents:
                doc_data = {
                    'file': file,
                    'description': file.name,
                    'student': student.id,
                    'document_type_id': document_type_id if document_type_id else None,
                }
                doc_serializer = StudentDocumentSerializer(data=doc_data, context={'request': request})
                if doc_serializer.is_valid():
                    doc_serializer.save(student=student)
                else:
                    logger.error(f"Document upload error: {doc_serializer.errors}")
                    return Response({"document_errors": doc_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                'student': StudentSerializer(student).data,
                'student_credentials': {
                    'email': result['email'],
                    'password': result['password'],
                    'user_id': result['user_id']
                },
                'parent_credentials': parent_credentials and {
                    'email': parent_credentials['email'],
                    'password': parent_credentials['password'],
                    'user_id': parent_credentials['user_id']
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Admission creation error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)