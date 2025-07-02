from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from core.models import Event, EventAssignment
from core.serial.admin.eventSerial import EventSerializer, EventAssignmentSerializer
import logging

logger = logging.getLogger(__name__)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

class EventAssignmentViewSet(viewsets.ModelViewSet):
    queryset = EventAssignment.objects.all()
    serializer_class = EventAssignmentSerializer

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in EventAssignmentViewSet.create: {str(e)}")
            return Response(
                {"detail": f"Failed to create assignment: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        try:
            assignment = self.get_object()
            if not assignment.is_active:
                return Response({"error": "Assignment is already revoked"}, status=status.HTTP_400_BAD_REQUEST)
            assignment.is_active = False
            assignment.revoked_at = timezone.now()
            assignment.save()
            return Response({"message": "Event assignment revoked."}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error in revoke: {str(e)}")
            return Response({"detail": f"Failed to revoke assignment: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)