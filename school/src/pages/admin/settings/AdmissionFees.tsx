import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../api';
import { AxiosError } from 'axios';

interface Class {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
}

interface AdmissionFee {
  id: number;
  class_id: { id: number; name: string } | null;
  section: { id: number; name: string } | null;
  section_name: string | null;
  amount: number;
}

interface FeeFormData {
  class_id: string;
  section_id: string;
  amount: string;
}

const AdmissionFees: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FeeFormData>({
    defaultValues: {
      class_id: '',
      section_id: '',
      amount: '',
    },
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<{ [key: number]: Section[] }>({});
  const [admissionFees, setAdmissionFees] = useState<AdmissionFee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [editingFeeId, setEditingFeeId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      toast.error('Unauthorized access. Please log in as admin.');
      return;
    }
    loadInitialData();
  }, [user, navigate]);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [classesRes, feesRes] = await Promise.all([
        api.get('/school/settings/classes/'),
        api.get('/admission-fees/'),
      ]);
      setClasses(classesRes.data);
      setAdmissionFees(feesRes.data);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to load initial data. Please try again.';
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
      console.error('Load initial data error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSections = async (classId: number) => {
    try {
      const response = await api.get(`/school/settings/classes/${classId}/sections/`);
      setSections((prev) => ({ ...prev, [classId]: response.data }));
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string }>;
      const errorMessage = error.response?.data?.error || 'Failed to load sections';
      setSections((prev) => ({ ...prev, [classId]: [] }));
      toast.error(errorMessage);
      console.error('Fetch sections error:', error.response?.data);
    }
  };

  const onSubmitFee = async (data: FeeFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        class_id_id: parseInt(data.class_id),
        section: data.section_id ? parseInt(data.section_id) : null,
        amount: parseFloat(data.amount),
      };
      let response: any;
      if (editingFeeId) {
        response = await api.put(`/admission-fees/${editingFeeId}/`, payload);
        setAdmissionFees(admissionFees.map(fee => fee.id === editingFeeId ? response.data : fee));
        toast.success('Admission fee updated successfully');
      } else {
        response = await api.post('/admission-fees/', payload);
        setAdmissionFees([...admissionFees, response.data]);
        toast.success('Admission fee added successfully');
      }
      setShowFeeModal(false);
      setEditingFeeId(null);
      reset({ class_id: '', section_id: '', amount: '' });
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = `Failed to ${editingFeeId ? 'update' : 'add'} admission fee.`;
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Class, section, or fee not found.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Fee error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditFee = (fee: AdmissionFee) => {
    setEditingFeeId(fee.id);
    setValue('class_id', fee.class_id?.id.toString() || '');
    setValue('section_id', fee.section?.id.toString() || '');
    setValue('amount', fee.amount.toString());
    if (fee.class_id?.id) {
      fetchSections(fee.class_id.id);
    }
    setShowFeeModal(true);
  };

  const handleDeleteFee = async (feeId: number) => {
    if (!window.confirm('Are you sure you want to delete this admission fee?')) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/admission-fees/${feeId}/`);
      setAdmissionFees(admissionFees.filter(fee => fee.id !== feeId));
      toast.success('Admission fee deleted successfully');
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to delete admission fee.';
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Admission fee not found.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Delete fee error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-semibold text-gray-900">Admission Fees</h1>

      {error && (
        <div className="text-center py-4 text-red-600">
          {error}
          <Button
            variant="outline"
            className="ml-4"
            onClick={loadInitialData}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      )}

      <Card title="Set Admission Fees">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingFeeId(null);
              reset({ class_id: '', section_id: '', amount: '' });
              setShowFeeModal(true);
            }}
            disabled={isLoading}
          >
            Add Admission Fee
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admissionFees.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No admission fees available.
                    </td>
                  </tr>
                )}
                {admissionFees.map((fee) => (
                  <tr key={fee.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fee.class_id?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fee.section_name || 'All'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(fee.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={16} />}
                        className="mr-2"
                        onClick={() => handleEditFee(fee)}
                        disabled={isLoading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDeleteFee(fee.id)}
                        disabled={isLoading}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingFeeId ? 'Edit Admission Fee' : 'Add Admission Fee'}</h3>
            <form onSubmit={handleSubmit(onSubmitFee)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Class</label>
                <select
                  {...register('class_id', { required: 'Class is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  onChange={(e) => {
                    setValue('class_id', e.target.value);
                    setValue('section_id', '');
                    if (e.target.value) {
                      fetchSections(parseInt(e.target.value));
                    } else {
                      setSections((prev) => ({ ...prev, [parseInt(e.target.value)]: [] }));
                    }
                  }}
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                {errors.class_id && <p className="mt-1 text-sm text-red-600">{errors.class_id.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <select
                  {...register('section_id')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  disabled={!sections[parseInt(watch('class_id') || '0')]?.length}
                >
                  <option value="">All Sections</option>
                  {(sections[parseInt(watch('class_id') || '0')] || []).map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
                {errors.section_id && <p className="mt-1 text-sm text-red-600">{errors.section_id.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' },
                    max: { value: 99999999.99, message: 'Amount exceeds maximum allowed value' },
                    validate: {
                      decimalPlaces: (value) => {
                        const decimalPlaces = value.toString().split('.')[1]?.length || 0;
                        return decimalPlaces <= 2 || 'Amount cannot have more than 2 decimal places';
                      },
                    },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="0.00"
                  step="0.01"
                />
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowFeeModal(false);
                    setEditingFeeId(null);
                    reset({ class_id: '', section_id: '', amount: '' });
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
                  {isLoading ? 'Saving...' : editingFeeId ? 'Update Fee' : 'Add Fee'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdmissionFees;