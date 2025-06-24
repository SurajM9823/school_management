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
import { AxiosError, AxiosResponse } from 'axios';

interface NotificationSettings {
  smtp_host: string;
  smtp_port: number | null;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  from_email: string;
  from_name: string;
  sms_provider: string;
  sms_api_key: string;
  sms_sender_id: string;
}

interface NotificationTemplate {
  template_id: string;
  name: string;
  content: string;
  is_active: boolean;
}

interface NotificationFormInputs {
  notification_settings: NotificationSettings;
  template_name?: string;
  template_content?: string;
  is_active?: boolean;
}

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<NotificationFormInputs>({
    defaultValues: {
      notification_settings: {
        smtp_host: '',
        smtp_port: null,
        smtp_username: '',
        smtp_password: '',
        smtp_encryption: 'none',
        from_email: '',
        from_name: '',
        sms_provider: 'none',
        sms_api_key: '',
        sms_sender_id: ''
      }
    }
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testSmtpLoading, setTestSmtpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      toast.error('Unauthorized access. Please log in as admin.');
      return;
    }
    fetchNotificationData();
  }, [user, navigate]);

  const fetchNotificationData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [settingsResponse, templatesResponse] = await Promise.all([
        api.get('/school/settings/notification-settings/'),
        api.get('/school/settings/notifications/templates/'),
      ]);
      setNotificationSettings(settingsResponse.data);
      setTemplates(templatesResponse.data);
      reset({ notification_settings: settingsResponse.data });
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to load notification settings. Please try again.';
      if (error.response?.status === 404) {
        setNotificationSettings({
          smtp_host: '',
          smtp_port: null,
          smtp_username: '',
          smtp_password: '',
          smtp_encryption: 'none',
          from_email: '',
          from_name: '',
          sms_provider: 'none',
          sms_api_key: '',
          sms_sender_id: ''
        });
        setTemplates([]);
        reset({
          notification_settings: {
            smtp_host: '',
            smtp_port: null,
            smtp_username: '',
            smtp_password: '',
            smtp_encryption: 'none',
            from_email: '',
            from_name: '',
            sms_provider: 'none',
            sms_api_key: '',
            sms_sender_id: ''
          }
        });
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'No school associated with your account.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Fetch error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitSettings = async (data: NotificationFormInputs) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.put('/school/settings/notification-settings/', data.notification_settings);
      await fetchNotificationData();
      toast.success('Notification settings updated successfully');
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = 'Failed to update notification settings.';
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
      console.error('Save error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitTemplate = async (data: NotificationFormInputs) => {
    setIsLoading(true);
    setError(null);
    try {
      const templateData = {
        name: data.template_name,
        content: data.template_content,
        is_active: data.is_active ?? true,
      };
      let response: AxiosResponse<NotificationTemplate>;
      if (editingTemplateId) {
        response = await api.put(`/school/settings/notifications/templates/${editingTemplateId}/`, templateData);
        setTemplates(templates.map(t => t.template_id === editingTemplateId ? response.data : t));
        toast.success('Template updated successfully');
      } else {
        response = await api.post('/school/settings/notifications/templates/', templateData);
        setTemplates([...templates, response.data]);
        toast.success('Template added successfully');
      }
      setShowAddTemplateModal(false);
      setEditingTemplateId(null);
      reset({ template_name: '', template_content: '', is_active: true });
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = `Failed to ${editingTemplateId ? 'update' : 'add'} template.`;
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Template not found.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Template error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSMTP = async () => {
    setTestSmtpLoading(true);
    try {
      await api.post('/school/settings/notification-settings/test-smtp/');
      toast.success('SMTP test successful');
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'SMTP test failed.';
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'Invalid SMTP settings.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      toast.error(errorMessage);
      console.error('SMTP test error:', error.response?.data);
    } finally {
      setTestSmtpLoading(false);
    }
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setEditingTemplateId(template.template_id);
    setValue('template_name', template.name);
    setValue('template_content', template.content);
    setValue('is_active', template.is_active);
    setShowAddTemplateModal(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/school/settings/notifications/templates/${templateId}/`);
      setTemplates(templates.filter(t => t.template_id !== templateId));
      toast.success('Template deleted successfully');
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to delete template.';
      if (error.response?.status === 404) {
        errorMessage = 'Template not found.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Delete error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-semibold text-gray-900">Email & SMS Notifications</h1>

      {error && (
        <div className="text-center py-4 text-red-600">
          {error}
          <Button
            variant="outline"
            className="ml-4"
            onClick={fetchNotificationData}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      )}

      <Card title="SMTP Settings">
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && notificationSettings && (
          <form onSubmit={handleSubmit(onSubmitSettings)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                <input
                  type="text"
                  {...register('notification_settings.smtp_host')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                <input
                  type="number"
                  {...register('notification_settings.smtp_port')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Username</label>
                <input
                  type="text"
                  {...register('notification_settings.smtp_username')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Password</label>
                <input
                  type="password"
                  {...register('notification_settings.smtp_password')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">SMTP Encryption</label>
                <select
                  {...register('notification_settings.smtp_encryption')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="none">None</option>
                  <option value="ssl">SSL</option>
                  <option value="tls">TLS</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From Email</label>
                <input
                  type="email"
                  {...register('notification_settings.from_email')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">From Name</label>
                <input
                  type="text"
                  {...register('notification_settings.from_name')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">SMS Provider</label>
                <select
                  {...register('notification_settings.sms_provider')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="none">None</option>
                  <option value="twilio">Twilio</option>
                  <option value="vonage">Vonage</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">SMS API Key</label>
                <input
                  type="text"
                  {...register('notification_settings.sms_api_key')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">SMS Sender ID</label>
                <input
                  type="text"
                  {...register('notification_settings.sms_sender_id')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestSMTP}
                disabled={testSmtpLoading || isLoading}
              >
                {testSmtpLoading ? 'Testing...' : 'Test SMTP'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={<Save size={16} />}
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card title="Notification Templates">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={20} />}
            onClick={() => {
              setEditingTemplateId(null);
              reset({ template_name: '', template_content: '', is_active: true });
              setShowAddTemplateModal(true);
            }}
            disabled={isLoading}
          >
            Add Template
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Template Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.template_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{template.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={16} />}
                        className="mr-2"
                        onClick={() => handleEditTemplate(template)}
                        disabled={isLoading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDeleteTemplate(template.template_id)}
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

      {showAddTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingTemplateId ? 'Edit Template' : 'Add New Template'}
            </h3>
            <form onSubmit={handleSubmit(onSubmitTemplate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Template Name</label>
                <input
                  type="text"
                  {...register('template_name', { required: 'Template name is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.template_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.template_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  {...register('template_content', { required: 'Template content is required' })}
                  rows={5}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.template_content && (
                  <p className="mt-1 text-sm text-red-600">{errors.template_content.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Active</label>
                <input
                  type="checkbox"
                  {...register('is_active')}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddTemplateModal(false);
                    setEditingTemplateId(null);
                    reset({ template_name: '', template_content: '', is_active: true });
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
                  {isLoading ? 'Saving...' : editingTemplateId ? 'Update Template' : 'Add Template'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;