from datetime import date
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import uuid
import pytz
from django.core.validators import MinValueValidator, MaxValueValidator
import random
import string
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, email, name, role, school=None, password=None):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, role=role, school=school)
        user.set_password(password)
        if password:  # Store plaintext password if provided
            user.plaintext_password = password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, role='admin', school=None, password=None):
        user = self.create_user(email, name, role, school, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('parent', 'Parent'),
        ('student', 'Student'),
        ('accountant', 'Accountant'),
    )

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    avatar = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    school = models.ForeignKey(
        'School',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        to_field='school_id'  # Reference School.school_id (UUID)
    )
    is_staff = models.BooleanField(default=False)
    plaintext_password = models.CharField(max_length=255, null=True, blank=True)  # New field for plaintext password

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'role']

    def __str__(self):
        return self.email

class School(models.Model):
    SUBSCRIPTION_STATUS_CHOICES = (
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('inactive', 'Inactive'),
    )

    school_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    website = models.URLField(blank=True, null=True)
    academic_year = models.CharField(max_length=20)  # Represents session
    logo = models.ImageField(upload_to='school_logos/', blank=True, null=True)
    founded_date = models.DateField(blank=True, null=True)
    affiliation = models.CharField(max_length=100, blank=True, null=True)
    motto = models.CharField(max_length=255, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    subscription_status = models.CharField(
        max_length=20,
        choices=SUBSCRIPTION_STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "School"
        verbose_name_plural = "Schools"

    def __str__(self):
        return self.name

# core/models.py
class Subscription(models.Model):
    FULFILLMENT_STATUS_CHOICES = (
        ('fulfilled', 'Fulfilled'),
        ('pending', 'Pending'),
        ('expired', 'Expired'),
    )

    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)  # Fixed: Added primary_key=True
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name='subscriptions',
        to_field='school_id'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=School.SUBSCRIPTION_STATUS_CHOICES,
        default='pending'
    )
    fulfillment_status = models.CharField(
        max_length=20,
        choices=FULFILLMENT_STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Subscription"
        verbose_name_plural = "Subscriptions"

    def __str__(self):
        return f"{self.school.name} - {self.status}"
        
class LocaleSettings(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='localesettingss', to_field='school_id', null=True)
    timezone = models.CharField(max_length=100, choices=[(tz, tz) for tz in pytz.all_timezones])
    language = models.CharField(max_length=10, default='en')  # e.g., 'en', 'ne'
    date_format = models.CharField(max_length=20, default='YYYY-MM-DD')
    time_format = models.CharField(max_length=10, choices=[('12h', '12-hour'), ('24h', '24-hour')], default='12h')
    currency_code = models.CharField(max_length=3, default='NPR')  # e.g., USD, NPR
    currency_symbol = models.CharField(max_length=10, default='$')
    first_day_of_week = models.CharField(max_length=10, default='Sunday')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Locale Settings"
        verbose_name_plural = "Locale Settings"

    def __str__(self):
        return f"Locale Settings (Timezone: {self.timezone})"


class AcademicSession(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='academicsessions', to_field='school_id', null=True)
    name = models.CharField(max_length=20)  # e.g., "2024-2025"
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('upcoming', 'Upcoming'), ('completed', 'Completed')])
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Academic Session"
        verbose_name_plural = "Academic Sessions"

    def __str__(self):
        return self.name

class Term(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='terms', to_field='school_id', null=True)
    session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=100)  # e.g., "First Term"
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Term"
        verbose_name_plural = "Terms"
        ordering = ['start_date']

    def __str__(self):
        return f"{self.name} ({self.session.name})"

