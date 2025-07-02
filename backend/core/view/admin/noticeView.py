from rest_framework import viewsets, status
from rest_framework.response import Response
from core.models import Notice
from core.serial.admin.noticeSerializer import NoticeSerializer
import logging

logger = logging.getLogger(__name__)

class NoticeViewSet(viewsets.ModelViewSet):
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer

    def get_queryset(self):
        school_id = self.request.user.school_id
        academic_session_id = self.request.query_params.get('academic_session_id')
        queryset = Notice.objects.filter(school__school_id=school_id, is_active=True)
        if academic_session_id:
            queryset = queryset.filter(academic_session_id=academic_session_id)
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error in NoticeViewSet.create: {str(e)}")
            return Response(
                {"detail": f"Failed to create notice: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in NoticeViewSet.update: {str(e)}")
            return Response(
                {"detail": f"Failed to update notice: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            instance.is_active = False
            instance.save()
            return Response({"message": "Notice deactivated."}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error in NoticeViewSet.destroy: {str(e)}")
            return Response(
                {"detail": f"Failed to deactivate notice: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )