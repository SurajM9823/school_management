from django.db import models

class Teacher(models.Model):
    """
    Teacher model that extends the Staff model with teacher-specific fields.
    This is a one-to-one relationship with Staff.
    """
    staff = models.OneToOneField('core.Staff', on_delete=models.CASCADE, related_name='teacher_profile')
    
    # Academic Information
    qualification = models.CharField(max_length=255, blank=True, null=True)
    experience = models.CharField(max_length=50, blank=True, null=True)  # e.g., "5 years"
    primary_subject = models.ForeignKey('core.Subject', on_delete=models.SET_NULL, null=True, blank=True, related_name='primary_teachers')
    
    # Financial Details
    pan_number = models.CharField(max_length=50, blank=True, null=True)  # Tax ID
    ifsc_code = models.CharField(max_length=50, blank=True, null=True)  # Bank routing code
    
    # Leave Balances
    sick_leave_balance = models.IntegerField(default=12)
    casual_leave_balance = models.IntegerField(default=0)
    
    # Tax & Deductions
    tax_deduction_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    pf_employee_contribution = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Percentage
    pf_employer_contribution = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # Percentage
    other_deductions = models.JSONField(default=dict, blank=True)  # e.g., [{"name": "Insurance", "amount": 500}]
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Teacher"
        verbose_name_plural = "Teachers"
    
    def __str__(self):
        return f"{self.staff.first_name} {self.staff.last_name} - Teacher"