class Holiday(models.Model):
    HOLIDAY_TYPE_CHOICES = [
        ('school_holiday', 'School Holiday'),
        ('maternal_leave', 'Maternal Leave'),
        ('paternal_leave', 'Paternal Leave'),
        ('paid_leave', 'Paid Leave'),
        ('unpaid_leave', 'Unpaid Leave'),
        ('other', 'Other'),
    ]
    HOLIDAY_CATEGORY_CHOICES = [
        ('all', 'All'),
        ('women_only', 'Women Only'),
        ('men_only', 'Men Only'),
        ('staff_only', 'Staff Only'),
        ('students_only', 'Students Only'),
    ]
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='holidays', to_field='school_id', null=True)
    session = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name='holidays')
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    holiday_type = models.CharField(max_length=50, choices=HOLIDAY_TYPE_CHOICES, default='school_holiday')
    holiday_category = models.CharField(max_length=50, choices=HOLIDAY_CATEGORY_CHOICES, default='all')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_date']

    def __str__(self):
        return self.name


class GradingSettings(models.Model):
    GRADING_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('gpa', 'GPA'),
        ('letter', 'Letter Grades'),
    ]
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='grading_settings', null=True)
    grading_type = models.CharField(max_length=20, choices=GRADING_TYPE_CHOICES, default='percentage')
    default_passing_grade = models.CharField(max_length=10, default='40')  # e.g., "40", "C", "2.0"
    grade_ranges = models.JSONField(null=True, blank=True)  # e.g., {"A": [90, 100], "B": [80, 89]}
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Grading Settings"
        verbose_name_plural = "Grading Settings"

    def __str__(self):
        return f"{self.grading_type} Settings for {self.school}"

class AttendanceSettings(models.Model):
    MARKING_SCHEME_CHOICES = [
        ('basic', 'Present/Absent'),
        ('detailed', 'Present/Absent/Late/Excused'),
        ('custom', 'Custom Statuses'),
    ]
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='attendance_settings', null=True)
    marking_scheme = models.CharField(max_length=20, choices=MARKING_SCHEME_CHOICES, default='basic')
    default_marking = models.CharField(max_length=10, default='P')  # e.g., 'P' for Present
    custom_statuses = models.JSONField(null=True, blank=True)  # e.g., ["Present", "Absent", "Tardy"]
    min_attendance_percentage = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)], null=True, blank=True
    )
    auto_notification = models.CharField(
        max_length=20,
        choices=[('none', 'None'), ('daily_absent', 'Daily (Absent)'), ('weekly_summary', 'Weekly Summary')],
        default='none'
    )
    notification_threshold = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)], default=75, help_text="Notify if attendance falls below this %"
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Attendance Settings"
        verbose_name_plural = "Attendance Settings"

    def __str__(self):
        return f"Attendance Settings for {self.school}"
    
class FeeType(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='fee_types',null=True)
    name = models.CharField(max_length=50)  # e.g., "Tuition", "Library"
    default_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_mandatory = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Fee Type"
        verbose_name_plural = "Fee Types"

    def __str__(self):
        return f"{self.name} ({self.school})"

class FeeSettings(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='fee_settings', null=True)
    due_date = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(31)], default=10)
    late_fee_type = models.CharField(
        max_length=20,
        choices=[('fixed', 'Fixed Amount'), ('percentage', 'Percentage'), ('daily', 'Daily Fine')],
        default='fixed'
    )
    late_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    reminder_days = models.IntegerField(validators=[MinValueValidator(0)], default=5)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Fee Settings"
        verbose_name_plural = "Fee Settings"

    def __str__(self):
        return f"Fee Settings for {self.school}"

