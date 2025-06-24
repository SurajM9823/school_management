import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Users, Plus, Trash2, Edit, Save } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../api';
import { AxiosError } from 'axios';

interface LeaveType {
  id: number;
  name: string;
  default_days: number;
  unit: string;
  allow_carry_over: boolean;
  max_carry_over_days: number | null;
  paid_status: string | null;
  applicable_gender: string;
  leave_for: string;
  is_system_leave: boolean;
  is_active: boolean;
}

interface StaffRole {
  id: number;
  name: string;
  is_active: boolean;
}

interface Department {
  id: number;
  name: string;
  is_active: boolean;
}

interface LeaveFormData {
  id?: number;
  name: string;
  default_days: number;
  unit: string;
  allow_carry_over: boolean;
  max_carry_over_days: number | null;
  paid_status: string | null;
  applicable_gender: string;
  leave_for: string;
}

interface RoleFormData {
  id?: number;
  name: string;
}

interface DepartmentFormData {
  id?: number;
  name: string;
}

const StaffManagementSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    register: registerLeave,
    handleSubmit: handleSubmitLeave,
    formState: { errors: leaveErrors },
    reset: resetLeave,
    watch,
    setValue,
  } = useForm<LeaveFormData>({
    defaultValues: {
      name: '',
      default_days: 0,
      unit: 'days/year',
      allow_carry_over: false,
      max_carry_over_days: null,
      paid_status: 'paid',
      applicable_gender: 'any',
      leave_for: 'staff',
    },
  });
  const {
    register: registerRole,
    handleSubmit: handleSubmitRole,
    formState: { errors: roleErrors },
    reset: resetRole,
    setValue: setRoleValue,
  } = useForm<RoleFormData>({ defaultValues: { name: '' } });
  const {
    register: registerDept,
    handleSubmit: handleSubmitDept,
    formState: { errors: deptErrors },
    reset: resetDept,
    setValue: setDeptValue,
  } = useForm<DepartmentFormData>({ defaultValues: { name: '' } });

  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [staffRoles, setStaffRoles] = useState<StaffRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState<number | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);

  const leaveFor = watch('leave_for');
  const allowCarryOver = watch('allow_carry_over');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      toast.error('Unauthorized access. Please log in as admin.');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leaveResponse, roleResponse, deptResponse] = await Promise.all([
        api.get('/school/settings/leave-types/'),
        api.get('/school/settings/staff-roles/'),
        api.get('/school/settings/departments/'),
      ]);
      setLeaveTypes(leaveResponse.data);
      setStaffRoles(roleResponse.data);
      setDepartments(deptResponse.data);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to load data. Please try again.';
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'No school associated with your account.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Fetch staff management data error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitLeave = async (data: LeaveFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      let response: any;
      if (editingLeaveId) {
        response = await api.put(`/school/settings/leave-types/${editingLeaveId}/`, data);
        setLeaveTypes(leaveTypes.map(lt => lt.id === editingLeaveId ? response.data : lt));
        toast.success('Leave type updated successfully');
      } else {
        response = await api.post('/school/settings/leave-types/', data);
        setLeaveTypes([...leaveTypes, response.data]);
        toast.success('Leave type added successfully');
      }
      setShowLeaveModal(false);
      setEditingLeaveId(null);
      resetLeave();
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = `Failed to ${editingLeaveId ? 'update' : 'add'} leave type.`;
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.status === 403) {
        errorMessage = error.response?.data?.error || 'System leave types cannot be modified.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Leave type not found.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Leave type error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitRole = async (data: RoleFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      let response: any;
      if (editingRoleId) {
        response = await api.put(`/school/settings/staff-roles/${editingRoleId}/`, data);
        setStaffRoles(staffRoles.map(sr => sr.id === editingRoleId ? response.data : sr));
        toast.success('Staff role updated successfully');
      } else {
        response = await api.post('/school/settings/staff-roles/', data);
        setStaffRoles([...staffRoles, response.data]);
        toast.success('Staff role added successfully');
      }
      setShowRoleModal(false);
      setEditingRoleId(null);
      resetRole();
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = `Failed to ${editingRoleId ? 'update' : 'add'} staff role.`;
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Staff role not found.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Staff role error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitDept = async (data: DepartmentFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      let response: any;
      if (editingDeptId) {
        response = await api.put(`/school/settings/departments/${editingDeptId}/`, data);
        setDepartments(departments.map(d => d.id === editingDeptId ? response.data : d));
        toast.success('Department updated successfully');
      } else {
        response = await api.post('/school/settings/departments/', data);
        setDepartments([...departments, response.data]);
        toast.success('Department added successfully');
      }
      setShowDeptModal(false);
      setEditingDeptId(null);
      resetDept();
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = `Failed to ${editingDeptId ? 'update' : 'add'} department.`;
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Department not found.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Department error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditLeave = (leave: LeaveType) => {
    setEditingLeaveId(leave.id);
    setValue('id', leave.id);
    setValue('name', leave.name);
    setValue('default_days', leave.default_days);
    setValue('unit', leave.unit);
    setValue('allow_carry_over', leave.allow_carry_over);
    setValue('max_carry_over_days', leave.max_carry_over_days);
    setValue('paid_status', leave.paid_status);
    setValue('applicable_gender', leave.applicable_gender);
    setValue('leave_for', leave.leave_for);
    setShowLeaveModal(true);
  };

  const handleEditRole = (role: StaffRole) => {
    setEditingRoleId(role.id);
    setRoleValue('id', role.id);
    setRoleValue('name', role.name);
    setShowRoleModal(true);
  };

  const handleEditDept = (dept: Department) => {
    setEditingDeptId(dept.id);
    setDeptValue('id', dept.id);
    setDeptValue('name', dept.name);
    setShowDeptModal(true);
  };

  const handleDelete = async (type: string, id: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.replace('-', ' ')}?`)) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/school/settings/${type}/${id}/`);
      if (type === 'leave-types') {
        setLeaveTypes(leaveTypes.filter(lt => lt.id !== id));
      } else if (type === 'staff-roles') {
        setStaffRoles(staffRoles.filter(sr => sr.id !== id));
      } else if (type === 'departments') {
        setDepartments(departments.filter(d => d.id !== id));
      }
      toast.success(`${type.replace('-', ' ')} deleted successfully`);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = `Failed to delete ${type.replace('-', ' ')}.`;
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'Invalid request.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.status === 403) {
        errorMessage = error.response?.data?.error || 'System leave types cannot be deleted.';
      } else if (error.response?.status === 404) {
        errorMessage = `${type.replace('-', ' ')} not found.`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(`Delete ${type} error:`, error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-semibold text-gray-900">Staff Management Settings</h1>

      {error && (
        <div className="text-center py-4 text-red-600">
          {error}
          <Button
            variant="outline"
            className="ml-4"
            onClick={fetchData}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      )}

      <Card title="Leave Types">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingLeaveId(null);
              resetLeave();
              setShowLeaveModal(true);
            }}
            disabled={isLoading}
          >
            Add Leave Type
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">For</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaveTypes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No leave types available.
                    </td>
                  </tr>
                )}
                {leaveTypes.map((leave) => (
                  <tr key={leave.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leave.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.default_days}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.leave_for}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={16} />}
                        disabled={leave.is_system_leave || isLoading}
                        onClick={() => handleEditLeave(leave)}
                        className="mr-2"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        disabled={leave.is_system_leave || isLoading}
                        onClick={() => handleDelete('leave-types', leave.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Staff Roles">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingRoleId(null);
              resetRole();
              setShowRoleModal(true);
            }}
            disabled={isLoading}
          >
            Add Role
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {staffRoles.length === 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                No staff roles available.
              </div>
            )}
            {staffRoles.map((role) => (
              <div key={role.id} className="p-4 border rounded-md border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                <div className="mt-2 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Edit size={16} />}
                    onClick={() => handleEditRole(role)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    disabled={isLoading}
                    onClick={() => handleDelete('staff-roles', role.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Departments">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingDeptId(null);
              resetDept();
              setShowDeptModal(true);
            }}
            disabled={isLoading}
          >
            Add Department
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {departments.length === 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                No departments available.
              </div>
            )}
            {departments.map((dept) => (
              <div key={dept.id} className="p-4 border rounded-md border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{dept.name}</h3>
                <div className="mt-2 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Edit size={16} />}
                    onClick={() => handleEditDept(dept)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    disabled={isLoading}
                    onClick={() => handleDelete('departments', dept.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingLeaveId ? 'Edit Leave Type' : 'Add Leave Type'}
            </h3>
            <form onSubmit={handleSubmitLeave(onSubmitLeave)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Leave For</label>
                <select
                  {...registerLeave('leave_for', { required: 'Leave for is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="staff">Staff</option>
                  <option value="students">Students</option>
                </select>
                {leaveErrors.leave_for && <p className="mt-1 text-sm text-red-600">{leaveErrors.leave_for.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  {...registerLeave('name', {
                    required: 'Leave name is required',
                    maxLength: { value: 100, message: 'Name cannot exceed 100 characters' },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {leaveErrors.name && <p className="mt-1 text-sm text-red-600">{leaveErrors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Default Days</label>
                <input
                  type="number"
                  {...registerLeave('default_days', {
                    required: 'Days are required',
                    min: { value: 0, message: 'Days cannot be negative' },
                    max: { value: 365, message: 'Days cannot exceed 365' },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {leaveErrors.default_days && <p className="mt-1 text-sm text-red-600">{leaveErrors.default_days.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Unit</label>
                <select
                  {...registerLeave('unit', { required: 'Unit is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="days/year">Days/Year</option>
                  <option value="days/occurrence">Days/Occurrence</option>
                  <option value="as_needed">As Needed</option>
                </select>
                {leaveErrors.unit && <p className="mt-1 text-sm text-red-600">{leaveErrors.unit.message}</p>}
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...registerLeave('allow_carry_over')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Allow Carry Over</span>
                </label>
              </div>
              {allowCarryOver && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Carry Over Days</label>
                  <input
                    type="number"
                    {...registerLeave('max_carry_over_days', {
                      required: 'Max carry over days is required when carry over is allowed',
                      min: { value: 0, message: 'Days cannot be negative' },
                      max: { value: 365, message: 'Days cannot exceed 365' },
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  />
                  {leaveErrors.max_carry_over_days && <p className="mt-1 text-sm text-red-600">{leaveErrors.max_carry_over_days.message}</p>}
                </div>
              )}
              {leaveFor === 'staff' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Paid Status</label>
                  <select
                    {...registerLeave('paid_status', { required: leaveFor === 'staff' ? 'Paid status is required for staff' : false })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select Status</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="varies">Varies</option>
                  </select>
                  {leaveErrors.paid_status && <p className="mt-1 text-sm text-red-600">{leaveErrors.paid_status.message}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Applicable Gender</label>
                <select
                  {...registerLeave('applicable_gender', { required: 'Gender is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="any">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {leaveErrors.applicable_gender && <p className="mt-1 text-sm text-red-600">{leaveErrors.applicable_gender.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowLeaveModal(false);
                    setEditingLeaveId(null);
                    resetLeave();
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save size={16} />}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingLeaveId ? 'Update Leave Type' : 'Add Leave Type'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingRoleId ? 'Edit Staff Role' : 'Add Staff Role'}
            </h3>
            <form onSubmit={handleSubmitRole(onSubmitRole)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role Name</label>
                <input
                  type="text"
                  {...registerRole('name', {
                    required: 'Role name is required',
                    maxLength: { value: 100, message: 'Role name cannot exceed 100 characters' },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {roleErrors.name && <p className="mt-1 text-sm text-red-600">{roleErrors.name.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRoleId(null);
                    resetRole();
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save size={16} />}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingRoleId ? 'Update Role' : 'Add Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingDeptId ? 'Edit Department' : 'Add Department'}
            </h3>
            <form onSubmit={handleSubmitDept(onSubmitDept)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department Name</label>
                <input
                  type="text"
                  {...registerDept('name', {
                    required: 'Department name is required',
                    maxLength: { value: 100, message: 'Department name cannot exceed 100 characters' },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {deptErrors.name && <p className="mt-1 text-sm text-red-600">{deptErrors.name.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeptModal(false);
                    setEditingDeptId(null);
                    resetDept();
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save size={16} />}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingDeptId ? 'Update Department' : 'Add Department'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementSettings;