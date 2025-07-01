from core.models import AcademicSession, Class, Exam, ExamSubject, Score, Section, Student, Subject, Term
from rest_framework import serializers
from core.serializers import ClassSerializer, SubjectSerializer
from datetime import datetime
import logging
logger = logging.getLogger(__name__)
class ExamSubjectSerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.filter(is_active=True),
        source='subject'
    )

    class Meta:
        model = ExamSubject
        fields = ['subject_id', 'date', 'time', 'max_marks', 'passing_marks']
        extra_kwargs = {
            'date': {'required': True},
            'time': {'required': True},
            'max_marks': {'required': True},
            'passing_marks': {'required': True}
        }

    def validate(self, data):
        max_marks = data.get('max_marks')
        passing_marks = data.get('passing_marks')
        if max_marks is not None and max_marks < 0:
            raise serializers.ValidationError({'max_marks': 'Max marks cannot be negative'})
        if passing_marks is not None and passing_marks < 0:
            raise serializers.ValidationError({'passing_marks': 'Passing marks cannot be negative'})
        if max_marks is not None and passing_marks is not None and passing_marks > max_marks:
            raise serializers.ValidationError({'passing_marks': 'Passing marks cannot exceed max marks'})
        return data

class ExamSerializer(serializers.ModelSerializer):
    session_id = serializers.PrimaryKeyRelatedField(
        queryset=AcademicSession.objects.filter(status='active'),
        write_only=True,
        source='session'
    )
    term_id = serializers.PrimaryKeyRelatedField(
        queryset=Term.objects.filter(is_active=True),
        write_only=True,
        source='term'
    )
    class_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Class.objects.filter(is_active=True),
        source='classes',
        write_only=True
    )
    subjects = ExamSubjectSerializer(many=True, source='exam_subjects')
    classes = ClassSerializer(many=True, read_only=True)
    # Add read-only fields for session_id and term_id
    session_id_read = serializers.IntegerField(source='session.id', read_only=True)
    term_id_read = serializers.IntegerField(source='term.id', read_only=True)

    class Meta:
        model = Exam
        fields = [
            'id', 'name', 'exam_type', 'session_id', 'term_id', 'class_ids',
            'start_date', 'end_date', 'status', 'total_marks', 'passing_marks',
            'subjects', 'classes', 'session_id_read', 'term_id_read', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        school = self.context['request'].user.school
        if not school:
            raise serializers.ValidationError({"error": "User is not associated with a school"})

        start_date = data.get('start_date')
        end_date = data.get('end_date')
        session = data.get('session')
        term = data.get('term')
        classes = data.get('classes', [])
        subjects = data.get('exam_subjects', [])

        # Validate dates
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({'end_date': 'End date must be after start date'})

        # Validate session and term
        if session and term and term.session != session:
            raise serializers.ValidationError({'term_id': 'Term must belong to the selected session'})

        # Validate session belongs to school
        if session and session.school != school:
            raise serializers.ValidationError({'session_id': 'Invalid session for this school'})

        # Validate term belongs to school
        if term and term.school != school:
            raise serializers.ValidationError({'term_id': 'Invalid term for this school'})

        # Validate classes belong to school
        if classes:
            invalid_classes = [cls.id for cls in classes if cls.school != school]
            if invalid_classes:
                raise serializers.ValidationError({'class_ids': f"Classes {invalid_classes} do not belong to this school"})

        # Validate subjects and their association with classes
        if subjects:
            # Ensure unique subject_ids
            subject_ids = [subject_data['subject'].id for subject_data in subjects]
            if len(subject_ids) != len(set(subject_ids)):
                raise serializers.ValidationError({'subjects': 'Duplicate subjects are not allowed'})

            for subject_data in subjects:
                subject = subject_data.get('subject')
                date = subject_data.get('date')
                if subject and classes:
                    subject_classes = subject.classes.filter(is_active=True)
                    if not subject_classes.filter(id__in=[c.id for c in classes]).exists():
                        raise serializers.ValidationError({
                            'subjects': f"Subject {subject.name} is not associated with any of the selected classes"
                        })
                if date and (date < start_date or date > end_date):
                    raise serializers.ValidationError({
                        'subjects': f"Subject {subject.name} exam date must be within the exam's start and end dates"
                    })

        # Validate total_marks and passing_marks
        total_marks = data.get('total_marks')
        passing_marks = data.get('passing_marks')
        if total_marks is not None and total_marks < 0:
            raise serializers.ValidationError({'total_marks': 'Total marks cannot be negative'})
        if passing_marks is not None and passing_marks < 0:
            raise serializers.ValidationError({'passing_marks': 'Passing marks cannot be negative'})
        if total_marks is not None and passing_marks is not None and passing_marks > total_marks:
            raise serializers.ValidationError({'passing_marks': 'Passing marks cannot exceed total marks'})

        return data

    def create(self, validated_data):
        school = self.context['request'].user.school
        classes_data = validated_data.pop('classes', [])
        subjects_data = validated_data.pop('exam_subjects', [])
        validated_data['school'] = school

        # Create exam
        exam = Exam.objects.create(**validated_data)

        # Associate classes
        exam.classes.set(classes_data)
        logger.info(f"Exam '{exam.name}' created with classes {[c.id for c in classes_data]} by user {self.context['request'].user} for school {school}")

        # Create exam subjects
        for subject_data in subjects_data:
            ExamSubject.objects.create(exam=exam, **subject_data)
        logger.info(f"Exam subjects created for exam '{exam.name}' by user {self.context['request'].user}")

        return exam

    def update(self, instance, validated_data):
        school = self.context['request'].user.school
        if instance.school != school:
            raise serializers.ValidationError({"error": "Cannot update exam from another school"})

        classes_data = validated_data.pop('classes', None)
        subjects_data = validated_data.pop('exam_subjects', None)

        # Update exam fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update classes if provided
        if classes_data is not None:
            instance.classes.set(classes_data)
            logger.info(f"Exam '{instance.name}' updated with classes {[c.id for c in classes_data]} by user {self.context['request'].user}")

        # Update subjects if provided
        if subjects_data is not None:
            existing_subjects = {es.subject_id: es for es in instance.exam_subjects.all()}
            new_subject_ids = [sd['subject'].id for sd in subjects_data]
            
            # Delete subjects not in the new data
            for subject_id, exam_subject in existing_subjects.items():
                if subject_id not in new_subject_ids:
                    exam_subject.delete()
                    logger.info(f"Deleted subject {subject_id} from exam '{instance.name}'")

            # Create or update subjects
            for subject_data in subjects_data:
                subject_id = subject_data['subject'].id
                if subject_id in existing_subjects:
                    # Update existing ExamSubject
                    exam_subject = existing_subjects[subject_id]
                    for attr, value in subject_data.items():
                        setattr(exam_subject, attr, value)
                    exam_subject.save()
                    logger.info(f"Updated subject {subject_id} for exam '{instance.name}'")
                else:
                    # Create new ExamSubject
                    ExamSubject.objects.create(exam=instance, **subject_data)
                    logger.info(f"Created subject {subject_id} for exam '{instance.name}'")

        return instance

class ScoreSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.id', required=False)
    marks_obtained = serializers.FloatField(allow_null=True, required=False)

    class Meta:
        model = Score
        fields = ['student_id', 'marks_obtained']

    def validate(self, data):
        # Skip validation if context is not provided (will be validated in parent serializer)
        if not all(key in self.context for key in ['exam', 'subject', 'section', 'max_marks']):
            return data
            
        exam = self.context['exam']
        subject = self.context['subject']
        section = self.context['section']
        max_marks = self.context['max_marks']

        student_data = data.get('student')
        if not student_data:
            return data
        student_id = student_data.get('id')
        marks_obtained = data.get('marks_obtained')

        # Validate student exists and belongs to the section
        try:
            student = Student.objects.get(id=student_id, section=section)
        except Student.DoesNotExist:
            logger.error(f"Student {student_id} not found in section {section.id}")
            raise serializers.ValidationError({'student_id': f"Student {student_id} not found in section {section.name}"})

        # Validate marks
        if marks_obtained is not None:
            if marks_obtained < 0:
                raise serializers.ValidationError({'marks_obtained': 'Marks cannot be negative'})
            if marks_obtained > max_marks:
                raise serializers.ValidationError({'marks_obtained': f'Marks cannot exceed {max_marks}'})

        # Check for existing score
        if Score.objects.filter(exam=exam, subject=subject, student=student).exists():
            raise serializers.ValidationError({'student_id': f'Score already exists for student {student_id} in this exam and subject'})

        return data
    
class ScoreCreateSerializer(serializers.Serializer):
    exam_id = serializers.IntegerField()
    subject_id = serializers.IntegerField()
    section_id = serializers.IntegerField()
    scores = ScoreSerializer(many=True)

    def validate(self, data):
        exam_id = data.get('exam_id')
        subject_id = data.get('subject_id')
        section_id = data.get('section_id')
        scores = data.get('scores', [])

        # Validate exam
        try:
            exam = Exam.objects.get(id=exam_id, school=self.context['request'].user.school)
            from datetime import date
            today = date.today()
            exam_end_date = exam.end_date
            
            # Allow scores if exam is completed, results_published, or past end date
            if not (exam.status in ['completed', 'results_published'] or exam_end_date < today):
                raise serializers.ValidationError({'exam_id': 'Scores can only be entered for completed exams, published results, or exams past their end date'})
        except Exam.DoesNotExist:
            logger.error(f"Exam {exam_id} not found")
            raise serializers.ValidationError({'exam_id': 'Exam not found'})

        # Validate subject
        try:
            subject = Subject.objects.get(id=subject_id, is_active=True)
            if not exam.exam_subjects.filter(subject=subject).exists():
                raise serializers.ValidationError({'subject_id': f'Subject {subject.name} is not part of this exam'})
        except Subject.DoesNotExist:
            logger.error(f"Subject {subject_id} not found")
            raise serializers.ValidationError({'subject_id': 'Subject not found'})

        # Validate section
        try:
            section = Section.objects.get(id=section_id)
        except Section.DoesNotExist:
            logger.error(f"Section {section_id} not found")
            raise serializers.ValidationError({'section_id': 'Section not found'})

        # Get max marks for the subject
        exam_subject = exam.exam_subjects.get(subject=subject)
        max_marks = exam_subject.max_marks

        # Skip student validation - allow partial score entry

        # Pass context to ScoreSerializer
        for score in scores:
            score_serializer = ScoreSerializer(data=score, context={
                'exam': exam,
                'subject': subject,
                'section': section,
                'max_marks': max_marks
            })
            score_serializer.is_valid(raise_exception=True)

        return data

    def create(self, validated_data):
        exam = Exam.objects.get(id=validated_data['exam_id'])
        subject = Subject.objects.get(id=validated_data['subject_id'])
        section = Section.objects.get(id=validated_data['section_id'])
        scores_data = validated_data['scores']

        created_scores = []
        for score_data in scores_data:
            student = Student.objects.get(id=score_data['student']['id'])
            score, created = Score.objects.update_or_create(
                exam=exam,
                subject=subject,
                student=student,
                section=section,
                defaults={'marks_obtained': score_data.get('marks_obtained')}
            )
            created_scores.append(score)
            action = "Created" if created else "Updated"
            logger.info(f"{action} score for student {student.id} in exam {exam.id}, subject {subject.id}: {score.marks_obtained}")

        return created_scores