class NotificationSettings(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='notificationsettingss', to_field='school_id', null=True)
    smtp_host = models.CharField(max_length=255, blank=True, null=True)
    smtp_port = models.IntegerField(blank=True, null=True)
    smtp_username = models.CharField(max_length=255, blank=True, null=True)
    smtp_password = models.CharField(max_length=255, blank=True, null=True)
    smtp_encryption = models.CharField(max_length=10, choices=[('none', 'None'), ('ssl', 'SSL'), ('tls', 'TLS')], default='none')
    from_email = models.EmailField(blank=True, null=True)
    from_name = models.CharField(max_length=255, blank=True, null=True)
    sms_provider = models.CharField(max_length=100, blank=True, null=True)
    sms_api_key = models.CharField(max_length=255, blank=True, null=True)
    sms_sender_id = models.CharField(max_length=50, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Notification Settings"
        verbose_name_plural = "Notification Settings"

class NotificationTemplate(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='notificationtemplates', to_field='school_id', null=True)
    template_id = models.CharField(max_length=50, unique=True)  # e.g., 'admission_confirm'
    name = models.CharField(max_length=100)
    content = models.TextField()  # e.g., "Dear {parent_name}, your child {student_name}..."
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Notification Template"
        verbose_name_plural = "Notification Templates"

    def __str__(self):
        return self.name


class StaffRole(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='staffroles', to_field='school_id', null=True)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Staff Role"
        verbose_name_plural = "Staff Roles"

    def __str__(self):
        return self.name

class LeaveType(models.Model):
    UNIT_CHOICES = [
        ('days/year', 'Days/Year'),
        ('days/occurrence', 'Days/Occurrence'),
        ('as_needed', 'As Needed'),
    ]
    PAID_STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('unpaid', 'Unpaid'),
        ('varies', 'Varies'),
    ]
    GENDER_CHOICES = [
        ('any', 'Any'),
        ('female', 'Female'),
        ('male', 'Male'),
    ]
    LEAVE_FOR_CHOICES = [
        ('staff', 'Staff'),
        ('students', 'Students'),
    ]

    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='leavetypes', to_field='school_id', null=True)
    name = models.CharField(max_length=100)  # Enforce unique names
    default_days = models.IntegerField()
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES)
    allow_carry_over = models.BooleanField(default=False)
    max_carry_over_days = models.IntegerField(null=True, blank=True)
    paid_status = models.CharField(max_length=20, choices=PAID_STATUS_CHOICES, null=True, blank=True)
    applicable_gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='any')
    leave_for = models.CharField(max_length=10, choices=LEAVE_FOR_CHOICES, default='staff')
    is_system_leave = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Leave Type"
        verbose_name_plural = "Leave Types"

    def __str__(self):
        return f"{self.name} ({self.leave_for})"
    

class Department(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='departments', to_field='school_id', null=True)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Department"
        verbose_name_plural = "Departments"

    def __str__(self):
        return self.name

class BulkLeaveAssignment(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='bulkleaveassignments', to_field='school_id', null=True)
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE)
    target_group = models.CharField(max_length=50)  # e.g., "all_staff", "all_female_staff"
    days = models.FloatField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    reason = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Bulk Leave Assignment"
        verbose_name_plural = "Bulk Leave Assignments"

    def __str__(self):
        return f"{self.leave_type.name} - {self.reason}"

class Class(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='classes', to_field='school_id', null=True)
    name = models.CharField(max_length=100)
    max_capacity = models.IntegerField()  # Maximum number of students
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Class"
        verbose_name_plural = "Classes"

    def __str__(self):
        return self.name

class Section(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='sections', to_field='school_id', null=True)
    name = models.CharField(max_length=100)
    class_id = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='sections')
    max_capacity = models.IntegerField(null=True, blank=True)  # Optional, defaults to class's max_capacity
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Section"
        verbose_name_plural = "Sections"
        unique_together = ('name', 'class_id')  # Ensure unique section names per class

    def __str__(self):
        return f"{self.class_id.name} - {self.name}"
    

