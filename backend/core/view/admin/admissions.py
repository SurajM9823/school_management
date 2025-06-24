import json
from django.shortcuts import get_object_or_404
from django.core.files.storage import default_storage
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import action
from rest_framework import status
from django.utils.crypto import get_random_string

from core.serial.admission_serial import ClassSerializer
from core.models import (
    Parent, Staff, Student, StudentParent, AdmissionFee, StudentFee,
    Class, Section, StudentDocument, StudentDocumentType, AcademicSession, School, User
)
from core.serial.admission_serial import (
    ParentSerializer, StudentSerializer, StudentParentSerializer,
    AdmissionFeeSerializer, StudentFeeSerializer, StudentDocumentSerializer
)
from rest_framework import serializers
from django.db import transaction
import logging
from datetime import datetime, timedelta
from core.views import IsSchoolAdmin

logger = logging.getLogger(__name__)

class ParentView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        try:
            school = request.user.school
            if not school or not school.school_id:
                logger.error(f"No school_id for user {request.user.email}")
                return Response({"error": "No school associated with this user"}, status=status.HTTP_400_BAD_REQUEST)
            school_id = school.school_id
            parents = Parent.objects.filter(school__school_id=school_id, user__is_active=True)
            serializer = ParentSerializer(parents, many=True)
            logger.debug(f"Fetched {parents.count()} parents for school_id: {school_id}")
            return Response(serializer.data)
        except ObjectDoesNotExist:
            logger.error(f"School does not exist for user {request.user.email}")
            return Response({"error": "School does not exist"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            school_id = request.user.school.school_id
            if not school_id:
                logger.error(f"No school_id for user {request.user.email}")
                return Response({"error": "No school associated with this user"}, status=status.HTTP_400_BAD_REQUEST)
            serializer = ParentSerializer(data=request.data, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                result = serializer.save()
                parent = result['parent']
                logger.info(f"Created parent {parent.id} for school_id: {school_id}")
                return Response({
                    'parent': ParentSerializer(parent).data,
                    'username': parent.user.email,  # Use email instead of username
                    'password': result['password']
                }, status=status.HTTP_201_CREATED)
            logger.error(f"Create parent error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Parent creation failed: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, parent_id):
        try:
            school_id = request.user.school.school_id
            parent = get_object_or_404(Parent, id=parent_id, school__school_id=school_id)
            serializer = ParentSerializer(parent, data=request.data, partial=True, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Updated parent {parent_id} for school_id: {school_id}")
                return Response(serializer.data)
            logger.error(f"Update parent error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Update parent error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, parent_id):
        try:
            school_id = request.user.school.school_id
            parent = get_object_or_404(Parent, id=parent_id, school__school_id=school_id)
            with transaction.atomic():
                parent.user.is_active = False
                parent.user.save()
                logger.info(f"Deactivated parent {parent_id} for school_id: {school_id}")
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete parent error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class StudentView(ModelViewSet):
    queryset = Student.objects.all().select_related('user', 'school', 'class_id', 'section', 'academic_session')
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        try:
            school_id = self.request.user.school.school_id
            if not school_id:
                logger.error(f"No school_id for user {self.request.user.email}")
                return self.queryset.none()
            queryset = self.queryset.filter(school__school_id=school_id, user__is_active=True)
            status_filter = self.request.query_params.get('status')
            class_id = self.request.query_params.get('class_id')
            section_id = self.request.query_params.get('section_id')
            academic_session_id = self.request.query_params.get('academic_session_id')
            if status_filter:
                queryset = queryset.filter(status=status_filter)
            if class_id:
                queryset = queryset.filter(class_id=class_id, class_id__school__school_id=school_id)
            if section_id:
                queryset = queryset.filter(section_id=section_id, section__school__school_id=school_id)
            if academic_session_id:
                queryset = queryset.filter(academic_session_id=academic_session_id, academic_session__school__school_id=school_id)
            logger.debug(f"Returning {queryset.count()} students for school_id: {school_id}")
            return queryset
        except AttributeError:
            logger.error(f"School does not exist for user {self.request.user.email}")
            return self.queryset.none()

    def perform_create(self, serializer):
        try:
            school_id = self.request.user.school.school_id
            with transaction.atomic():
                result = serializer.save(school_id=school_id)
                student = result['student']
                admission_fee = AdmissionFee.objects.filter(
                    school__school_id=school_id,
                    class_id=student.class_id,
                    section=student.section,
                    is_active=True
                ).first()
                if admission_fee:
                    StudentFee.objects.create(
                        student=student,
                        admission_fee=admission_fee,
                        amount=admission_fee.amount,
                        due_date=datetime.now().date() + timedelta(days=30),
                        status='pending'
                    )
                logger.info(f"Created student {student.id} for school_id: {school_id}")
                return Response({
                    'student': StudentSerializer(student).data,
                    'username': student.user.email,  # Use email
                    'password': result['password']
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Create student error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_update(self, serializer):
        try:
            school_id = self.request.user.school.school_id
            with transaction.atomic():
                instance = serializer.save(school_id=school_id)
                logger.info(f"Updated student {instance.id} for school_id: {school_id}")
                return Response(StudentSerializer(instance).data)
        except serializers.ValidationError as e:
            logger.error(f"Update student validation error: {e.detail}")
            return Response({"errors": e.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Update student error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_destroy(self, instance):
        try:
            school_id = self.request.user.school.school_id
            with transaction.atomic():
                instance.user.is_active = False
                instance.user.save()
                logger.info(f"Deactivated student {instance.id} for school_id: {school_id}")
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete student error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'], url_path='documents')
    def documents(self, request, pk=None):
        try:
            school_id = request.user.school.school_id
            student = self.get_object()
            if student.school.school_id != school_id:
                logger.error(f"Student {student.id} does not belong to school_id {school_id}")
                return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
            if request.method == 'GET':
                documents = StudentDocument.objects.filter(student=student, student__school__school_id=school_id)
                serializer = StudentDocumentSerializer(documents, many=True)
                logger.debug(f"Fetched {documents.count()} documents for student {student.id}")
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
                            school__school_id=school_id
                        ).first().id if StudentDocumentType.objects.filter(school__school_id=school_id).exists() else None,
                        'student': student.id
                    }
                    serializer = StudentDocumentSerializer(data=data, context={'request': request, 'school_id': school_id})
                    if serializer.is_valid():
                        document = serializer.save(student=student)
                        responses.append(StudentDocumentSerializer(document).data)
                    else:
                        logger.error(f"Create document error: {serializer.errors}")
                        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                logger.info(f"Uploaded {len(responses)} documents for student {student.id}")
                return Response(responses, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Document operation error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put', 'delete'], url_path='documents/(?P<doc_id>\d+)')
    def document_detail(self, request, pk=None, doc_id=None):
        try:
            school_id = request.user.school.school_id
            student = self.get_object()
            document = StudentDocument.objects.get(id=doc_id, student=student, student__school__school_id=school_id)
            if request.method == 'PUT':
                serializer = StudentDocumentSerializer(document, data=request.data, partial=True, context={'request': request, 'school_id': school_id})
                if serializer.is_valid():
                    if 'file' in request.FILES and document.file:
                        default_storage.delete(document.file.path)
                    serializer.save()
                    logger.info(f"Updated document {doc_id} for student {student.id}")
                    return Response(serializer.data)
                logger.error(f"Update document error: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            elif request.method == 'DELETE':
                if document.file:
                    default_storage.delete(document.file.path)
                document.delete()
                logger.info(f"Deleted document {doc_id} for student {student.id}")
                return Response(status=status.HTTP_204_NO_CONTENT)
        except StudentDocument.DoesNotExist:
            logger.error(f"Document {doc_id} not found for student {pk}")
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Document operation error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get', 'post'], url_path='parents')
    def parents(self, request, pk=None):
        try:
            school_id = request.user.school.school_id
            student = self.get_object()
            if request.method == 'GET':
                student_parents = StudentParent.objects.filter(student=student, student__school__school_id=school_id)
                serializer = StudentParentSerializer(student_parents, many=True)
                logger.debug(f"Fetched {student_parents.count()} parents for student {student.id}")
                return Response(serializer.data)
            elif request.method == 'POST':
                serializer = StudentParentSerializer(data=request.data, context={'request': request, 'school_id': school_id})
                if serializer.is_valid():
                    serializer.save(student=student)
                    logger.info(f"Linked parent to student {student.id}")
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                logger.error(f"Create student parent error: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Parent operation error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], url_path='promote')
    def promote(self, request, pk=None):
        try:
            school_id = request.user.school.school_id
            student = self.get_object()
            if student.school.school_id != school_id:
                logger.error(f"Student {student.id} does not belong to school_id {school_id}")
                return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
            
            serializer = StudentSerializer(student, data=request.data, partial=True, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                with transaction.atomic():
                    serializer.save()
                    logger.info(f"Promoted student {student.id} to class {request.data.get('class_id')} in school_id {school_id}")
                    return Response(serializer.data, status=status.HTTP_200_OK)
            logger.error(f"Promote student error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Promote student error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class StudentParentView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def delete(self, request, student_id, parent_id):
        try:
            school_id = request.user.school.school_id
            student = get_object_or_404(Student, id=student_id, school__school_id=school_id)
            student_parent = get_object_or_404(StudentParent, student=student, parent__id=parent_id, parent__school__school_id=school_id)
            with transaction.atomic():
                student_parent.delete()
                logger.info(f"Removed parent {parent_id} from student {student_id} for school_id: {school_id}")
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete student parent error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class AdmissionFeeView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        try:
            school_id = request.user.school.school_id
            if not school_id:
                logger.error(f"No school_id for user {request.user.email}")
                return Response({"error": "No school associated with this user"}, status=status.HTTP_400_BAD_REQUEST)
            fees = AdmissionFee.objects.filter(school__school_id=school_id, is_active=True)
            serializer = AdmissionFeeSerializer(fees, many=True, context={'request': request})
            logger.info(f"Fetched {fees.count()} admission fees for school_id: {school_id}")
            return Response(serializer.data)
        except AttributeError:
            logger.error(f"School does not exist for user {request.user.email}")
            return Response({"error": "School does not exist"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            school_id = request.user.school.school_id
            serializer = AdmissionFeeSerializer(data=request.data, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                class_id = serializer.validated_data['class_id']
                section = serializer.validated_data.get('section')
                if not Class.objects.filter(id=class_id.id, school__school_id=school_id, is_active=True).exists():
                    logger.error(f"Invalid class_id {class_id.id} for school_id: {school_id}")
                    return Response({"error": "Invalid class for this school"}, status=status.HTTP_400_BAD_REQUEST)
                if section and not Section.objects.filter(id=section.id, school__school_id=school_id, is_active=True).exists():
                    logger.error(f"Invalid section_id {section.id} for school_id: {school_id}")
                    return Response({"error": "Invalid section for this school"}, status=status.HTTP_400_BAD_REQUEST)
                fee = serializer.save(school_id=school_id)
                logger.info(f"Created admission fee for class {class_id.name} in school_id: {school_id}")
                return Response(AdmissionFeeSerializer(fee).data, status=status.HTTP_201_CREATED)
            logger.error(f"Create admission fee error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Admission fee creation error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, fee_id):
        try:
            school_id = request.user.school.school_id
            fee = get_object_or_404(AdmissionFee, id=fee_id, school__school_id=school_id, is_active=True)
            serializer = AdmissionFeeSerializer(fee, data=request.data, partial=True, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                class_id = serializer.validated_data.get('class_id', fee.class_id)
                section = serializer.validated_data.get('section', fee.section)
                if not Class.objects.filter(id=class_id.id, school__school_id=school_id, is_active=True).exists():
                    logger.error(f"Invalid class_id {class_id.id} for school_id: {school_id}")
                    return Response({"error": "Invalid class for this school"}, status=status.HTTP_400_BAD_REQUEST)
                if section and not Section.objects.filter(id=section.id, school__school_id=school_id, is_active=True).exists():
                    logger.error(f"Invalid section_id {section.id} for school_id: {school_id}")
                    return Response({"error": "Invalid section for this school"}, status=status.HTTP_400_BAD_REQUEST)
                serializer.save()
                logger.info(f"Updated admission fee {fee_id} for school_id: {school_id}")
                return Response(serializer.data)
            logger.error(f"Update admission fee error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Admission fee update error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, fee_id):
        try:
            school_id = request.user.school.school_id
            fee = get_object_or_404(AdmissionFee, id=fee_id, school__school_id=school_id, is_active=True)
            with transaction.atomic():
                fee.is_active = False
                fee.save()
                logger.info(f"Deactivated admission fee {fee_id} for school_id: {school_id}")
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete admission fee error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class StudentFeeView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request, student_id=None):
        try:
            school_id = request.user.school.school_id
            if student_id:
                student = get_object_or_404(Student, id=student_id, school__school_id=school_id)
                fees = StudentFee.objects.filter(student=student, student__school__school_id=school_id)
            else:
                fees = StudentFee.objects.filter(student__school__school_id=school_id)
            serializer = StudentFeeSerializer(fees, many=True)
            logger.debug(f"Fetched {fees.count()} student fees for school_id: {school_id}")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Fetch student fee error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, student_id, fee_id):
        try:
            school_id = request.user.school.school_id
            student = get_object_or_404(Student, id=student_id, school__school_id=school_id)
            fee = get_object_or_404(StudentFee, id=fee_id, student=student, student__school__school_id=school_id)
            serializer = StudentFeeSerializer(fee, data=request.data, partial=True, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Updated student fee {fee_id} for student {student_id} in school_id: {school_id}")
                return Response(serializer.data)
            logger.error(f"Update student fee error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Update student fee error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ClassView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        try:
            school_id = request.user.school.school_id
            classes = Class.objects.filter(school__school_id=school_id, is_active=True)
            serializer = ClassSerializer(classes, many=True)
            logger.debug(f"Fetched {classes.count()} classes for school_id: {school_id}")
            return Response(serializer.data)
        except AttributeError:
            logger.error(f"School does not exist for user {request.user.email}")
            return Response({"error": "School does not exist"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            school_id = request.user.school.school_id
            serializer = ClassSerializer(data=request.data, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                serializer.save(school_id=school_id)
                logger.info(f"Created class for school_id: {school_id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.error(f"Create class error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Class creation error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, class_id):
        try:
            school_id = request.user.school.school_id
            class_obj = get_object_or_404(Class, id=class_id, school__school_id=school_id, is_active=True)
            serializer = ClassSerializer(class_obj, data=request.data, partial=True, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Updated class {class_id} for school_id: {school_id}")
                return Response(serializer.data)
            logger.error(f"Update class error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Class update error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, class_id):
        try:
            school_id = request.user.school.school_id
            class_obj = get_object_or_404(Class, id=class_id, school__school_id=school_id, is_active=True)
            with transaction.atomic():
                class_obj.is_active = False
                class_obj.save()
                logger.info(f"Deactivated class {class_id} for school_id: {school_id}")
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete class error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class SectionView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request, class_id=None):
        try:
            school_id = request.user.school.school_id
            if class_id:
                sections = Section.objects.filter(class_id=class_id, class_id__school__school_id=school_id, is_active=True)
            else:
                sections = Section.objects.filter(school__school_id=school_id, is_active=True)
            serializer = serializers.ModelSerializer(
                Section, fields=['id', 'name', 'class_id']
            )(sections, many=True)
            logger.debug(f"Fetched {sections.count()} sections for school_id: {school_id}")
            return Response(serializer.data)
        except AttributeError:
            logger.error(f"School does not exist for user {request.user.email}")
            return Response({"error": "School does not exist"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, class_id):
        try:
            school_id = request.user.school.school_id
            class_obj = get_object_or_404(Class, id=class_id, school__school_id=school_id, is_active=True)
            serializer = serializers.ModelSerializer(
                Section, fields=['id', 'name', 'class_id']
            )(data=request.data, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                serializer.save(school_id=school_id, class_id=class_obj)
                logger.info(f"Created section for class {class_id} in school_id: {school_id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.error(f"Create section error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Section creation error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, class_id, section_id):
        try:
            school_id = request.user.school.school_id
            section = get_object_or_404(Section, id=section_id, class_id=class_id, school__school_id=school_id, is_active=True)
            serializer = serializers.ModelSerializer(
                Section, fields=['id', 'name', 'class_id']
            )(section, data=request.data, partial=True, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Updated section {section_id} for class {class_id} in school_id: {school_id}")
                return Response(serializer.data)
            logger.error(f"Update section error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Section update error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, class_id, section_id):
        try:
            school_id = request.user.school.school_id
            section = get_object_or_404(Section, id=section_id, class_id=class_id, school__school_id=school_id, is_active=True)
            with transaction.atomic():
                section.is_active = False
                section.save()
                logger.info(f"Deactivated section {section_id} for class {class_id} in school_id: {school_id}")
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete section error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AcademicSessionView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        try:
            school_id = request.user.school.school_id
            sessions = AcademicSession.objects.filter(school__school_id=school_id)
            serializer = serializers.ModelSerializer(
                AcademicSession, fields=['id', 'name', 'start_date', 'end_date', 'status']
            )(sessions, many=True)
            logger.debug(f"Fetched {sessions.count()} sessions for school_id: {school_id}")
            return Response(serializer.data)
        except AttributeError:
            logger.error(f"School does not exist for user {request.user.email}")
            return Response({"error": "School does not exist"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            school_id = request.user.school.school_id
            serializer = serializers.ModelSerializer(
                AcademicSession, fields=['id', 'name', 'start_date', 'end_date', 'status']
            )(data=request.data, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                serializer.save(school_id=school_id)
                logger.info(f"Created academic session for school_id: {school_id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.error(f"Create academic session error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Academic session creation error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, session_id):
        try:
            school_id = request.user.school.school_id
            session = get_object_or_404(AcademicSession, id=session_id, school__school_id=school_id)
            serializer = serializers.ModelSerializer(
                AcademicSession, fields=['id', 'name', 'start_date', 'end_date', 'status']
            )(session, data=request.data, partial=True, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Updated academic session {session_id} for school_id: {school_id}")
                return Response(serializer.data)
            logger.error(f"Update academic session error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Academic session update error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, session_id):
        try:
            school_id = request.user.school.school_id
            session = get_object_or_404(AcademicSession, id=session_id, school__school_id=school_id)
            with transaction.atomic():
                session.delete()
                logger.info(f"Deleted academic session {session_id} for school_id: {school_id}")
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete academic session error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class StudentDocumentTypeView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        try:
            school_id = request.user.school.school_id
            doc_types = StudentDocumentType.objects.filter(school__school_id=school_id)
            serializer = serializers.ModelSerializer(
                StudentDocumentType, fields=['id', 'name']
            )(doc_types, many=True)
            logger.debug(f"Fetched {doc_types.count()} document types for school_id: {school_id}")
            return Response(serializer.data)
        except AttributeError:
            logger.error(f"School does not exist for user {request.user.email}")
            return Response({"error": "School does not exist"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            school_id = request.user.school.school_id
            serializer = serializers.ModelSerializer(
                StudentDocumentType, fields=['id', 'name']
            )(data=request.data, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                serializer.save(school_id=school_id)
                logger.info(f"Created document type for school_id: {school_id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.error(f"Create document type error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Document type creation error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, doc_type_id):
        try:
            school_id = request.user.school.school_id
            doc_type = get_object_or_404(StudentDocumentType, id=doc_type_id, school__school_id=school_id)
            serializer = serializers.ModelSerializer(
                StudentDocumentType, fields=['id', 'name']
            )(doc_type, data=request.data, partial=True, context={'request': request, 'school_id': school_id})
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Updated document type {doc_type_id} for school_id: {school_id}")
                return Response(serializer.data)
            logger.error(f"Update document type error: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Document type update error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, doc_type_id):
        try:
            school_id = request.user.school.school_id
            doc_type = get_object_or_404(StudentDocumentType, id=doc_type_id, school__school_id=school_id)
            with transaction.atomic():
                doc_type.delete()
                logger.info(f"Deleted document type {doc_type_id} for school_id: {school_id}")
                return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Delete document type error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class SchoolSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        try:
            school_id = request.user.school.school_id
            school = get_object_or_404(School, school_id=school_id)
            serializer = serializers.ModelSerializer(
                School, fields=['id', 'school_id', 'name']
            )(school)
            logger.debug(f"Retrieved school settings for school_id: {school_id}")
            return Response([serializer.data])
        except Exception as e:
            logger.error(f"School settings retrieval error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

class AdmissionView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def post(self, request):
        try:
            school = request.user.school
            logger.debug(f"School ID from user: {school.school_id}, School integer ID: {school.id}")
            if not school or not school.school_id:
                logger.error(f"User {request.user.id} has no associated school")
                return Response({"error": "User has no associated school"}, status=status.HTTP_400_BAD_REQUEST)
            school_id = school.school_id  # UUID
            logger.debug(f"Processing admission for school_id: {school_id}, School integer ID: {school.id}")

            # Log raw request data for debugging
            logger.debug(f"Raw request data: {request.data}")

            # Student data
            student_data = {
                'email': request.data.get('email'),
                'name': request.data.get('name'),
                'class_id': request.data.get('class_id'),
                'section_id': request.data.get('section_id'),
                'academic_session_id': request.data.get('academic_session_id'),
                'admission_date': request.data.get('admission_date'),
                'dob': request.data.get('dob'),
                'gender': request.data.get('gender'),
                'address': request.data.get('address'),
                'phone': request.data.get('phone'),
                'previous_school': request.data.get('previous_school'),
                'profile_image': request.FILES.get('profile_image')
            }
            logger.debug(f"Student data: {student_data}")

            # Parent data
            parent_option = request.data.get('parent_option')
            parent_data = {}
            if parent_option == 'new':
                parent_data_input = request.data.get('parent_data')
                if not parent_data_input:
                    logger.error("Missing parent_data for new parent option")
                    return Response(
                        {"error": "Parent data is required for new parent option. Please provide input_email, input_name, phone, address, and relationship."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                try:
                    # Parse parent_data if it's a JSON string
                    if isinstance(parent_data_input, str):
                        parent_data_input = json.loads(parent_data_input)
                    parent_data = {
                        'input_email': parent_data_input.get('input_email') or parent_data_input.get('email'),
                        'input_name': parent_data_input.get('input_name') or parent_data_input.get('name'),
                        'phone': parent_data_input.get('phone', ''),
                        'address': parent_data_input.get('address', ''),
                        'relationship': parent_data_input.get('relationship', 'Parent')
                    }
                    # Validate required fields
                    if not parent_data['input_email'] or not parent_data['input_name']:
                        logger.error("Missing required parent fields: input_email or input_name")
                        return Response(
                            {"error": "Parent data must include 'input_email' and 'input_name'"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except json.JSONDecodeError:
                    logger.error("Invalid parent_data format: must be valid JSON")
                    return Response(
                        {"error": "Invalid parent_data format: must be valid JSON"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                parent_data = {
                    'parent_id': request.data.get('parent_id'),
                    'relationship': request.data.get('relationship', 'Parent')
                }
            logger.debug(f"Parent option: {parent_option}, Parent data: {parent_data}")

            # Validate student data
            student_serializer = StudentSerializer(
                data=student_data,
                context={'request': request, 'school_id': school_id}
            )
            if not student_serializer.is_valid():
                logger.error(f"Student serializer errors: {student_serializer.errors}")
                return Response({"student_errors": student_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                # Save student
                result = student_serializer.save()
                student = result['student']
                student_credentials = {
                    'email': result['email'],
                    'password': result['password'],
                    'user_id': result['user_id']
                }

                parent_credentials = None
                if parent_option == 'new':
                    # Validate and save parent
                    parent_serializer = ParentSerializer(
                        data=parent_data,
                        context={'request': request, 'school_id': school_id}
                    )
                    if not parent_serializer.is_valid():
                        logger.error(f"Parent serializer errors: {parent_serializer.errors}")
                        return Response({"parent_errors": parent_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
                    parent_result = parent_serializer.save()
                    parent = parent_result['parent']
                    parent_credentials = {
                        'email': parent_result['email'],
                        'password': parent_result['password'],
                        'user_id': parent_result['user_id']
                    }
                    StudentParent.objects.create(
                        student=student,
                        parent=parent,
                        relationship=parent_data['relationship']
                    )
                else:
                    parent = Parent.objects.get(id=parent_data['parent_id'], school_id=school.id)
                    StudentParent.objects.create(
                        student=student,
                        parent=parent,
                        relationship=parent_data['relationship']
                    )

                # Create admission fee if applicable
                admission_fee = AdmissionFee.objects.filter(
                    school__school_id=school_id,
                    class_id=student.class_id,
                    section=student.section,
                    is_active=True
                ).first()
                if admission_fee:
                    StudentFee.objects.create(
                        student=student,
                        admission_fee=admission_fee,
                        amount=admission_fee.amount,
                        due_date=datetime.now().date() + timedelta(days=30),
                        status='pending'
                    )

                response_data = {
                    'student': StudentSerializer(student).data,
                    'student_credentials': student_credentials,
                    'parent_credentials': parent_credentials
                }
                logger.info(f"Admission created for student {student.id} in school_id: {school_id}, School integer ID: {school.id}")
                return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Admission creation failed: {str(e)}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)