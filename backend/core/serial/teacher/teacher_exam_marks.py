from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from core.models import Class, Exam, ExamSubject, Subject, Student, Score, Section, Staff
from rest_framework import serializers
from django.db.models import Q
from core.serial.admin.exam import ScoreCreateSerializer

class TeacherExamSubjectSerializer(serializers.ModelSerializer):
    subject_id = serializers.IntegerField(source='subject.id')
    subject_name = serializers.CharField(source='subject.name')

    class Meta:
        model = ExamSubject
        fields = ['id', 'subject_id', 'subject_name', 'date', 'max_marks', 'passing_marks']

class TeacherExamSerializer(serializers.ModelSerializer):
    exam_id = serializers.IntegerField(source='id')
    exam_name = serializers.CharField(source='name')
    subjects = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = ['exam_id', 'exam_name', 'subjects']

    def get_subjects(self, obj):
        teacher = self.context.get('teacher')
        # Only show subjects assigned to this teacher
        exam_subjects = ExamSubject.objects.filter(
            exam=obj,
            subject__in=teacher.subjects.all()
        )
        return TeacherExamSubjectSerializer(exam_subjects, many=True).data

class TeacherClassSerializer(serializers.ModelSerializer):
    class_id = serializers.IntegerField(source='id')
    class_name = serializers.CharField(source='name')
    exams = serializers.SerializerMethodField()

    class Meta:
        model = Class
        fields = ['class_id', 'class_name', 'exams']

    def get_exams(self, obj):
        teacher = self.context.get('teacher')
        exams = Exam.objects.filter(classes=obj)
        return TeacherExamSerializer(exams, many=True, context={'teacher': teacher}).data

class TeacherExamMarkClassListAPIView(APIView):
    """
    Returns list of classes assigned to the teacher, with their exams and subjects.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # Get staff/teacher object
        try:
            teacher = Staff.objects.get(user=user)
        except Staff.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)
        school = getattr(user, 'school', None)
        if not school:
            return Response([], status=status.HTTP_200_OK)
        # Only show classes assigned to this teacher
        teacher_classes = teacher.classes.filter(is_active=True, school=school.school_id).distinct()
        serializer = TeacherClassSerializer(teacher_classes, many=True, context={'teacher': teacher})
        return Response(serializer.data, status=status.HTTP_200_OK)

class TeacherExamMarkStudentListAPIView(APIView):
    """
    Returns students for a given class.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, class_id):
        user = request.user
        school = getattr(user, 'school', None)
        if not school:
            return Response([], status=status.HTTP_200_OK)
        students = Student.objects.filter(class_id=class_id, status='active', school=school.id)
        data = [
            {
                'id': s.id,
                'name': s.user.name,
                'admission_number': s.admission_number,
                'section': s.section.id if s.section else None,
            }
            for s in students
        ]
        return Response(data, status=status.HTTP_200_OK)

class TeacherExamMarkSubmitAPIView(APIView):
    """
    Submit marks for students for a given exam and subject.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Expects:
        {
            "exam_id": int,
            "subject_id": int,
            "class_id": int,
            "section_id": int,  # (optional, but recommended)
            "marks": [
                {"student_id": int, "marks_obtained": float}
            ]
        }
        """
        exam_id = request.data.get('exam_id')
        subject_id = request.data.get('subject_id')
        class_id = request.data.get('class_id')
        section_id = request.data.get('section_id')
        marks = request.data.get('marks', [])

        # Try to infer section_id if not provided (use first student's section)
        if not section_id and marks and marks[0].get('student_id'):
            from core.models import Student
            first_student = Student.objects.filter(id=marks[0]['student_id']).first()
            if first_student and first_student.section:
                section_id = first_student.section.id

        # Prepare scores data for ScoreCreateSerializer
        scores = []
        for entry in marks:
            scores.append({
                "student": {"id": entry.get("student_id")},
                "marks_obtained": entry.get("marks_obtained"),
            })

        serializer = ScoreCreateSerializer(
            data={
                "exam_id": exam_id,
                "subject_id": subject_id,
                "section_id": section_id,
                "scores": scores,
            },
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Marks saved.'}, status=status.HTTP_200_OK)

class TeacherExamMarkGetAPIView(APIView):
    """
    Get marks for students for a given exam, subject, section.
    Query params: exam_id, subject_id, section_id
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        exam_id = request.query_params.get('exam_id')
        subject_id = request.query_params.get('subject_id')
        section_id = request.query_params.get('section_id')
        if not (exam_id and subject_id and section_id):
            return Response({'detail': 'exam_id, subject_id, and section_id are required.'}, status=status.HTTP_400_BAD_REQUEST)
        # Fetch all scores for this exam/subject/section
        scores = Score.objects.filter(
            exam_id=exam_id,
            subject_id=subject_id,
            section_id=section_id
        ).select_related('student')
        data = [
            {
                'student_id': s.student.id,
                'marks_obtained': s.marks_obtained
            }
            for s in scores
        ]
        return Response(data, status=status.HTTP_200_OK)
