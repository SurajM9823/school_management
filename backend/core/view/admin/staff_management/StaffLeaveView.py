# core/views/staff_leave_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import Staff, StaffLeave
from core.serial.admin.staffmanagement.StaffLeaveSerializer import StaffLeaveSerializer
from django.shortcuts import get_object_or_404

class StaffLeaveCreateView(APIView):
    def post(self, request, staff_id):
        # Normalize school_id
        school_id = str(request.user.school.school_id).replace('-', '')
        staff = get_object_or_404(Staff, id=staff_id, school_id=school_id)
        data = request.data.copy()
        data['staff'] = staff.id
        data['school'] = school_id
        serializer = StaffLeaveSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            staff.status = 'on_leave'
            staff.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)