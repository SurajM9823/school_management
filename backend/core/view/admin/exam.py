from core.serial.admin.exam import ExamSerializer, ScoreCreateSerializer, IsAdminOrTeacher
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.models import Exam, ExamSubject, Score
from core.views import IsSchoolAdmin
import logging
logger =   logging.getLogger(__name__)

class ExamView(APIView):
    permission_classes = [IsAuthenticated, IsSchoolAdmin]

    def get(self, request, pk=None):
        logger.info(f"Fetching exams for user: {request.user}")
        school = request.user.school
        if not school:
            logger.warning(f"No school associated with user: {request.user}")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        if pk:
            # Get single exam
            try:
                exam = Exam.objects.get(pk=pk, school=school)
                serializer = ExamSerializer(exam)
                return Response(serializer.data)
            except Exam.DoesNotExist:
                logger.warning(f"Exam {pk} not found for school {school}")
                return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Get all exams
            exams = Exam.objects.filter(school=school)
            serializer = ExamSerializer(exams, many=True)
            return Response(serializer.data)

    def post(self, request):
        logger.info(f"Creating exam for user: {request.user}")
        school = request.user.school
        if not school:
            logger.warning(f"No school associated with user: {request.user}")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExamSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            exam = serializer.save()
            logger.info(f"Exam '{exam.name}' created successfully")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Exam creation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        logger.info(f"Updating exam {pk} for user: {request.user}")
        school = request.user.school
        if not school:
            logger.warning(f"No school associated with user: {request.user}")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        try:
            exam = Exam.objects.get(pk=pk, school=school)
        except Exam.DoesNotExist:
            logger.warning(f"Exam {pk} not found for school {school}")
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExamSerializer(exam, data=request.data, context={'request': request}, partial=True)
        if serializer.is_valid():
            exam = serializer.save()
            logger.info(f"Exam '{exam.name}' updated successfully")
            return Response(serializer.data)
        logger.error(f"Exam update errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        logger.info(f"Deleting exam {pk} for user: {request.user}")
        school = request.user.school
        if not school:
            logger.warning(f"No school associated with user: {request.user}")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        try:
            exam = Exam.objects.get(pk=pk, school=school)
        except Exam.DoesNotExist:
            logger.warning(f"Exam {pk} not found for school {school}")
            return Response({"error": "Exam not found"}, status=status.HTTP_404_NOT_FOUND)

        exam.delete()
        logger.info(f"Exam {pk} deleted successfully")
        return Response(status=status.HTTP_204_NO_CONTENT)

class ScoreView(APIView):
    permission_classes = [IsAdminOrTeacher]

    def get(self, request):
        logger.info(f"Fetching scores for user: {request.user}")
        school = request.user.school
        if not school:
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        exam_id = request.query_params.get('exam_id')
        subject_id = request.query_params.get('subject_id')
        section_id = request.query_params.get('section_id')

        if not all([exam_id, subject_id, section_id]):
            return Response({"error": "exam_id, subject_id, and section_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            scores = Score.objects.filter(
                exam_id=exam_id,
                subject_id=subject_id,
                section_id=section_id,
                exam__school=school
            ).values('student_id', 'marks_obtained')
            return Response(list(scores))
        except Exception as e:
            logger.error(f"Error fetching scores: {e}")
            return Response({"error": "Failed to fetch scores"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        logger.info(f"Creating scores for user: {request.user}")
        school = request.user.school
        if not school:
            logger.warning(f"No school associated with user: {request.user}")
            return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ScoreCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            scores = serializer.save()
            logger.info(f"Successfully created {len(scores)} scores")
            return Response({"message": "Scores created successfully"}, status=status.HTTP_201_CREATED)
        logger.error(f"Score creation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)