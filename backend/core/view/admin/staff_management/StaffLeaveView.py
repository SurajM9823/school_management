from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Staff
from core.serial.admin.staffmanagement.StaffLeaveSerializer import StaffLeaveSerializer


class StaffLeaveCreateView(APIView):
    def post(self, request, staff_id):
        # Get the staff member without filtering by school
        staff = get_object_or_404(Staff, id=staff_id)

        data = request.data.copy()
        data["staff"] = staff.id
        data["school"] = staff.school.id if staff.school else None

        serializer = StaffLeaveSerializer(data=data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            staff.status = "on_leave"
            staff.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