class Subject(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='subjects', to_field='school_id',null=True)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    subject_type = models.CharField(max_length=20, choices=[('core', 'Core'), ('elective', 'Elective')])
    classes = models.ManyToManyField(Class, related_name='subjects', blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Subject"
        verbose_name_plural = "Subjects"

    def __str__(self):
        return self.name

class GradingScale(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='gradingscales', to_field='school_id', null=True)
    grade = models.CharField(max_length=10)
    percentage_range = models.CharField(max_length=20)
    gpa = models.CharField(max_length=10)
    description = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Grading Scale"
        verbose_name_plural = "Grading Scales"

    def __str__(self):
        return self.grade

class PromotionRules(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='promotionrules', to_field='school_id', null=True)
    min_overall_percentage = models.IntegerField()
    max_failed_subjects = models.IntegerField()
    consider_attendance = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Promotion Rules"
        verbose_name_plural = "Promotion Rules"

class ClassCapacity(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='classcapacities', to_field='school_id', null=True)
    default_capacity = models.IntegerField()
    max_capacity = models.IntegerField()
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Class Capacity"
        verbose_name_plural = "Class Capacities"

class Campus(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='campuses', to_field='school_id', null=True)
    name = models.CharField(max_length=100)
    address = models.TextField()
    contact_person = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Campus"
        verbose_name_plural = "Campuses"

    def __str__(self):
        return self.name

class Building(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='buildings', to_field='school_id', null=True)
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, related_name='buildings')
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Building"
        verbose_name_plural = "Buildings"

    def __str__(self):
        return f"{self.name} ({self.campus.name})"

class Room(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='rooms', to_field='school_id', null=True)
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='rooms')
    name = models.CharField(max_length=100)
    capacity = models.IntegerField()
    room_type = models.CharField(max_length=50, default='Classroom')  # e.g., Classroom, Lab
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Room"
        verbose_name_plural = "Rooms"

    def __str__(self):
        return f"{self.name} ({self.building.name})"

class Resource(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='resources', to_field='school_id', null=True)
    name = models.CharField(max_length=100)
    total_count = models.IntegerField()
    available_count = models.IntegerField()
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Resource"
        verbose_name_plural = "Resources"

    def __str__(self):
        return self.name


class Parent(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    school = models.ForeignKey(
        'School',
        on_delete=models.CASCADE,
        to_field='id',  # Reference School.id
        db_column='school_id'
    )
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Parent"
        verbose_name_plural = "Parents"

    def __str__(self):
        return f"{self.user.name} ({self.user.email})"

    @staticmethod
    def generate_credentials():
        """Generate random 6-character username and password."""
        chars = string.ascii_letters + string.digits
        username = ''.join(random.choice(chars) for _ in range(6))
        password = ''.join(random.choice(chars) for _ in range(6))
        return username, password

class Student(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('on_leave', 'On Leave'),
        ('alumni', 'Alumni'),
    ]
    ALUMNI_TYPE_CHOICES = [
        ('graduated', 'Graduated'),
        ('transferred', 'Transferred'),
    ]
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    academic_session = models.ForeignKey(AcademicSession, on_delete=models.SET_NULL, null=True, related_name='students')
    school = models.ForeignKey(
        'School',
        on_delete=models.CASCADE,
        to_field='id',  # Reference School.id (integer)
        db_column='school_id'  # Match the core_student.school_id column
    )
    class_id = models.ForeignKey(Class, on_delete=models.SET_NULL, null=True, related_name='students')
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, related_name='students')
    admission_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
  # Auto-generated admission number
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    admission_date = models.DateField()
    dob = models.DateField(null=True, blank=True)  # Date of birth
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    previous_school = models.CharField(max_length=255, blank=True, null=True)
    profile_image = models.ImageField(upload_to='student_profiles/', blank=True, null=True)
    alumni_type = models.CharField(max_length=20, choices=ALUMNI_TYPE_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Student"
        verbose_name_plural = "Students"

    def __str__(self):
        return f"{self.user.name} ({self.user.email})"

    def save(self, *args, **kwargs):
        if not self.admission_number:
            # Generate admission number (e.g., YYYYMMDD-XXX)
            today = date.today()  # Corrected: Call the method with ()
            prefix = today.strftime('%Y%m%d')
            last_student = Student.objects.filter(admission_number__startswith=prefix).order_by('-admission_number').first()
            if last_student:
                last_num = int(last_student.admission_number.split('-')[-1])
                new_num = f"{prefix}-{last_num + 1:03d}"
            else:
                new_num = f"{prefix}-001"
            self.admission_number = new_num
        super().save(*args, **kwargs)

    @staticmethod
    def generate_credentials():
        chars = string.ascii_letters + string.digits
        username = ''.join(random.choice(chars) for _ in range(6))
        password = ''.join(random.choice(chars) for _ in range(6))
        return username, password

class StudentParent(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='student_parents')
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='student_parents')
    relationship = models.CharField(max_length=50, default='Parent')  # e.g., Mother, Father, Guardian
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Student-Parent Relationship"
        verbose_name_plural = "Student-Parent Relationships"
        unique_together = ('student', 'parent')

    def __str__(self):
        return f"{self.parent.user.name} - {self.student.user.name} ({self.relationship})"

