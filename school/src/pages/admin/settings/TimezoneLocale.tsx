// TimezoneLocale.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Globe, Save } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../api';

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'Asia/Kathmandu', label: 'Asia/Kathmandu' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
];

interface LocaleSettings {
  timezone: string;
  language: string;
  date_format: string;
  time_format: string;
  currency_code: string;
  currency_symbol: string;
  first_day_of_week: string;
}

const TimezoneLocale: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<LocaleSettings>({
    defaultValues: {
      timezone: 'UTC',
      language: 'en',
      date_format: 'YYYY-MM-DD',
      time_format: '24h',
      currency_code: 'USD',
      currency_symbol: '$',
      first_day_of_week: 'Monday',
    },
  });
  const [localeData, setLocaleData] = useState<LocaleSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSettings, setHasSettings] = useState<boolean>(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      toast.error('Unauthorized access. Please log in as admin.');
      return;
    }
    fetchLocaleData();
  }, [user, navigate]);

  const fetchLocaleData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/school/settings/locale/');
      const data = response.data;
      setLocaleData(data);
      setHasSettings(true);
      reset(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate('/login');
        toast.error('Session expired. Please log in again.');
      } else if (err.response?.status === 404) {
        // No locale settings found, show form with default values
        setLocaleData(null);
        setHasSettings(false);
        setError(null); // Clear error to show the form
        logger.info('No locale settings found, showing form to create new settings');
      } else {
        setError(
          err.response?.data?.message ||
          'Failed to load locale data. Please try again or contact support.'
        );
        toast.error('Failed to load locale data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LocaleSettings) => {
    setIsLoading(true);
    setError(null);
    try {
      let response;
      if (hasSettings) {
        // Update existing settings
        response = await api.put('/school/settings/locale/', data);
      } else {
        // Create new settings
        response = await api.post('/school/settings/locale/', data);
        setHasSettings(true);
      }
      setLocaleData(response.data);
      reset(response.data);
      toast.success(
        hasSettings ? 'Locale settings updated successfully' : 'Locale settings created successfully'
      );
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate('/login');
        toast.error('Session expired. Please log in again.');
      } else if (err.response?.status === 404) {
        setError('No school associated with your account. Please contact support.');
        toast.error('No school associated with your account.');
      } else {
        const errorMessage = err.response?.data?.errors
          ? Object.values(err.response.data.errors).join(', ')
          : 'Failed to save locale settings. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-semibold text-gray-900">Timezone & Locale Settings</h1>

      {error && (
        <div className="text-center py-4 text-red-600">
          {error}
          <Button
            variant="outline"
            className="ml-4"
            onClick={fetchLocaleData}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      )}

      <Card title="Locale Settings">
        {isLoading && <div className="text-center py-4 text-gray-500">Loading...</div>}
        {!isLoading && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Timezone</label>
                <select
                  {...register('timezone', { required: 'Timezone is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select Timezone</option>
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                {errors.timezone && (
                  <p className="mt-1 text-sm text-red-600">{errors.timezone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <select
                  {...register('language', { required: 'Language is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select Language</option>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="np">Nepali</option>
                </select>
                {errors.language && (
                  <p className="mt-1 text-sm text-red-600">{errors.language.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Format</label>
                <select
                  {...register('date_format', { required: 'Date format is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select Date Format</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
                {errors.date_format && (
                  <p className="mt-1 text-sm text-red-600">{errors.date_format.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Time Format</label>
                <select
                  {...register('time_format', { required: 'Time format is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select Time Format</option>
                  <option value="12h">12-hour</option>
                  <option value="24h">24-hour</option>
                </select>
                {errors.time_format && (
                  <p className="mt-1 text-sm text-red-600">{errors.time_format.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Currency Code</label>
                <select
                  {...register('currency_code', { required: 'Currency code is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select Currency Code</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="NPR">NPR</option>
                </select>
                {errors.currency_code && (
                  <p className="mt-1 text-sm text-red-600">{errors.currency_code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Currency Symbol</label>
                <select
                  {...register('currency_symbol', { required: 'Currency symbol is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select Currency Symbol</option>
                  <option value="$">USD ($)</option>
                  <option value="€">EUR (€)</option>
                  <option value="₨">NPR (₨)</option>
                </select>
                {errors.currency_symbol && (
                  <p className="mt-1 text-sm text-red-600">{errors.currency_symbol.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">First Day of Week</label>
                <select
                  {...register('first_day_of_week', { required: 'First day of week is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select First Day</option>
                  <option value="Monday">Monday</option>
                  <option value="Sunday">Sunday</option>
                </select>
                {errors.first_day_of_week && (
                  <p className="mt-1 text-sm text-red-600">{errors.first_day_of_week.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                icon={<Save size={16} />}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : hasSettings ? 'Update Settings' : 'Create Settings'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default TimezoneLocale;