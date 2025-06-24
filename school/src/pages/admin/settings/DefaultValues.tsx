import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Settings, Save, Plus, Trash2 } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../api';
import { AxiosError, AxiosResponse } from 'axios';

interface GradingSettings {
  grading_system: string;
  passing_percentage: string;
}

interface AttendanceSettings {
  attendance_type: string;
  default_marking: string;
  custom_statuses?: string[];
  minimum_attendance: number;
  auto_notification: string;
  notification_threshold: number;
}

interface FeeType {
  id?: number;
  name: string;
  default_amount: string;
  is_mandatory: boolean;
}

interface FeeSettings {
  due_date: number;
  late_fee_type: string;
  late_fee_amount: number;
  reminder_days: number;
}

interface DefaultSettings {
  grading_settings: GradingSettings;
  attendance_settings: AttendanceSettings;
  fee_types: FeeType[];
  fee_settings: FeeSettings;
}

const DefaultValues: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<DefaultSettings>({
    defaultValues: {
      grading_settings: { grading_system: 'percentage', passing_percentage: '40' },
      attendance_settings: { attendance_type: 'basic', default_marking: 'P', minimum_attendance: 75, auto_notification: 'none', notification_threshold: 75 },
      fee_types: [],
      fee_settings: { due_date: 10, late_fee_type: 'fixed', late_fee_amount: 0, reminder_days: 5 },
    }
  });
  const [defaultSettings, setDefaultSettings] = useState<DefaultSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFeeType, setNewFeeType] = useState<FeeType>({ name: '', default_amount: '0', is_mandatory: true });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      toast.error('Unauthorized access. Please log in as admin.');
      return;
    }
    fetchDefaultSettings();
  }, [user, navigate]);

  const fetchDefaultSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [gradingResponse, attendanceResponse, feeTypesResponse, feeSettingsResponse] = await Promise.all([
        api.get('/school/settings/grading-settings/'),
        api.get('/school/settings/attendance-settings/'),
        api.get('/school/settings/fee-types/'),
        api.get('/school/settings/fee-settings/'),
      ]);
      const settings: DefaultSettings = {
        grading_settings: gradingResponse.data,
        attendance_settings: attendanceResponse.data,
        fee_types: feeTypesResponse.data,
        fee_settings: feeSettingsResponse.data,
      };
      setDefaultSettings(settings);
      reset(settings);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to load default settings. Please try again.';
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
      console.error('Fetch settings error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const addFeeType = async () => {
    if (!newFeeType.name || parseFloat(newFeeType.default_amount) < 0) {
      toast.error('Please provide a valid fee type name and amount');
      return;
    }
    setIsLoading(true);
    try {
      const response: AxiosResponse<FeeType> = await api.post('/school/settings/fee-types/', {
        ...newFeeType,
        default_amount: parseFloat(newFeeType.default_amount),
      });
      setDefaultSettings(prev => ({
        ...prev!,
        fee_types: [...(prev?.fee_types || []), response.data],
      }));
      setNewFeeType({ name: '', default_amount: '0', is_mandatory: true });
      toast.success('Fee type added successfully');
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = 'Failed to add fee type.';
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      }
      toast.error(errorMessage);
      console.error('Add fee type error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFeeType = async (id: number) => {
    setIsLoading(true);
    try {
      await api.delete(`/school/settings/fee-types/${id}/`);
      setDefaultSettings(prev => ({
        ...prev!,
        fee_types: prev?.fee_types.filter(ft => ft.id !== id) || [],
      }));
      toast.success('Fee type deleted successfully');
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to delete fee type.';
      if (error.response?.status === 404) {
        errorMessage = error.response?.data?.error || 'Fee type not found.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error(errorMessage);
      console.error('Delete fee type error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: DefaultSettings) => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        api.put('/school/settings/grading-settings/', data.grading_settings),
        api.put('/school/settings/attendance-settings/', data.attendance_settings),
        api.put('/school/settings/fee-settings/', data.fee_settings),
      ]);
      await fetchDefaultSettings();
      toast.success('Default settings updated successfully');
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = 'Failed to update default settings.';
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Update settings error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-3xl font-bold text-gray-800 flex items-center">
        <Settings className="mr-2" /> School Default Settings
      </h1>

      {error && (
        <div className="text-center py-4 text-red-600 bg-red-100 rounded-md">
          {error}
          <Button
            variant="outline"
            className="ml-4"
            onClick={fetchDefaultSettings}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      )}

      <Card title="Configure Default Values">
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && defaultSettings && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Grading Settings */}
            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Grading Settings</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grading System <span className="text-red-500">*</span></label>
                  <select
                    {...register('grading_settings.grading_system', { required: 'Grading system is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select Grading System</option>
                    <option value="percentage">Percentage</option>
                    <option value="gpa">GPA</option>
                    <option value="letter">Letter Grade</option>
                  </select>
                  {errors.grading_settings?.grading_system && (
                    <p className="mt-1 text-sm text-red-600">{errors.grading_settings.grading_system.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Choose the grading system used by your school.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Passing Grade <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    {...register('grading_settings.passing_percentage', { required: 'Passing grade is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 40, C, 2.0"
                  />
                  {errors.grading_settings?.passing_percentage && (
                    <p className="mt-1 text-sm text-red-600">{errors.grading_settings.passing_percentage.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Enter the minimum passing grade (e.g., 40 for percentage, C for letter).</p>
                </div>
              </div>
            </div>

            {/* Attendance Settings */}
            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Attendance Settings</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attendance Type <span className="text-red-500">*</span></label>
                  <select
                    {...register('attendance_settings.attendance_type', { required: 'Attendance type is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select Attendance Type</option>
                    <option value="basic">Present/Absent</option>
                    <option value="detailed">Present/Absent/Late/Excused</option>
                    <option value="custom">Custom Statuses</option>
                  </select>
                  {errors.attendance_settings?.attendance_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.attendance_settings.attendance_type.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Marking <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    {...register('attendance_settings.default_marking', { required: 'Default marking is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., P for Present"
                  />
                  {errors.attendance_settings?.default_marking && (
                    <p className="mt-1 text-sm text-red-600">{errors.attendance_settings.default_marking.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Attendance (%) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    {...register('attendance_settings.minimum_attendance', { required: 'Minimum attendance is required', min: 0, max: 100 })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {errors.attendance_settings?.minimum_attendance && (
                    <p className="mt-1 text-sm text-red-600">{errors.attendance_settings.minimum_attendance.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notification Type</label>
                  <select
                    {...register('attendance_settings.auto_notification')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="none">None</option>
                    <option value="daily_absent">Daily (Absent)</option>
                    <option value="weekly_summary">Weekly Summary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notification Threshold (%)</label>
                  <input
                    type="number"
                    {...register('attendance_settings.notification_threshold', { min: 0, max: 100 })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Fee Settings */}
            <div className="border-b pb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Fee Settings</h3>
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-800">Fee Types</h4>
                {defaultSettings.fee_types.map((feeType) => (
                  <div key={feeType.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-md">
                    <div className="flex-1">
                      <span className="font-medium">{feeType.name}</span> - ${parseFloat(feeType.default_amount).toFixed(2)}
                      {feeType.is_mandatory && <span className="ml-2 text-sm text-green-600">(Mandatory)</span>}
                    </div>
                    <Button
                      variant="danger"
                      icon={<Trash2 size={16} />}
                      onClick={() => deleteFeeType(feeType.id!)}
                      disabled={isLoading}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fee Type Name</label>
                    <input
                      type="text"
                      value={newFeeType.name}
                      onChange={(e) => setNewFeeType({ ...newFeeType, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., Tuition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Amount</label>
                    <input
                      type="number"
                      value={newFeeType.default_amount}
                      onChange={(e) => setNewFeeType({ ...newFeeType, default_amount: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      icon={<Plus size={16} />}
                      onClick={addFeeType}
                      disabled={isLoading}
                    >
                      Add Fee Type
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date (Day of Month)</label>
                  <input
                    type="number"
                    {...register('fee_settings.due_date', { required: 'Due date is required', min: 1, max: 31 })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 10"
                  />
                  {errors.fee_settings?.due_date && (
                    <p className="mt-1 text-sm text-red-600">{errors.fee_settings.due_date.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Late Fee Type</label>
                  <select
                    {...register('fee_settings.late_fee_type', { required: 'Late fee type is required' })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select Late Fee Type</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                    <option value="daily">Daily Fine</option>
                  </select>
                  {errors.fee_settings?.late_fee_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.fee_settings.late_fee_type.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Late Fee Amount</label>
                  <input
                    type="number"
                    {...register('fee_settings.late_fee_amount', { required: 'Late fee amount is required', min: 0 })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                  />
                  {errors.fee_settings?.late_fee_amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.fee_settings.late_fee_amount.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reminder Days</label>
                  <input
                    type="number"
                    {...register('fee_settings.reminder_days', { required: 'Reminder days is required', min: 0 })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 5"
                  />
                  {errors.fee_settings?.reminder_days && (
                    <p className="mt-1 text-sm text-red-600">{errors.fee_settings.reminder_days.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                icon={<Save size={24} />}
                disabled={isLoading}
                className="px-6 py-3"
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        )}
        {!isLoading && !error && !defaultSettings && (
          <div className="text-center py-4">No default settings configured. Please configure defaults.</div>
        )}
      </Card>
    </div>
  );
};

export default DefaultValues;