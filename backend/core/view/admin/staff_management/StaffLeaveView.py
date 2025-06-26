# core/views/staff_leave_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from core.models import Staff, StaffLeave
from core.serial.admin.staffmanagement.StaffLeaveSerializer import StaffLeaveSerializer
from django.shortcuts import get_object_or_404

class StaffLeaveCreateView(APIView):
    def post(self, request, staff_id):
        # Get the staff member without filtering by school
        staff = get_object_or_404(Staff, id=staff_id)
        
        # Debug logging
        print(f"Received leave request for staff ID: {staff_id}")
        print(f"Request data: {request.data}")
        print(f"Staff school: {staff.school.school_id if staff.school else 'None'}")
        
        data = request.data.copy()
        data['staff'] = staff.id
        data['school'] = staff.school.school_id if staff.school else None
        
        # Debug logging
        print(f"Modified data for serializer: {data}")
        
        serializer = StaffLeaveSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            staff.status = 'on_leave'
            staff.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)