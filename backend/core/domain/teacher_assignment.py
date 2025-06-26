from django.db import models

class TeacherAssignment(models.Model):
    """
    Model to track teacher assignments to specific class-section-subject combinations.
    """
    teacher = models.ForeignKey('core.Teacher', on_delete=models.CASCADE, related_name='assignments')
    class_obj = models.ForeignKey('core.Class', on_delete=models.CASCADE, related_name='teacher_assignments')
    section = models.ForeignKey('core.Section', on_delete=models.CASCADE, related_name='teacher_assignments')
    subject = models.ForeignKey('core.Subject', on_delete=models.CASCADE, related_name='teacher_assignments')
    
    # Additional fields
    is_primary = models.BooleanField(default=False)  # Is this the primary assignment for the teacher
    hours_per_week = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Teacher Assignment"
        verbose_name_plural = "Teacher Assignments"
        # Ensure a teacher is only assigned once to a class-section-subject combination
        unique_together = ('teacher', 'class_obj', 'section', 'subject')
    
    def __str__(self):
        return f"{self.teacher.staff.first_name} - {self.class_obj.name} {self.section.name} - {self.subject.name}"