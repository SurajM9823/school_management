from rest_framework import serializers
from core.models import Staff, Subject
from core.domain.teacher import Teacher
from core.serial.staff_serializers import StaffSerializer
import logging

logger = logging.getLogger(__name__)

class TeacherSerializer(serializers.ModelSerializer):
    # Staff fields
    user_email = serializers.EmailField(write_only=True)
    user_role = serializers.CharField(write_only=True)
    user_name = serializers.CharField(write_only=True)
    staff_role_id = serializers.IntegerField(write_only=True)
    department_id = serializers.IntegerField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True, allow_blank=True)
    date_of_birth = serializers.DateField(write_only=True, allow_null=True)
    gender = serializers.CharField(write_only=True, allow_blank=True)
    address = serializers.CharField(write_only=True, allow_blank=True)
    phone = serializers.CharField(write_only=True, allow_blank=True)
    emergency_contact_name = serializers.CharField(write_only=True, allow_blank=True)
    emergency_contact_phone = serializers.CharField(write_only=True, allow_blank=True)
    hire_date = serializers.DateField(write_only=True)
    employment_type = serializers.CharField(write_only=True)
    contract_end_date = serializers.DateField(write_only=True, allow_null=True)
    classes_ids = serializers.ListField(write_only=True, child=serializers.IntegerField(), required=False)
    subjects_ids = serializers.ListField(write_only=True, child=serializers.IntegerField(), required=False)
    base_salary = serializers.DecimalField(write_only=True, max_digits=12, decimal_places=2)
    pay_frequency = serializers.CharField(write_only=True)
    tax_status = serializers.CharField(write_only=True)
    bank_account_number = serializers.CharField(write_only=True, allow_blank=True)
    bank_name = serializers.CharField(write_only=True, allow_blank=True)
    bank_branch = serializers.CharField(write_only=True, allow_blank=True)
    health_insurance_number = serializers.CharField(write_only=True, allow_blank=True)
    pension_plan_number = serializers.CharField(write_only=True, allow_blank=True)
    provident_fund_number = serializers.CharField(write_only=True, allow_blank=True)
    status = serializers.CharField(write_only=True)
    
    # Teacher-specific fields
    qualification = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    experience = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    primary_subject_id = serializers.IntegerField(required=False, allow_null=True)
    pan_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ifsc_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    sick_leave_balance = serializers.IntegerField(required=False, default=12)
    casual_leave_balance = serializers.IntegerField(required=False, default=0)
    tax_deduction_percentage = serializers.DecimalField(required=False, max_digits=5, decimal_places=2, default=0)
    pf_employee_contribution = serializers.DecimalField(required=False, max_digits=5, decimal_places=2, default=0)
    pf_employer_contribution = serializers.DecimalField(required=False, max_digits=5, decimal_places=2, default=0)
    other_deductions = serializers.JSONField(required=False, default=dict)
    
    # Read-only fields for displaying staff and teacher data
    staff = StaffSerializer(read_only=True)
    
    class Meta:
        model = Teacher
        fields = [
            # Staff fields (write-only)
            'user_email', 'user_role', 'user_name', 'staff_role_id', 'department_id',
            'first_name', 'last_name', 'date_of_birth', 'gender', 'address', 'phone',
            'emergency_contact_name', 'emergency_contact_phone', 'hire_date',
            'employment_type', 'contract_end_date', 'classes_ids', 'subjects_ids',
            'base_salary', 'pay_frequency', 'tax_status', 'bank_account_number',
            'bank_name', 'bank_branch', 'health_insurance_number',
            'pension_plan_number', 'provident_fund_number', 'status',
            
            # Teacher fields
            'id', 'qualification', 'experience', 'primary_subject_id',
            'pan_number', 'ifsc_code', 'sick_leave_balance', 'casual_leave_balance',
            'tax_deduction_percentage', 'pf_employee_contribution',
            'pf_employer_contribution', 'other_deductions',
            
            # Read-only fields
            'staff', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        logger.info(f"Creating teacher with data: {validated_data}")
        
        # Extract staff data
        staff_data = {
            'user_email': validated_data.pop('user_email'),
            'user_role': validated_data.pop('user_role'),
            'user_name': validated_data.pop('user_name'),
            'staff_role_id': validated_data.pop('staff_role_id'),
            'department_id': validated_data.pop('department_id'),
            'first_name': validated_data.pop('first_name'),
            'last_name': validated_data.pop('last_name'),
            'date_of_birth': validated_data.pop('date_of_birth', None),
            'gender': validated_data.pop('gender', ''),
            'address': validated_data.pop('address', ''),
            'phone': validated_data.pop('phone', ''),
            'emergency_contact_name': validated_data.pop('emergency_contact_name', ''),
            'emergency_contact_phone': validated_data.pop('emergency_contact_phone', ''),
            'hire_date': validated_data.pop('hire_date'),
            'employment_type': validated_data.pop('employment_type'),
            'contract_end_date': validated_data.pop('contract_end_date', None),
            'classes_ids': validated_data.pop('classes_ids', []),
            'subjects_ids': validated_data.pop('subjects_ids', []),
            'base_salary': validated_data.pop('base_salary'),
            'pay_frequency': validated_data.pop('pay_frequency'),
            'tax_status': validated_data.pop('tax_status'),
            'bank_account_number': validated_data.pop('bank_account_number', ''),
            'bank_name': validated_data.pop('bank_name', ''),
            'bank_branch': validated_data.pop('bank_branch', ''),
            'health_insurance_number': validated_data.pop('health_insurance_number', ''),
            'pension_plan_number': validated_data.pop('pension_plan_number', ''),
            'provident_fund_number': validated_data.pop('provident_fund_number', ''),
            'status': validated_data.pop('status', 'active'),
            'school': self.context['request'].user.school,
            'school_id': str(self.context['request'].user.school.school_id),
        }
        
        # Create staff using StaffSerializer
        staff_serializer = StaffSerializer(data=staff_data, context=self.context)
        if staff_serializer.is_valid():
            staff = staff_serializer.save()
            logger.info(f"Created staff: {staff}")
        else:
            logger.error(f"Staff validation errors: {staff_serializer.errors}")
            raise serializers.ValidationError(staff_serializer.errors)
        
        # Handle primary_subject_id
        primary_subject_id = validated_data.pop('primary_subject_id', None)
        primary_subject = None
        if primary_subject_id:
            try:
                primary_subject = Subject.objects.get(id=primary_subject_id)
            except Subject.DoesNotExist:
                logger.warning(f"Subject with ID {primary_subject_id} not found")
        
        # Create teacher
        teacher = Teacher.objects.create(
            staff=staff,
            primary_subject=primary_subject,
            **validated_data
        )
        logger.info(f"Created teacher: {teacher}")
        
        return teacher
    
    def update(self, instance, validated_data):
        logger.info(f"Updating teacher with data: {validated_data}")
        
        # Extract staff data
        staff_data = {}
        staff_fields = [
            'user_email', 'user_role', 'user_name', 'staff_role_id', 'department_id',
            'first_name', 'last_name', 'date_of_birth', 'gender', 'address', 'phone',
            'emergency_contact_name', 'emergency_contact_phone', 'hire_date',
            'employment_type', 'contract_end_date', 'classes_ids', 'subjects_ids',
            'base_salary', 'pay_frequency', 'tax_status', 'bank_account_number',
            'bank_name', 'bank_branch', 'health_insurance_number',
            'pension_plan_number', 'provident_fund_number', 'status'
        ]
        
        for field in staff_fields:
            if field in validated_data:
                staff_data[field] = validated_data.pop(field)
        
        # Update staff if staff_data is not empty
        if staff_data:
            staff_serializer = StaffSerializer(instance.staff, data=staff_data, partial=True, context=self.context)
            if staff_serializer.is_valid():
                staff_serializer.save()
                logger.info(f"Updated staff: {instance.staff}")
            else:
                logger.error(f"Staff validation errors: {staff_serializer.errors}")
                raise serializers.ValidationError(staff_serializer.errors)
        
        # Handle primary_subject_id
        primary_subject_id = validated_data.pop('primary_subject_id', None)
        if primary_subject_id is not None:
            try:
                instance.primary_subject = Subject.objects.get(id=primary_subject_id)
            except Subject.DoesNotExist:
                logger.warning(f"Subject with ID {primary_subject_id} not found")
                instance.primary_subject = None
        
        # Update teacher fields
        for field, value in validated_data.items():
            setattr(instance, field, value)
        
        instance.save()
        logger.info(f"Updated teacher: {instance}")
        
        return instance