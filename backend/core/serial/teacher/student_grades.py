import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from core.domain.teacher import Teacher
from core.domain.teacher_assignment import ClassTeacher, TeacherAssignment
from core.models import Student, Score, Section
from django.db.models import Q

logger = logging.getLogger(__name__)

class StudentGradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    exam_name = serializers.CharField(source='exam.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    max_marks = serializers.SerializerMethodField()
    
    class Meta:
        model = Score
        fields = ['id', 'student_name', 'admission_number', 'section_name', 
                 'exam_name', 'subject_name', 'marks_obtained', 'max_marks']
    
    def get_max_marks(self, obj):
        from core.models import ExamSubject
        exam_subject = ExamSubject.objects.filter(
            exam=obj.exam, subject=obj.subject
        ).first()
        return exam_subject.max_marks if exam_subject else 100

class TeacherGradeClassesSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_obj.name')
    
    class Meta:
        model = TeacherAssignment
        fields = ['class_obj', 'class_name']

class ClassTeacherGradeSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_id.name')
    
    class Meta:
        model = ClassTeacher
        fields = ['class_id', 'class_name']

class TeacherClassesAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not hasattr(request.user, 'role') or request.user.role != 'teacher':
            return Response(
                {"detail": "Only teachers can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            teacher = Teacher.objects.get(staff__user=request.user)
            
            # Get classes from subject assignments
            subject_assignments = TeacherAssignment.objects.filter(
                teacher=teacher,
                class_obj__is_active=True
            ).select_related('class_obj').values('class_obj', 'class_obj__name').distinct()
            
            # Get classes from class teacher assignments
            class_teacher_assignments = ClassTeacher.objects.filter(
                teacher=teacher,
                is_active=True
            ).select_related('class_id').values('class_id', 'class_id__name').distinct()
            
            # Combine and deduplicate classes
            classes = set()
            for assignment in subject_assignments:
                classes.add((assignment['class_obj'], assignment['class_obj__name']))
            for assignment in class_teacher_assignments:
                classes.add((assignment['class_id'], assignment['class_id__name']))
            
            data = [{'id': cls_id, 'name': cls_name} for cls_id, cls_name in classes]
            return Response(data, status=status.HTTP_200_OK)
            
        except Teacher.DoesNotExist:
            logger.error(f"Teacher profile not found for user {request.user.id}")
            return Response([], status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching classes: {str(e)}", exc_info=True)
            return Response([], status=status.HTTP_200_OK)

class TeacherStudentsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, class_id):
        search = request.query_params.get('search', '')
        
        if not hasattr(request.user, 'role') or request.user.role != 'teacher':
            return Response(
                {"detail": "Only teachers can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            teacher = Teacher.objects.get(staff__user=request.user)
            
            # Verify teacher has access to this class
            has_access = (
                TeacherAssignment.objects.filter(
                    teacher=teacher, class_obj__id=class_id, class_obj__is_active=True
                ).exists() or 
                ClassTeacher.objects.filter(
                    teacher=teacher, class_id__id=class_id, is_active=True
                ).exists()
            )
            
            if not has_access:
                return Response(
                    {"detail": "You are not authorized to view students for this class"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            students = Student.objects.filter(
                class_id=class_id, status='active'
            ).select_related('user', 'section')
            
            if search:
                students = students.filter(
                    Q(user__name__icontains=search) | 
                    Q(admission_number__icontains=search)
                )
            
            data = [{
                'id': student.id,
                'name': student.user.name,
                'admission_number': student.admission_number,
                'section_name': student.section.name if student.section else 'No Section'
            } for student in students]
            
            return Response(data, status=status.HTTP_200_OK)
            
        except Teacher.DoesNotExist:
            logger.error(f"Teacher profile not found for user {request.user.id}")
            return Response(
                {"detail": "Teacher profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching students: {str(e)}", exc_info=True)
            return Response(
                {"detail": "Failed to fetch students. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StudentGradesAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, student_id):
        if not hasattr(request.user, 'role') or request.user.role != 'teacher':
            return Response(
                {"detail": "Only teachers can access this endpoint"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            teacher = Teacher.objects.get(staff__user=request.user)
            student = Student.objects.get(id=student_id)
            
            # Verify teacher has access to this student's class
            has_access = (
                TeacherAssignment.objects.filter(
                    teacher=teacher, class_obj__id=student.class_id.id, class_obj__is_active=True
                ).exists() or 
                ClassTeacher.objects.filter(
                    teacher=teacher, class_id__id=student.class_id.id, is_active=True
                ).exists()
            )
            
            if not has_access:
                return Response(
                    {"detail": "You are not authorized to view grades for this student"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get all scores for this student
            scores = Score.objects.filter(
                student=student
            ).select_related('exam', 'subject', 'section').order_by('-exam__created_at')
            
            serializer = StudentGradeSerializer(scores, many=True)
            
            # Also return student info
            student_info = {
                'id': student.id,
                'name': student.user.name,
                'admission_number': student.admission_number,
                'class_name': student.class_id.name,
                'section_name': student.section.name if student.section else 'No Section'
            }
            
            return Response({
                'student': student_info,
                'grades': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Teacher.DoesNotExist:
            logger.error(f"Teacher profile not found for user {request.user.id}")
            return Response(
                {"detail": "Teacher profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Student.DoesNotExist:
            logger.error(f"Student with ID {student_id} not found")
            return Response(
                {"detail": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error fetching student grades: {str(e)}", exc_info=True)
            return Response(
                {"detail": "Failed to fetch student grades. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )