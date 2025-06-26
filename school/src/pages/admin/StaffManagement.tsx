import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Briefcase, UserPlus, Search, Filter, Edit, Trash2, Mail, Phone, Settings, Key } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../../api';
import axios from 'axios';

interface StaffMember {
  id: string;
  user_name: string;
  user_email: string;
  phone?: string;
  user_role: string;
  department_name?: string;
  subjects_names?: string[];
  hire_date: string;
  status: 'active' | 'on_leave' | 'terminated';
  first_name: string;
  last_name: string;
  staff_role_id: number;
  department_id: number;
  date_of_birth?: string | null;
  gender?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'temporary';
  contract_end_date?: string | null;
  classes_ids: number[];
  subjects_ids: number[];
  base_salary: number;
  pay_frequency: 'weekly' | 'bi_weekly' | 'monthly';
  tax_status: 'exempt' | 'non_exempt';
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  bank_account_number?: string;
  bank_name?: string;
  bank_branch?: string;
  health_insurance_number?: string;
  pension_plan_number?: string;
  provident_fund_number?: string;
  generated_password?: string;
  profile_image?: string | null;
}

interface School {
  id: number;
  name: string;
}

interface StaffRole {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
}

interface LeaveType {
  id: number;
  name: string;
  default_days: number;
  unit: 'days/year' | 'days/occurrence' | 'as needed';
  paid_status: 'paid' | 'unpaid' | 'varies' | null;
  applicable_gender: 'any' | 'female' | 'male';
}

interface AcademicSession {
  id: number;
  name: string;
}

interface StaffFormData {
  name: string;
  email: string;
  role: string;
  staff_role_id: number;
  department_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string;
  address: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  hire_date: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'temporary';
  contract_end_date: string | null;
  classes: number[];
  subjects: number[];
  base_salary: number;
  pay_frequency: 'weekly' | 'bi_weekly' | 'monthly';
  tax_status: 'exempt' | 'non_exempt';
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  bank_account: string;
  bank_name: string;
  bank_branch: string;
  health_insurance_number: string;
  pension_plan_number: string;
  provident_fund_number: string;
  status: 'active' | 'on_leave' | 'terminated';
}

interface LeaveFormData {
  leave_type_id: number;
  academic_session_id: number;
  start_date: string;
  end_date: string | null;
  days: number;
  reason: string;
}

const StaffManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<StaffFormData>({
    defaultValues: {
      name: '',
      email: '',
      role: '',
      staff_role_id: 0,
      department_id: 0,
      first_name: '',
      last_name: '',
      date_of_birth: null,
      gender: '',
      address: '',
      phone: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      hire_date: format(new Date(), 'yyyy-MM-dd'),
      employment_type: 'full_time',
      contract_end_date: null,
      classes: [],
      subjects: [],
      base_salary: 0,
      pay_frequency: 'monthly',
      tax_status: 'non_exempt',
      allowances: {},
      deductions: {},
      bank_account: '',
      bank_name: '',
      bank_branch: '',
      health_insurance_number: '',
      pension_plan_number: '',
      provident_fund_number: '',
      status: 'active',
    },
  });
  const leaveForm = useForm<LeaveFormData>({
    defaultValues: {
      leave_type_id: 0,
      academic_session_id: 0,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: null,
      days: 1,
      reason: '',
    },
  });
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [staffRoles, setStaffRoles] = useState<StaffRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StaffMember['status'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string; id?: string } | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState<StaffMember | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState<StaffMember | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  const selectedRole = watch('role');
  const employmentType = watch('employment_type');


  useEffect(() => {
  const source = axios.CancelToken.source();
  console.log('StaffManagement useEffect - user:', user);
  if (!user) {
    console.log('No user found, waiting for authentication');
    return;
  }
  if (user.role !== 'admin') {
    console.log('User is not admin, redirecting to login');
    navigate('/login');
    toast.error('Unauthorized access. Please log in as admin.');
    return;
  }
  if (!user.school_id) {
    console.log('User has no school_id:', user);
    toast.error('Your account is not associated with a school. Please contact support.');
    return;
  }
  console.log('Fetching staff data with school_id:', user.school_id);
  fetchData(source.token);
  return () => source.cancel('Request canceled due to component unmount');
}, [user, navigate]);

  useEffect(() => {
    console.log('Current staffRoles:', staffRoles);
    console.log('Current departments:', departments);
    if (showForm && !editingStaff && staffRoles.length > 0 && !watch('staff_role_id')) {
      setValue('staff_role_id', staffRoles[0].id);
    }
    if (showForm && !editingStaff && departments.length > 0 && !watch('department_id')) {
      setValue('department_id', departments[0].id);
    }
    if (leaveTypes.length > 0 && showLeaveModal) {
      leaveForm.setValue('leave_type_id', leaveTypes[0].id);
    }
    if (academicSessions.length > 0 && showLeaveModal) {
      const activeSession = academicSessions.find(s => s.name.includes('2024-2025')) || academicSessions[0];
      leaveForm.setValue('academic_session_id', activeSession.id);
    }
  }, [staffRoles, departments, leaveTypes, academicSessions, editingStaff, showForm, showLeaveModal, setValue, leaveForm, watch]);

  const fetchData = async (cancelToken?: any) => {
  setIsLoading(true);
  setError(null);
  try {
    if (!user?.school_id) {
      throw new Error('User school ID not found');
    }
    const [
      staffResponse,
      schoolResponse,
      roleResponse,
      deptResponse,
      classResponse,
      subjectResponse,
      leaveTypeResponse,
      sessionResponse,
    ] = await Promise.all([
      api.get('/school/settings/staff/', { cancelToken }), // Remove schoolId
      api.get('/school/settings/', { cancelToken }), // Remove schoolId
      api.get('/school/settings/staff-roles/', { cancelToken }), // Remove schoolId
      api.get('/school/settings/departments/', { cancelToken }), // Remove schoolId
      api.get('/school/settings/classes/', { cancelToken }), // Remove schoolId
      api.get('/school/settings/subjects/', { cancelToken }), // Remove schoolId
      api.get('/school/settings/leave-types/', { cancelToken, params: { leave_for: 'staff' } }), // Remove schoolId
      api.get('/school/settings/sessions/', { cancelToken }), // Remove schoolId
    ]);

    console.log('Staff Response:', staffResponse.data);
    console.log('School Response:', schoolResponse.data);
    console.log('Staff Roles Response:', roleResponse.data);
    console.log('Departments Response:', deptResponse.data);
    console.log('Classes Response:', classResponse.data);
    console.log('Subjects Response:', subjectResponse.data);
    console.log('Leave Types Response:', leaveTypeResponse.data);
    console.log('Sessions Response:', sessionResponse.data);

    console.log('Raw staff data:', staffResponse.data);
    const mappedStaff = staffResponse.data.map((staff: any) => {
      // Extract user data from nested user object
      const userData = staff.user || {};
      return {
        id: staff.id,
        user_name: userData.name || '',
        user_email: userData.email || '',
        phone: staff.phone || '',
        user_role: userData.role || '',
        department_name: staff.department?.name || '',
        subjects_names: staff.subjects?.map((s: any) => s.name) || [],
        hire_date: staff.hire_date || '',
        status: staff.status || 'active',
        first_name: staff.first_name || '',
        last_name: staff.last_name || '',
        staff_role_id: staff.staff_role?.id || 0,
        department_id: staff.department?.id || 0,
        date_of_birth: staff.date_of_birth || null,
        gender: staff.gender || '',
        address: staff.address || '',
        emergency_contact_name: staff.emergency_contact_name || '',
        emergency_contact_phone: staff.emergency_contact_phone || '',
        employment_type: staff.employment_type || 'full_time',
        contract_end_date: staff.contract_end_date || null,
        classes_ids: staff.classes?.map((c: any) => c.id) || [],
        subjects_ids: staff.subjects?.map((s: any) => s.id) || [],
        base_salary: staff.base_salary || 0,
        pay_frequency: staff.pay_frequency || 'monthly',
        tax_status: staff.tax_status || 'non_exempt',
        allowances: staff.allowances || {},
        deductions: staff.deductions || {},
        bank_account_number: staff.bank_account_number || '',
        bank_name: staff.bank_name || '',
        bank_branch: staff.bank_branch || '',
        health_insurance_number: staff.health_insurance_number || '',
        pension_plan_number: staff.pension_plan_number || '',
        provident_fund_number: staff.provident_fund_number || '',
        generated_password: staff.generated_password || '',
        profile_image: staff.profile_image || null,
      };
    });
    console.log('Mapped staff data:', mappedStaff);
    setStaffList(mappedStaff);
    setSchools(schoolResponse.data || []);
    setStaffRoles(roleResponse.data);
    setDepartments(deptResponse.data);
    setClasses(classResponse.data);
    setSubjects(subjectResponse.data);
    setLeaveTypes(leaveTypeResponse.data);
    setAcademicSessions(sessionResponse.data);
  } catch (err: any) {
    if (axios.isCancel(err)) {
      console.log('Request canceled:', err.message);
      return;
    }
    console.error('Fetch data error:', err.response?.data || err.message);
    const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to load data';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const filteredStaff = useMemo(() => {
    console.log('Filtering staff list:', staffList);
    return staffList
      .filter(staff => {
        // First check if staff has the required fields
        if (!staff || !staff.user_name || !staff.user_email) {
          console.log('Skipping staff with missing fields:', staff);
          return false;
        }
        
        // Search term filter (name OR email)
        const matchesSearch = searchTerm === '' || 
          staff.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          staff.user_email.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Role and status filters
        const matchesRole = roleFilter === 'all' || staff.user_role === roleFilter;
        const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;
        
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => (a.user_name || '').localeCompare(b.user_name || ''));
  }, [staffList, searchTerm, roleFilter, statusFilter]);

  const onSubmit = async (data: StaffFormData) => {
  setIsLoading(true);
  setError(null);
  try {
    if (!user?.school_id) {
      throw new Error('User school ID not found');
    }
    let response;
    const payload = {
      user_email: data.email,
      user_role: data.role,
      user_name: data.name,
      staff_role_id: data.staff_role_id,
      department_id: data.department_id,
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth || null,
      gender: data.gender || '',
      address: data.address || '',
      phone: data.phone || '',
      emergency_contact_name: data.emergency_contact_name || '',
      emergency_contact_phone: data.emergency_contact_phone || '',
      hire_date: data.hire_date,
      employment_type: data.employment_type,
      contract_end_date: data.contract_end_date || null,
      classes_ids: data.classes.filter(id => id) || [],
      subjects_ids: data.subjects.filter(id => id) || [],
      base_salary: data.base_salary,
      pay_frequency: data.pay_frequency,
      tax_status: data.tax_status,
      allowances: data.allowances || {},
      deductions: data.deductions || {},
      bank_account_number: data.bank_account || '',
      bank_name: data.bank_name || '',
      bank_branch: data.bank_branch || '',
      health_insurance_number: data.health_insurance_number || '',
      pension_plan_number: data.pension_plan_number || '',
      provident_fund_number: data.provident_fund_number || '',
      status: data.status || 'active',
    };
    if (editingStaff) {
      response = await api.put(`/school/settings/staff/${editingStaff.id}/`, payload);
      setStaffList(prev =>
        prev.map(s =>
          s.id === editingStaff.id
            ? {
                ...s,
                user_name: response.data.user.name, // Map user.name to user_name
                user_email: response.data.user.email, // Map user.email to user_email
                phone: response.data.phone,
                user_role: response.data.user.role, // Map user.role to user_role
                department_name: response.data.department.name,
                subjects_names: response.data.subjects.map((s: any) => s.name),
                hire_date: response.data.hire_date,
                status: response.data.status,
                first_name: response.data.first_name,
                last_name: response.data.last_name,
                staff_role_id: response.data.staff_role.id,
                department_id: response.data.department.id,
                date_of_birth: response.data.date_of_birth,
                gender: response.data.gender,
                address: response.data.address,
                emergency_contact_name: response.data.emergency_contact_name,
                emergency_contact_phone: response.data.emergency_contact_phone,
                employment_type: response.data.employment_type,
                contract_end_date: response.data.contract_end_date,
                classes_ids: response.data.classes.map((c: any) => c.id) || [],
                subjects_ids: response.data.subjects.map((s: any) => s.id) || [],
                base_salary: response.data.base_salary,
                pay_frequency: response.data.pay_frequency,
                tax_status: response.data.tax_status,
                allowances: response.data.allowances || {},
                deductions: response.data.deductions || {},
                bank_account_number: response.data.bank_account_number || '',
                bank_name: response.data.bank_name || '',
                bank_branch: response.data.bank_branch || '',
                health_insurance_number: response.data.health_insurance_number || '',
                pension_plan_number: response.data.pension_plan_number || '',
                provident_fund_number: response.data.provident_fund_number || '',
              }
            : s
        )
      );
      toast.success('Staff member updated successfully');
    } else {
      response = await api.post('/school/settings/staff/', payload);
      setStaffList(prev => [
        {
          id: response.data.id,
          user_name: response.data.user.name, // Map user.name to user_name
          user_email: response.data.user.email, // Map user.email to user_email
          phone: response.data.phone,
          user_role: response.data.user.role, // Map user.role to user_role
          department_name: response.data.department.name,
          subjects_names: response.data.subjects.map((s: any) => s.name),
          hire_date: response.data.hire_date,
          status: response.data.status,
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          staff_role_id: response.data.staff_role.id,
          department_id: response.data.department.id,
          date_of_birth: response.data.date_of_birth,
          gender: response.data.gender,
          address: response.data.address,
          emergency_contact_name: response.data.emergency_contact_name,
          emergency_contact_phone: response.data.emergency_contact_phone,
          employment_type: response.data.employment_type,
          contract_end_date: response.data.contract_end_date,
          classes_ids: response.data.classes.map((c: any) => c.id) || [],
          subjects_ids: response.data.subjects.map((s: any) => s.id) || [],
          base_salary: response.data.base_salary,
          pay_frequency: response.data.pay_frequency,
          tax_status: response.data.tax_status,
          allowances: response.data.allowances || {},
          deductions: response.data.deductions || {},
          bank_account_number: response.data.bank_account_number || '',
          bank_name: response.data.bank_name || '',
          bank_branch: response.data.bank_branch || '',
          health_insurance_number: response.data.health_insurance_number || '',
          pension_plan_number: response.data.pension_plan_number || '',
          provident_fund_number: response.data.provident_fund_number || '',
          generated_password: response.data.generated_password || '',
          profile_image: response.data.profile_image || null,
        },
        ...prev,
      ]);
      setCredentials({
        email: response.data.user.email, // Map user.email
        password: response.data.generated_password,
        id: response.data.id,
      });
      toast.success('Staff member added successfully');
    }
    setShowForm(false);
    setEditingStaff(null);
    reset();
  } catch (err: any) {
    console.error('Staff submission error:', err);
    const errorMessage =
      err.response?.data?.detail ||
      Object.entries(err.response?.data || {})
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('; ') ||
      `Failed to ${editingStaff ? 'update' : 'add'} staff`;
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setCredentials(null);
    setValue('name', staff.user_name);
    setValue('email', staff.user_email);
    setValue('role', staff.user_role);
    const selectedRole = staffRoles.find(role => role.id === Number(staff.staff_role_id));
    setValue('staff_role_id', selectedRole ? Number(staff.staff_role_id) : (staffRoles.length > 0 ? staffRoles[0].id : 0));
    const selectedDept = departments.find(dept => dept.id === Number(staff.department_id));
    setValue('department_id', selectedDept ? Number(staff.department_id) : (departments.length > 0 ? departments[0].id : 0));
    setValue('first_name', staff.first_name);
    setValue('last_name', staff.last_name);
    setValue('date_of_birth', staff.date_of_birth || null);
    setValue('gender', staff.gender || '');
    setValue('address', staff.address || '');
    setValue('phone', staff.phone || '');
    setValue('emergency_contact_name', staff.emergency_contact_name || '');
    setValue('emergency_contact_phone', staff.emergency_contact_phone || '');
    setValue('hire_date', staff.hire_date);
    setValue('employment_type', staff.employment_type);
    setValue('contract_end_date', staff.contract_end_date || null);
    setValue('classes', staff.classes_ids || []);
    setValue('subjects', staff.subjects_ids || []);
    setValue('base_salary', staff.base_salary);
    setValue('pay_frequency', staff.pay_frequency);
    setValue('tax_status', staff.tax_status);
    setValue('allowances', staff.allowances || {});
    setValue('deductions', staff.deductions || {});
    setValue('bank_account', staff.bank_account_number || '');
    setValue('bank_name', staff.bank_name || '');
    setValue('bank_branch', staff.bank_branch || '');
    setValue('health_insurance_number', staff.health_insurance_number || '');
    setValue('pension_plan_number', staff.pension_plan_number || '');
    setValue('provident_fund_number', staff.provident_fund_number || '');
    setValue('status', staff.status);
    console.log('Editing staff_role_id:', staff.staff_role_id, 'Selected:', watch('staff_role_id'));
    console.log('Editing department_id:', staff.department_id, 'Selected:', watch('department_id'));
    setShowForm(true);
  };

const handleDeleteStaff = async (staffId: string) => {
  if (!window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) return;
  setIsLoading(true);
  setError(null);
  try {
    if (!user?.school_id) {
      throw new Error('User school ID not found');
    }
    await api.delete(`/school/settings/staff/${staffId}/`);
    setStaffList(prev => prev.filter(s => s.id !== staffId));
    toast.success('Staff member deleted successfully');
  } catch (err: any) {
    console.error('Delete staff error:', err);
    const errorMessage = err.response?.data?.message || err.response?.data?.detail || 'Failed to delete staff member';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

const toggleStaffStatus = async (staffId: string, currentStatus: 'active' | 'on_leave' | 'terminated') => {
  const newStatus = currentStatus === 'active' ? 'on_leave' : currentStatus === 'on_leave' ? 'terminated' : 'active';
  if (newStatus === 'on_leave') {
    const staff = staffList.find(s => s.id === staffId);
    if (staff) {
      setShowLeaveModal(staff);
    }
    return;
  }
  setIsLoading(true);
  try {
    if (!user?.school_id) {
      throw new Error('User school ID not found');
    }
    const response = await api.put(`/school/settings/staff/${staffId}/`, { status: newStatus });
    setStaffList(prev =>
      prev.map(s =>
        s.id === staffId ? { ...s, status: response.data.status } : s
      )
    );
    toast.success('Staff status updated successfully');
  } catch (err: any) {
    console.error('Update staff status error:', err);
    const errorMessage = err.response?.data?.message || err.response?.data?.detail || 'Failed to update staff status';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

 const handleSubmitLeave = async (data: LeaveFormData) => {
  if (!showLeaveModal || !user?.school_id) {
    toast.error('User school ID or staff not found');
    setError('User school ID or staff not found');
    return;
  }
  setIsLoading(true);
  try {
    const payload = {
      leave_type: data.leave_type_id,
      academic_session: data.academic_session_id,
      start_date: data.start_date,
      end_date: data.end_date || null,
      days: data.days,
      reason: data.reason,
      staff: showLeaveModal.id,
    };
    const response = await api.post(`/school/settings/staff/${showLeaveModal.id}/leave`, payload);
    setStaffList(prev =>
      prev.map(s =>
        s.id === showLeaveModal.id ? { ...s, status: 'on_leave' } : s
      )
    );
    toast.success('Leave applied and status updated successfully');
    setShowLeaveModal(null);
    leaveForm.reset();
  } catch (err: any) {
    console.error('Apply leave error:', err);
    const errorMessage =
      err.response?.data?.detail ||
      Object.entries(err.response?.data || {})
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('; ') ||
      'Failed to apply leave';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const handleShowCredentials = async (staff: StaffMember) => {
    setShowCredentialsModal(staff);
    setNewPassword(staff.generated_password || '');
  };

  const handleUpdatePassword = async (staffId: string) => {
  if (!newPassword) {
    toast.error('Password cannot be empty');
    return;
  }
  setIsLoading(true);
  try {
    if (!user?.school_id) {
      throw new Error('User school ID not found');
    }
    const response = await api.post(`/school/settings/staff/${staffId}/reset-password/`, { new_password: newPassword });
    setStaffList(prev =>
      prev.map(s =>
        s.id === staffId ? { ...s, generated_password: response.data.new_password } : s
      )
    );
    setShowCredentialsModal(prev => (prev ? { ...prev, generated_password: response.data.new_password } : null));
    setNewPassword(response.data.new_password);
    toast.success('Password updated successfully');
  } catch (err: any) {
    console.error('Update password error:', err);
    const errorMessage = err.response?.data?.detail || err.response?.data?.message || 'Failed to update password';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const handleNameClick = (staffId: string) => {
    navigate(`/admin/staff/${staffId}`);
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <Briefcase size={28} className="mr-3 text-green-600" /> Staff Management
        </h1>
        <Button
          variant="primary"
          icon={<UserPlus size={16} />}
          onClick={() => {
            setEditingStaff(null);
            setCredentials(null);
            reset();
            setShowForm(true);
          }}
          disabled={isLoading}
        >
          Add New Staff
        </Button>
      </div>

      {error && (
        <div className="text-center py-4 text-red-600">
          {error}
          <Button
            variant="outline"
            className="ml-4"
            onClick={() => fetchData()}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card
            title={editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            className="w-full max-w-3xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-3">
              <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name*</label>
                  <input
                    type="text"
                    {...register('name', { required: editingStaff ? false : 'Full name is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address*</label>
                  <input
                    type="email"
                    {...register('email', { required: editingStaff ? false : 'Email is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">User Role*</label>
                  <select
                    {...register('role', { required: editingStaff ? false : 'User role is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select Role</option>
                    <option value="teacher">Teacher</option>
                    <option value="accountant">Accountant</option>
                    <option value="admin">Admin</option>
                  </select>
                  {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
                </div>
                <div>
                  <label htmlFor="staff_role_id" className="block text-sm font-medium text-gray-700">Staff Role*</label>
                  <select
                    {...register('staff_role_id', { required: editingStaff ? false : 'Staff role is required', valueAsNumber: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    {staffRoles.length === 0 ? (
                      <option value="">Loading Staff Roles...</option>
                    ) : (
                      <>
                        {!watch('staff_role_id') && <option value="">Select Staff Role</option>}
                        {staffRoles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {errors.staff_role_id && <p className="mt-1 text-sm text-red-600">{errors.staff_role_id.message}</p>}
                </div>
                <div>
                  <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">Department*</label>
                  <select
                    {...register('department_id', { required: editingStaff ? false : 'Department is required', valueAsNumber: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    {departments.length === 0 ? (
                      <option value="">Loading Departments...</option>
                    ) : (
                      <>
                        {!watch('department_id') && <option value="">Select Department</option>}
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </>
                    )}
                  </select>
                  {errors.department_id && <p className="mt-1 text-sm text-red-600">{errors.department_id.message}</p>}
                </div>
              </div>

              <h4 className="text-md font-medium text-gray-900">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name*</label>
                  <input
                    type="text"
                    {...register('first_name', { required: editingStaff ? false : 'First name is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>}
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name*</label>
                  <input
                    type="text"
                    {...register('last_name', { required: editingStaff ? false : 'Last name is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>}
                </div>
                <div>
                  <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    {...register('date_of_birth')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    {...register('gender')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select Option</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    {...register('address')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                  <input
                    type="text"
                    {...register('emergency_contact_name')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                  <input
                    type="text"
                    {...register('emergency_contact_phone')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <h4 className="text-md font-medium text-gray-900">Employment Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700">Hire Date*</label>
                  <input
                    type="date"
                    {...register('hire_date', { required: editingStaff ? false : 'Hire date is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.hire_date && <p className="mt-1 text-sm text-red-600">{errors.hire_date.message}</p>}
                </div>
                <div>
                  <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700">Employment Type*</label>
                  <select
                    {...register('employment_type', { required: editingStaff ? false : 'Employment type is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </select>
                  {errors.employment_type && <p className="mt-1 text-sm text-red-600">{errors.employment_type.message}</p>}
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status*</label>
                  <select
                    {...register('status', { required: editingStaff ? false : 'Status is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="terminated">Terminated</option>
                  </select>
                  {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
                </div>
                {employmentType === 'contract' && (
                  <div>
                    <label htmlFor="contract_end_date" className="block text-sm font-medium text-gray-700">Contract End Date</label>
                    <input
                      type="date"
                      {...register('contract_end_date')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                )}
              </div>
              {selectedRole === 'teacher' && (
                <>
                  <h4 className="text-md font-medium text-gray-700">Teaching Assignments</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="classes" className="block text-sm font-medium text-gray-700">Classes</label>
                      <select
                        multiple
                        {...register('classes', { 
                          setValueAs: (value) => Array.isArray(value) ? value.map(Number).filter(id => id) : [Number(value)].filter(id => id)
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      >
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="subjects" className="block text-sm font-medium text-gray-700">Subjects</label>
                      <select
                        multiple
                        {...register('subjects', { 
                          setValueAs: (value) => Array.isArray(value) ? value.map(Number).filter(id => id) : [Number(value)].filter(id => id)
                        })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                      >
                        {subjects.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
              
              <h4 className="text-md font-medium text-gray-900">Payroll Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="base_salary" className="block text-sm font-medium text-gray-700">Base Salary*</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('base_salary', { required: editingStaff ? false : 'Base salary is required', valueAsNumber: true })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                  {errors.base_salary && <p className="mt-1 text-sm text-red-600">{errors.base_salary.message}</p>}
                </div>
                <div>
                  <label htmlFor="pay_frequency" className="block text-sm font-medium text-gray-700">Pay Frequency*</label>
                  <select
                    {...register('pay_frequency', { required: editingStaff ? false : 'Pay frequency is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="bi_weekly">Bi-Weekly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  {errors.pay_frequency && <p className="mt-1 text-sm text-red-600">{errors.pay_frequency.message}</p>}
                </div>
                <div>
                  <label htmlFor="tax_status" className="block text-sm font-medium text-gray-700">Tax Status*</label>
                  <select
                    {...register('tax_status', { required: editingStaff ? false : 'Tax status is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="exempt">Tax Exempt</option>
                    <option value="non_exempt">Tax Non-Exempt</option>
                  </select>
                  {errors.tax_status && <p className="mt-1 text-sm text-red-600">{errors.tax_status.message}</p>}
                </div>
                <div>
                  <label htmlFor="bank_account" className="block text-sm font-medium text-gray-700">Bank Account Number</label>
                  <input
                    type="text"
                    {...register('bank_account')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">Bank Name</label>
                  <input
                    type="text"
                    {...register('bank_name')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="bank_branch" className="block text-sm font-medium text-gray-700">Bank Branch</label>
                  <input
                    type="text"
                    {...register('bank_branch')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <h4 className="text-md font-medium text-gray-900">Benefits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="health_insurance_number" className="block text-sm font-medium text-gray-700">Health Insurance Number</label>
                  <input
                    type="text"
                    {...register('health_insurance_number')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="pension_plan_number" className="block text-sm font-medium text-gray-700">Pension Plan Number</label>
                  <input
                    type="text"
                    {...register('pension_plan_number')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="provident_fund_number" className="block text-sm font-medium text-gray-700">Provident Fund Number</label>
                  <input
                    type="text"
                    {...register('provident_fund_number')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              {credentials && (
                <div className="mt-6 p-4 border rounded-md border-gray-200">
                  <h4 className="text-md font-medium text-gray-900">Generated Credentials</h4>
                  <div className="mt-2">
                    <p><strong>Email:</strong> {credentials.email}</p>
                    <div className="flex items-center">
                      <p><strong>Password:</strong> {credentials.password}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingStaff(null);
                    setCredentials(null);
                    reset();
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingStaff ? 'Save Changes' : 'Add Staff'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {showCredentialsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card title="User Credentials" className="w-full max-w-md bg-white shadow-xl">
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{showCredentialsModal.user_email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 flex items-center">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm"
                  />
                  <Button
                    variant="icon"
                    size="sm"
                    onClick={() => handleUpdatePassword(showCredentialsModal.id)}
                    title="Update Password"
                    disabled={isLoading}
                    className="ml-2"
                  >
                    <Key size={16} className="text-blue-600" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCredentialsModal(null);
                    setNewPassword('');
                  }}
                  disabled={isLoading}
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showLeaveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card title="Apply Leave" className="w-full max-w-md bg-white shadow-xl">
            <form onSubmit={leaveForm.handleSubmit(handleSubmitLeave)} className="p-4 space-y-4">
              <div>
                <label htmlFor="leave_type_id" className="block text-sm font-medium text-gray-700">Leave Type*</label>
                <select
                  {...leaveForm.register('leave_type_id', { required: 'Leave type is required', valueAsNumber: true })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes
                    .filter(lt => lt.applicable_gender === 'any' || lt.applicable_gender === showLeaveModal.gender)
                    .map(lt => (
                      <option key={lt.id} value={lt.id}>{lt.name} ({lt.paid_status || 'N/A'})</option>
                    ))}
                </select>
                {leaveForm.formState.errors.leave_type_id && (
                  <p className="mt-1 text-sm text-red-600">{leaveForm.formState.errors.leave_type_id.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="academic_session_id" className="block text-sm font-medium text-gray-700">Academic Session*</label>
                <select
                  {...leaveForm.register('academic_session_id', { required: 'Academic session is required', valueAsNumber: true })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select Session</option>
                  {academicSessions.map(session => (
                    <option key={session.id} value={session.id}>{session.name}</option>
                  ))}
                </select>
                {leaveForm.formState.errors.academic_session_id && (
                  <p className="mt-1 text-sm text-red-600">{leaveForm.formState.errors.academic_session_id.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date*</label>
                <input
                  type="date"
                  {...leaveForm.register('start_date', { required: 'Start date is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {leaveForm.formState.errors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{leaveForm.formState.errors.start_date.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  {...leaveForm.register('end_date')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="days" className="block text-sm font-medium text-gray-700">Days*</label>
                <input
                  type="number"
                  step="0.5"
                  {...leaveForm.register('days', { required: 'Days are required', valueAsNumber: true, min: { value: 0.5, message: 'Days must be at least 0.5' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {leaveForm.formState.errors.days && (
                  <p className="mt-1 text-sm text-red-600">{leaveForm.formState.errors.days.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                  {...leaveForm.register('reason')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowLeaveModal(null);
                    leaveForm.reset();
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Applying...' : 'Apply Leave'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4">
          <div>
            <label htmlFor="searchTermStaff" className="block text-sm font-medium text-gray-700">Search Staff</label>
            <input
              type="text"
              id="searchTermStaff"
              placeholder="Name or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="roleFilterStaff" className="block text-sm font-medium text-gray-700">Filter by Role</label>
            <select
              id="roleFilterStaff"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Roles</option>
              <option value="teacher">Teacher</option>
              <option value="accountant">Accountant</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="statusFilterStaff" className="block text-sm font-medium text-gray-700">Filter by Status</label>
            <select
              id="statusFilterStaff"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StaffMember['status'] | 'all')}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
          <Button
            variant="button"
            icon={<Filter />}
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
              setStatusFilter('all');
            }}
            className="mt-1"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      <Card title="School Staff Members">
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="min-w-full sm:divide-y sm:divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="sm:px-4 sm:py-3 sm:text-left sm:text-xs sm:font-medium sm:text-gray-500 sm:uppercase">Name</th>
                  <th className="sm:px-4 sm:py-3 sm:text-left sm:text-xs sm:font-medium sm:text-gray-500 sm:uppercase">Contact</th>
                  <th className="sm:px-4 sm:py-3 sm:text-left sm:text-xs sm:font-medium sm:text-gray-500 sm:uppercase">Role</th>
                  <th className="sm:px-4 sm:py-3 sm:text-left sm:text-xs sm:font-medium sm:text-gray-500 sm:uppercase">Department</th>
                  <th className="sm:px-4 sm:py-3 sm:text-left sm:text-xs sm:font-medium sm:text-gray-500 sm:uppercase">Status</th>
                  <th className="sm:px-4 sm:py-3 sm:text-left sm:text-xs sm:font-medium sm:text-gray-500 sm:uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="sm:bg-white sm:divide-y sm:divide-gray-200">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id}>
                    <td className="sm:px-4 sm:py-3 sm:whitespace-nowrap">
                      <div className="sm:flex sm:items-center">
                        <img
                          src={staff.profile_image || 'https://img.icons8.com/ios-filled/32/user.png'}
                          alt={`${staff.user_name}'s profile`}
                          className="sm:h-8 sm:w-8 sm:rounded-full sm:object-cover sm:mr-2"
                        />
                        <div>
                          <div
                            className="sm:text-sm sm:font-medium sm:text-blue-600 sm:hover:underline sm:cursor-pointer"
                            onClick={() => handleNameClick(staff.id)}
                          >
                            {staff.user_name}
                          </div>
                          <div className="sm:text-xs sm:text-gray-500">
                            {staff.subjects_names && staff.subjects_names.length > 0
                              ? `Teaches: ${staff.subjects_names.join(', ')}`
                              : `Joined: ${format(parseISO(staff.hire_date), 'MMM dd, yyyy')}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="sm:px-4 sm:py-3 sm:whitespace-nowrap sm:text-sm sm:text-gray-500">
                      <div className="sm:flex sm:items-center">
                        <Mail size={13} className="sm:mr-1.5 sm:text-gray-400" />
                        {staff.user_email}
                      </div>
                      {staff.phone && (
                        <div className="sm:flex sm:items-center sm:mt-0.5">
                          <Phone size={13} className="sm:mr-1.5 sm:text-gray-400" />
                          {staff.phone}
                        </div>
                      )}
                    </td>
                    <td className="sm:px-4 sm:py-3 sm:whitespace-nowrap sm:text-sm sm:text-gray-500 sm:capitalize">{staff.user_role.replace('_', ' ')}</td>
                    <td className="sm:px-4 sm:py-3 sm:whitespace-nowrap sm:text-sm sm:text-gray-500">{staff.department_name || 'N/A'}</td>
                    <td className="sm:px-4 sm:py-3 sm:whitespace-nowrap">
                      <div className="sm:flex sm:flex-col sm:gap-1">
                        {['active', 'on_leave', 'terminated'].map((status) => (
                          <label key={status} className="sm:text-xs sm:capitalize sm:flex sm:items-center">
                            <input
                              type="radio"
                              name={`status-${staff.id}`}
                              value={status}
                              checked={staff.status === status}
                              onChange={() => toggleStaffStatus(staff.id, staff.status)}
                              className="sm:mr-1"
                              disabled={isLoading}
                            />
                            {status.replace('_', ' ')}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="sm:px-4 sm:py-3 sm:whitespace-nowrap sm:text-sm sm:font-medium sm:space-x-1">
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => handleEditStaff(staff)}
                        title="Edit Staff"
                        disabled={isLoading}
                      >
                        <Edit size={16} className="sm:text-blue-600" />
                      </Button>
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => handleDeleteStaff(staff.id)}
                        title="Delete Staff"
                        disabled={isLoading}
                      >
                        <Trash2 size={16} className="sm:text-red-600" />
                      </Button>
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => handleShowCredentials(staff)}
                        title="View Credentials"
                        disabled={isLoading}
                      >
                        <Settings size={16} className="sm:text-gray-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && filteredStaff.length === 0 && (
          <p className="sm:text-center sm:py-6 sm:text-gray-500">No staff members found matching your criteria.</p>
        )}
      </Card>
    </div>
  );
};

export default StaffManagement;