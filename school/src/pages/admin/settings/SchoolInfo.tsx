
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { School, Save, Upload } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../api';

// Define backend base URL (use environment variable in production)
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface SchoolData {
  school_id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  academic_year: string;
  founded_date: string;
  affiliation: string;
  motto: string;
  logo: File | string | null;
}

const SchoolInfo: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<SchoolData>({
    defaultValues: {
      school_id: '',
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      academic_year: '',
      founded_date: '',
      affiliation: '',
      motto: '',
      logo: null,
    },
  });
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      toast.error('Unauthorized access. Please log in as admin.');
      return;
    }
    fetchSchoolData();
  }, [user, navigate]);

  const fetchSchoolData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/school/settings');
      const data = response.data;
      // Prepend backend base URL to logo path if it exists
      if (data.logo && typeof data.logo === 'string' && data.logo.startsWith('/media')) {
        data.logo = `${BACKEND_BASE_URL}${data.logo}`;
      }
      setSchoolData(data);
      setLogoPreview(data.logo);
      reset({
        ...data,
        logo: null, // Reset logo to null since it's a file input
      });
    } catch (err: any) {
      console.error('Fetch school data error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 404) {
        setError('School data not found. Please contact support or create settings.');
      } else {
        setError(
          err.response?.data?.message ||
          'Failed to load school data. Please try again or contact support.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error('Only PNG, JPEG, or JPG files are allowed');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('File size must be less than 2MB');
        return;
      }
      setValue('logo', file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: SchoolData) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('address', data.address);
      formData.append('phone', data.phone);
      formData.append('email', data.email);
      if (data.website) formData.append('website', data.website);
      formData.append('academic_year', data.academic_year);
      if (data.founded_date) formData.append('founded_date', data.founded_date);
      if (data.affiliation) formData.append('affiliation', data.affiliation);
      if (data.motto) formData.append('motto', data.motto);
      if (data.logo instanceof File) {
        formData.append('logo', data.logo);
      }

      const response = await api.put('/school/settings/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const responseData = response.data;
      // Prepend backend base URL to logo path in response
      if (responseData.logo && typeof responseData.logo === 'string' && responseData.logo.startsWith('/media')) {
        responseData.logo = `${BACKEND_BASE_URL}${responseData.logo}`;
      }
      setSchoolData(responseData);
      setLogoPreview(responseData.logo);
      reset({
        ...responseData,
        logo: null, // Reset logo to null after upload
      });
      toast.success('School information updated successfully');
    } catch (err: any) {
      console.error('Update school data error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
        toast.error('Session expired. Please log in again.');
      } else {
        setError(
          err.response?.data?.message ||
          'Failed to update school information. Please try again.'
        );
        toast.error('Failed to update school information');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-semibold text-gray-900">School Information</h1>

      {error && (
        <div className="text-center py-4 text-red-600">
          {error}
          <Button
            variant="outline"
            className="ml-4"
            onClick={fetchSchoolData}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      )}

      <Card title="School Details">
        {isLoading && <div className="text-center py-4 text-gray-500">Loading...</div>}
        {!isLoading && !error && schoolData && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">School Name</label>
                <input
                  type="text"
                  {...register('name', {
                    required: 'School name is required',
                    maxLength: { value: 255, message: 'School name cannot exceed 255 characters' },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  {...register('address', {
                    required: 'Address is required',
                    maxLength: { value: 500, message: 'Address cannot exceed 500 characters' },
                  })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  {...register('phone', {
                    required: 'Phone is required',
                    pattern: {
                      value: /^\+?[\d\s-]{7,20}$/,
                      message: 'Invalid phone number format',
                    },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: 'Invalid email format',
                    },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  {...register('website', {
                    pattern: {
                      value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                      message: 'Invalid URL format',
                    },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                <input
                  type="text"
                  {...register('academic_year', {
                    required: 'Academic year is required',
                    pattern: {
                      value: /^\d{4}-\d{4}$/,
                      message: 'Format must be YYYY-YYYY (e.g., 2024-2025)',
                    },
                  })}
                  placeholder="YYYY-YYYY"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.academic_year && <p className="mt-1 text-sm text-red-600">{errors.academic_year.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Founded Date</label>
                <input
                  type="date"
                  {...register('founded_date', {
                    validate: (value) => {
                      if (!value) return true; // Allow empty (not required)
                      const selectedDate = new Date(value);
                      const today = new Date();
                      return selectedDate <= today || 'Founded date cannot be in the future';
                    },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.founded_date && <p className="mt-1 text-sm text-red-600">{errors.founded_date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Affiliation</label>
                <input
                  type="text"
                  {...register('affiliation', {
                    maxLength: { value: 100, message: 'Affiliation cannot exceed 100 characters' },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.affiliation && <p className="mt-1 text-sm text-red-600">{errors.affiliation.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Motto</label>
                <input
                  type="text"
                  {...register('motto', {
                    maxLength: { value: 255, message: 'Motto cannot exceed 255 characters' },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.motto && <p className="mt-1 text-sm text-red-600">{errors.motto.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">School Logo</label>
                {logoPreview && (
                  <div className="mt-2 mb-4">
                    <img
                      src={logoPreview}
                      alt="School Logo"
                      className="h-20 w-auto object-contain border border-gray-200 rounded-md"
                      onError={() => console.error('Failed to load image:', logoPreview)}
                    />
                  </div>
                )}
                <div className="relative mt-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {errors.logo && <p className="mt-1 text-sm text-red-600">{errors.logo.message}</p>}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                icon={<Save size={16} />}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Update School Info'}
              </Button>
            </div>
          </form>
        )}
        {!isLoading && !error && !schoolData && (
          <div className="text-center py-4 text-sm text-gray-500">
            No school data available. Please contact support or create settings.
          </div>
        )}
      </Card>
    </div>
  );
};

export default SchoolInfo;
