"""
This file contains dummy model definitions for models that are being removed.
These are used only for migration purposes and should not be imported elsewhere.
"""

from django.db import models
import uuid

class SchoolTiming(models.Model):
    class Meta:
        managed = False
        db_table = 'core_schooltiming'

class Break(models.Model):
    class Meta:
        managed = False
        db_table = 'core_break'

class ClassSchedule(models.Model):
    class Meta:
        managed = False
        db_table = 'core_classschedule'

class StaffDuty(models.Model):
    class Meta:
        managed = False
        db_table = 'core_staffduty'

class ExamSchedule(models.Model):
    class Meta:
        managed = False
        db_table = 'core_examschedule'