class AdmissionFee(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='admission_fees', null=True)
    class_id = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='admission_fees')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='admission_fees', null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Admission Fee"
        verbose_name_plural = "Admission Fees"
        unique_together = ('school', 'class_id', 'section')

    def __str__(self):
        section_name = self.section.name if self.section else 'All Sections'
        return f"{self.class_id.name} - {section_name} ({self.amount})"

class StudentFee(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='student_fees',null=True)
    admission_fee = models.ForeignKey(AdmissionFee, on_delete=models.SET_NULL, null=True, related_name='student_fees')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('paid', 'Paid'), ('waived', 'Waived')], default='pending')
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Student Fee"
        verbose_name_plural = "Student Fees"

    def __str__(self):
        return f"{self.student.user.name} - {self.amount} ({self.status})"


class StudentDocumentType(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='studentdocumenttypes', to_field='school_id', null=True)
    name = models.CharField(max_length=100, unique=True)  # e.g., "Marksheet", "Transfer Certificate", "ID Card"
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class StudentDocument(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='studentdocuments', to_field='school_id', null=True)
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='documents')
    document_type = models.ForeignKey('StudentDocumentType', on_delete=models.SET_NULL, null=True, related_name='documents')
    session = models.ForeignKey('AcademicSession', on_delete=models.SET_NULL, null=True, blank=True, related_name='student_documents')
    file = models.FileField(upload_to='student_documents/%Y/%m/%d/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    description = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"{self.student.user.name} - {self.document_type.name if self.document_type else 'Document'}"
    
class StaffDocument(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='staffdocuments', to_field='school_id', null=True)
    staff = models.ForeignKey('Staff', on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, default='Other')
    description = models.CharField(max_length=255, blank=True, null=True)
    file = models.FileField(upload_to='staff_documents/%Y/%m/%d/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.staff.first_name} {self.staff.last_name} - {self.document_type}"
    
class Certificate(models.Model):
    school = models.ForeignKey('School', on_delete=models.CASCADE, related_name='certificates', to_field='school_id', null=True)
    student_id = models.ForeignKey(Student, on_delete=models.CASCADE)
    certificate_type = models.CharField(max_length=20, choices=[('graduation', 'Graduation'), ('leave', 'Leave')])
    issue_date = models.DateField()
    class_id = models.ForeignKey(Class, on_delete=models.CASCADE)
    section_id = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True)
    academic_session_id = models.ForeignKey(AcademicSession, on_delete=models.CASCADE)
    completion_date = models.DateField(null=True, blank=True)
    reason = models.TextField(null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'certificates'

    def __str__(self):
        return f"{self.certificate_type.title()} Certificate for {self.student.user_name}"


class Staff(models.Model):
    EMPLOYMENT_TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('contract', 'Contract'),
        ('temporary', 'Temporary'),
    ]
    
    PAY_FREQUENCY_CHOICES = [
        ('monthly', 'Monthly'),
        ('bi_weekly', 'Bi-Weekly'),
        ('weekly', 'Weekly'),
    ]
    
    TAX_STATUS_CHOICES = [
        ('exempt', 'Tax Exempt'),
        ('non_exempt', 'Tax Non-Exempt'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    school = models.ForeignKey(
        'School',
        on_delete=models.CASCADE,
        related_name='staff',
        to_field='school_id',
        null=True  # Reference School.school_id (UUID)
    )
    staff_role = models.ForeignKey(StaffRole, on_delete=models.SET_NULL, null=True, related_name='staff')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='staff')
    
    # Personal Information
    employee_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_image = models.ImageField(upload_to='staff_profiles/%Y/%m/%d/', blank=True, null=True)
    gender = models.CharField(max_length=10, choices=[
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ], null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Employment Details
    hire_date = models.DateField()
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_TYPE_CHOICES, default='full_time')
    contract_end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('on_leave', 'On Leave'),
        ('terminated', 'Terminated'),
    ], default='active')
    
    # Role-Specific Fields (for teachers)
    classes = models.ManyToManyField(Class, related_name='teachers', blank=True)
    subjects = models.ManyToManyField(Subject, related_name='teachers', blank=True)
    
    # Payroll Information
    base_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    pay_frequency = models.CharField(max_length=20, choices=PAY_FREQUENCY_CHOICES, default='monthly')
    tax_status = models.CharField(max_length=20, choices=TAX_STATUS_CHOICES, default='non_exempt')
    allowances = models.JSONField(default=dict, blank=True)  # e.g., {"housing": 500, "transport": 200}
    deductions = models.JSONField(default=dict, blank=True)  # e.g., {"tax": 100, "insurance": 50}
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    bank_branch = models.CharField(max_length=100, blank=True, null=True)
    
    # Benefits
    health_insurance_number = models.CharField(max_length=50, blank=True, null=True)
    pension_plan_number = models.CharField(max_length=50, blank=True, null=True)
    provident_fund_number = models.CharField(max_length=50, blank=True, null=True)
    
    # Credentials
    generated_password = models.CharField(max_length=100, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Staff"
        verbose_name_plural = "Staff"

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.user.email})"

    def save(self, *args, **kwargs):
        if not self.employee_id:
            today = date.today()
            prefix = today.strftime('%Y%m%d')
            last_staff = Staff.objects.filter(employee_id__startswith=prefix).order_by('-employee_id').first()
            if last_staff:
                last_num = int(last_staff.employee_id.split('-')[-1])
                new_num = f"{prefix}-{last_num + 1:03d}"
            else:
                new_num = f"{prefix}-001"
            self.employee_id = new_num
            
        if not self.generated_password:
            self.generated_password = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(8))
            self.user.set_password(self.generated_password)
            self.user.save()
            
        super().save(*args, **kwargs)

    @staticmethod
    def generate_credentials():
        chars = string.ascii_letters + string.digits
        password = ''.join(random.choice(chars) for _ in range(8))
        return password

class StaffLeave(models.Model):
    staff = models.ForeignKey('Staff', on_delete=models.CASCADE, related_name='leaves')
    leave_type = models.ForeignKey('LeaveType', on_delete=models.CASCADE, related_name='staff_leaves')
    academic_session = models.ForeignKey('AcademicSession', on_delete=models.CASCADE, related_name='staff_leaves')
    school = models.ForeignKey(
        'School',
        on_delete=models.CASCADE,
        related_name='staff_leaves',
        to_field='school_id',
        null=True  # Reference School.school_id (UUID
    )
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    days = models.FloatField()
    reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Staff Leave"
        verbose_name_plural = "Staff Leaves"

    def __str__(self):
        return f"{self.staff} - {self.leave_type.name} ({self.start_date})"