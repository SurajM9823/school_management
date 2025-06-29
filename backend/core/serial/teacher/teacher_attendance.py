from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import Class, Student, Attendance, Section
from django.utils.dateparse import parse_date
from rest_framework import serializers

# Serializer for Class
class ClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = Class
        fields = ['id', 'name']

# Serializer for Student
class StudentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.name', read_only=True)  # Add this line

    class Meta:
        model = Student
        fields = ['id', 'user', 'admission_number', 'status', 'class_id', 'section', 'name']  # Add 'name'

# Serializer for Attendance
class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.name', read_only=True)
    admission_number = serializers.CharField(source='student.admission_number', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'student', 'student_name', 'admission_number', 'date', 'status', 'class_id', 'section']

# API to get all classes for the current user's school
class ClassListAPIView(APIView):
    def get(self, request):
        school = getattr(request.user, 'school', None)
        if not school:
            return Response([], status=status.HTTP_200_OK)
        classes = Class.objects.filter(is_active=True, school=school.school_id)
        serializer = ClassSerializer(classes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# API to get students by class for the current user's school
class StudentListByClassAPIView(APIView):
    def get(self, request, class_id):
        school = getattr(request.user, 'school', None)
        if not school:
            return Response([], status=status.HTTP_200_OK)
        students = Student.objects.filter(class_id=class_id, status='active', school=school.id)
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

# API to save attendance
class AttendanceSaveAPIView(APIView):
    def post(self, request):
        """
        Expects data: {
            "class_id": int,
            "section": int or null,
            "date": "YYYY-MM-DD",
            "attendance": [
                {"student": id, "status": "present"/"absent"/"late"/"leave"}
            ]
        }
        """
        school = getattr(request.user, 'school', None)
        class_id = request.data.get('class_id')
        section_id = request.data.get('section')
        date_str = request.data.get('date')
        attendance_data = request.data.get('attendance', [])
        date_obj = parse_date(date_str)

        if not (school and class_id and date_obj):
            return Response({'detail': 'Missing required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        for entry in attendance_data:
            student_id = entry.get('student')
            status_val = entry.get('status')
            if not (student_id and status_val):
                continue
            att_obj, created = Attendance.objects.update_or_create(
                student_id=student_id,
                date=date_obj,
                defaults={
                    'status': status_val,
                    'class_id_id': class_id,
                    'section_id': section_id
                }
            )
        return Response({'detail': 'Attendance saved.'}, status=status.HTTP_200_OK)

# API to view attendance
class AttendanceListAPIView(APIView):
    def get(self, request):
        """
        Query params: class_id, section (optional), date (optional)
        """
        school = getattr(request.user, 'school', None)
        class_id = request.query_params.get('class_id')
        section_id = request.query_params.get('section')
        date_str = request.query_params.get('date')
        filters = {}

        if not school:
            return Response({'detail': 'No school found for user.'}, status=status.HTTP_400_BAD_REQUEST)

        # Use UUID for Attendance.class_id__school
        filters['class_id__school'] = school.school_id

        if class_id:
            try:
                filters['class_id'] = int(class_id)
            except (ValueError, TypeError):
                return Response({'detail': 'Invalid class_id.'}, status=status.HTTP_400_BAD_REQUEST)

        if section_id:
            try:
                filters['section'] = int(section_id)
            except (ValueError, TypeError):
                return Response({'detail': 'Invalid section.'}, status=status.HTTP_400_BAD_REQUEST)

        if date_str:
            date_obj = parse_date(date_str)
            if date_obj:
                filters['date'] = date_obj
            else:
                return Response({'detail': 'Invalid date.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            attendances = Attendance.objects.filter(**filters).select_related('student__user')
            serializer = AttendanceSerializer(attendances, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({'detail': f'Internal server error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)