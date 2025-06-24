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

interface AcademicSession {
  id: number;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface Term {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface Holiday {
  id: number;
  name: string;
  start_date: string;
  end_date?: string;
  holiday_type: string;
  holiday_category: string;
  is_active: boolean;
}

interface FormData {
  name: string;
  status?: string;
  start_date: string;
  end_date?: string;
  holiday_type?: string;
  holiday_category?: string;
  is_active?: boolean;
}

interface User {
  role: string;
  [key: string]: any;
}

const SessionConfig: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setValue, reset, watch } = useForm<FormData>({
    defaultValues: {
      name: '',
      status: 'upcoming',
      start_date: '',
      end_date: '',
      holiday_type: 'school_holiday',
      holiday_category: 'all',
      is_active: true,
    },
  });
  const startDate = watch('start_date');
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editingTermId, setEditingTermId] = useState<number | null>(null);
  const [editingHolidayId, setEditingHolidayId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || (user as User).role !== 'admin') {
      navigate('/login');
      toast.error('Unauthorized access. Please log in as admin.');
      return;
    }
    fetchSessions();
  }, [user, navigate]);

  useEffect(() => {
    console.log('Selected Session ID:', selectedSessionId);
    if (selectedSessionId) {
      fetchTerms(selectedSessionId);
      fetchHolidays(selectedSessionId);
    }
  }, [selectedSessionId]);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response: AxiosResponse<AcademicSession[]> = await api.get('/school/settings/sessions/');
      setSessions(response.data || []);
      if (response.data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(response.data[0].id);
      }
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to load sessions.';
      if (error.response?.status === 404) {
        errorMessage = error.response?.data?.error || 'No school associated with your account or no sessions found.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Fetch sessions error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTerms = async (sessionId: number) => {
    setIsLoading(true);
    try {
      console.log(`Fetching terms for session ID: ${sessionId}`);
      const response: AxiosResponse<Term[]> = await api.get(`/school/settings/sessions/${sessionId}/terms/`);
      setTerms(response.data || []);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to load terms.';
      if (error.response?.status === 404) {
        errorMessage = error.response?.data?.error || 'Session not found or no terms available.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Fetch terms error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHolidays = async (sessionId: number) => {
    setIsLoading(true);
    try {
      console.log(`Fetching holidays for session ID: ${sessionId}`);
      const response: AxiosResponse<Holiday[]> = await api.get(`/school/settings/sessions/${sessionId}/holidays/`);
      setHolidays(response.data || []);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to load holidays.';
      if (error.response?.status === 404) {
        errorMessage = error.response?.data?.error || 'Session not found or no holidays available.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Fetch holidays error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionSelect = (sessionId: number, event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    console.log(`Session selected: ${sessionId}`);
    setSelectedSessionId(sessionId);
  };

  const onSubmitSession = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    console.log('Submitting session data:', data);
    try {
      let response: AxiosResponse<AcademicSession>;
      if (editingSessionId) {
        response = await api.put(`/school/settings/sessions/${editingSessionId}/`, data);
        setSessions(sessions.map(s => s.id === editingSessionId ? response.data : s));
        toast.success('Session updated successfully');
      } else {
        response = await api.post('/school/settings/sessions/', data);
        setSessions([...sessions, response.data]);
        toast.success('Session added successfully');
        setSelectedSessionId(response.data.id);
      }
      setShowSessionModal(false);
      setEditingSessionId(null);
      reset({ name: '', status: 'upcoming', start_date: '', end_date: '' });
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = `Failed to ${editingSessionId ? 'update' : 'add'} session.`;
      if (error.response?.status === 404) {
        errorMessage = error.response?.data?.error || 'No school associated with your account.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = Object.entries(error.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(', ');
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Session submit error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitTerm = async (data: FormData) => {
    if (!selectedSessionId) {
      toast.error('Please select a session first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    console.log('Submitting term data:', data);
    try {
      let response: AxiosResponse<Term>;
      const payload = {
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        is_active: data.is_active ?? true,
        session_id: selectedSessionId,
      };
      console.log('Term payload:', payload);
      if (editingTermId) {
        response = await api.put(`/school/settings/sessions/${selectedSessionId}/terms/${editingTermId}/`, payload);
        setTerms(terms.map(t => t.id === editingTermId ? response.data : t));
        toast.success('Term updated successfully');
      } else {
        response = await api.post(`/school/settings/sessions/${selectedSessionId}/terms/`, payload);
        setTerms([...terms, response.data]);
        toast.success('Term added successfully');
      }
      setShowTermModal(false);
      setEditingTermId(null);
      reset({ name: '', start_date: '', end_date: '', is_active: true });
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = `Failed to ${editingTermId ? 'update' : 'add'} term.`;
      if (error.response?.status === 404) {
        errorMessage = error.response?.data?.error || 'Session or term not found.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = Object.entries(error.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(', ');
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Term submit error:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitHoliday = async (data: FormData) => {
    if (!selectedSessionId) {
      toast.error('Please select a session first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    console.log('Submitting holiday data:', data);
    try {
      let response: AxiosResponse<Holiday>;
      const payload = {
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date || null,
        holiday_type: data.holiday_type || 'school_holiday',
        holiday_category: data.holiday_category || 'all',
        is_active: data.is_active ?? true,
        session_id: selectedSessionId,
      };
      console.log('Holiday payload:', payload);
      if (editingHolidayId) {
        response = await api.put(`/school/settings/sessions/${selectedSessionId}/holidays/${editingHolidayId}/`, payload);
        setHolidays(holidays.map(h => h.id === editingHolidayId ? response.data : h));
        toast.success('Holiday updated successfully');
      } else {
        response = await api.post(`/school/settings/sessions/${selectedSessionId}/holidays/`, payload);
        setHolidays([...holidays, response.data]);
        toast.success('Holiday added successfully');
      }
      setShowHolidayModal(false);
      setEditingHolidayId(null);
      reset({ name: '', start_date: '', end_date: '', holiday_type: 'school_holiday', holiday_category: 'all', is_active: true });
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = `Failed to ${editingHolidayId ? 'update' : 'add'} holiday.`;
      if (error.response?.status === 404) {
        errorMessage = error.response?.data?.error || 'Session or holiday not found.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.data) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else {
          errorMessage = Object.entries(error.response.data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(', ');
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Holiday submit error:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSession = (session: AcademicSession, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setEditingSessionId(session.id);
    setValue('name', session.name);
    setValue('status', session.status);
    setValue('start_date', session.start_date);
    setValue('end_date', session.end_date);
    setShowSessionModal(true);
  };

  const handleDeleteSession = async (id: number, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/school/settings/sessions/${id}/`);
      setSessions(sessions.filter(s => s.id !== id));
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
        setTerms([]);
        setHolidays([]);
      }
      toast.success('Session deleted successfully');
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to delete session.';
      if (error.response?.status === 404) {
        errorMessage = error.response?.data?.error || 'Session not found.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Delete session error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTerm = (term: Term) => {
    setEditingTermId(term.id);
    setValue('name', term.name);
    setValue('start_date', term.start_date);
    setValue('end_date', term.end_date);
    setValue('is_active', term.is_active);
    setShowTermModal(true);
  };

  const handleDeleteTerm = async (id: number) => {
    if (!selectedSessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/school/settings/sessions/${selectedSessionId}/terms/${id}/`);
      setTerms(terms.filter(t => t.id !== id));
      toast.success('Term deleted successfully');
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to delete term.';
      if (error.response?.status === 404) {
        errorMessage = error.response?.data?.error || 'Term not found.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Delete term error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHolidayId(holiday.id);
    setValue('name', holiday.name);
    setValue('start_date', holiday.start_date);
    setValue('end_date', holiday.end_date || '');
    setValue('holiday_type', holiday.holiday_type);
    setValue('holiday_category', holiday.holiday_category);
    setValue('is_active', holiday.is_active);
    setShowHolidayModal(true);
  };

  const handleDeleteHoliday = async (id: number) => {
    if (!selectedSessionId) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/school/settings/sessions/${selectedSessionId}/holidays/${id}/`);
      setHolidays(holidays.filter(h => h.id !== id));
      toast.success('Holiday deleted successfully');
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to delete holiday.';
      if (error.response?.status === 404) {
        errorMessage = error.response?.data?.error || 'Holiday not found.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Delete holiday error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const validateEndDate = (endDate: string | undefined) => {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return 'End date must be after start date';
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-semibold text-gray-900">Session Configuration</h1>

      {error && (
        <div className="text-center py-4 text-red-600">
          {error}
          <Button
            variant="outline"
            className="ml-4"
            onClick={fetchSessions}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      )}

      <Card title="Academic Sessions">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingSessionId(null);
              reset({ name: '', status: 'upcoming', start_date: '', end_date: '' });
              setShowSessionModal(true);
            }}
            disabled={isLoading}
          >
            Add Session
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`p-4 border rounded-md cursor-pointer ${selectedSessionId === session.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
                onClick={(e) => handleSessionSelect(session.id, e)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">{session.name}</h3>
                    <p className="text-sm text-gray-600">
                      {session.start_date} - {session.end_date}
                    </p>
                    {session.status === 'active' && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit size={16} />}
                      onClick={(e) => handleEditSession(session, e)}
                      disabled={isLoading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && !error && sessions.length === 0 && (
          <div className="text-center py-4">No sessions configured.</div>
        )}
      </Card>

      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingSessionId ? 'Edit Session' : 'Add New Session'}
            </h3>
            <form onSubmit={handleSubmit(onSubmitSession)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Session Name</label>
                <input
                  type="text"
                  {...register('name', {
                    required: 'Session name is required',
                    maxLength: { value: 20, message: 'Session name cannot exceed 20 characters' },
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  {...register('status', { required: 'Status is required' })}
                  className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 py-2 px-3 text-gray-700 shadow-sm focus:border-blue-400 focus:ring-blue-200 sm:text-sm"
                >
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
                {errors.status && (
                  <p className="mt-2 text-sm text-red-500">{errors.status.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  {...register('start_date', { required: 'Start date is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                />
                {errors.start_date && (
                  <p className="mt-2 text-sm text-red-500">{errors.start_date.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  {...register('end_date', {
                    required: 'End date is required',
                    validate: validateEndDate,
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                />
                {errors.end_date && (
                  <p className="mt-2 text-sm text-red-500">{errors.end_date.message}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSessionModal(false);
                    setEditingSessionId(null);
                    reset({ name: '', status: 'upcoming', start_date: '', end_date: '' });
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
                  {isLoading ? 'Saving...' : editingSessionId ? 'Update Session' : 'Add Session'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSessionId && (
        <>
          <Card title="Terms/Semesters">
            <div className="flex justify-end mb-4">
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingTermId(null);
                  reset({ name: '', start_date: '', end_date: '', is_active: true });
                  setShowTermModal(true);
                }}
                disabled={isLoading}
              >
                Add Term
              </Button>
            </div>
            {isLoading && <div className="text-center py-4">Loading...</div>}
            {!isLoading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {terms.map((term) => (
                      <tr key={term.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{term.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{term.start_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{term.end_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {term.is_active ? 'Yes' : 'No'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit size={16} />}
                            className="mr-2"
                            onClick={() => handleEditTerm(term)}
                            disabled={isLoading}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => handleDeleteTerm(term.id)}
                            disabled={isLoading}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!isLoading && !error && terms.length === 0 && (
              <div className="text-center py-4">No terms configured.</div>
            )}
          </Card>

          {showTermModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingTermId ? 'Edit Term' : 'Add New Term'}
                </h3>
                <form onSubmit={handleSubmit(onSubmitTerm)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Term Name</label>
                    <input
                      type="text"
                      {...register('name', {
                        required: 'Term name is required',
                        maxLength: { value: 100, message: 'Term name cannot exceed 100 characters' },
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      {...register('start_date', { required: 'Start date is required' })}
                      className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                    />
                    {errors.start_date && (
                      <p className="mt-2 text-sm text-red-500">{errors.start_date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      {...register('end_date', {
                        required: 'End date is required',
                        validate: validateEndDate,
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                    />
                    {errors.end_date && (
                      <p className="mt-2 text-sm text-red-500">{errors.end_date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Active</label>
                    <input
                      type="checkbox"
                      {...register('is_active')}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-400 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowTermModal(false);
                        setEditingTermId(null);
                        reset({ name: '', start_date: '', end_date: '', is_active: true });
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
                      {isLoading ? 'Saving...' : editingTermId ? 'Update Term' : 'Add Term'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <Card title="Holidays">
            <div className="flex justify-end mb-4">
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingHolidayId(null);
                  reset({ name: '', start_date: '', end_date: '', holiday_type: 'school_holiday', holiday_category: 'all', is_active: true });
                  setShowHolidayModal(true);
                }}
                disabled={isLoading}
              >
                Add Holiday
              </Button>
            </div>
            {isLoading && <div className="text-center py-4">Loading...</div>}
            {!isLoading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {holidays.map((holiday) => (
                      <tr key={holiday.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{holiday.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{holiday.start_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{holiday.end_date || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{holiday.holiday_type.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{holiday.holiday_category.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{holiday.is_active ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit size={16} />}
                            className="mr-2"
                            onClick={() => handleEditHoliday(holiday)}
                            disabled={isLoading}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            disabled={isLoading}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!isLoading && !error && holidays.length === 0 && (
              <div className="text-center py-4">No holidays configured.</div>
            )}
          </Card>

          {showHolidayModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-sm max-w-md w-full">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingHolidayId ? 'Edit Holiday' : 'Add New Holiday'}
                </h3>
                <form onSubmit={handleSubmit(onSubmitHoliday)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Holiday Name</label>
                    <input
                      type="text"
                      {...register('name', {
                        required: 'Holiday name is required',
                        maxLength: { value: 100, message: 'Name cannot exceed 100 characters' },
                      })}
                      className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                    />
                    {errors.name && (
                      <p className="mt-2 text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      {...register('start_date', { required: 'Start date is required' })}
                      className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                    />
                    {errors.start_date && (
                      <p className="mt-2 text-sm text-red-500">{errors.start_date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
                    <input
                      type="date"
                      {...register('end_date', { validate: validateEndDate })}
                      className="mt-1 block w-full border border-gray-300 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-400 focus:border-blue-400 sm:text-sm"
                    />
                    {errors.end_date && (
                      <p className="mt-2 text-sm text-red-500">{errors.end_date.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Holiday Type</label>
                    <select
                      {...register('holiday_type', { required: 'Holiday type is required' })}
                      className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 py-2 px-3 text-gray-700 shadow-sm focus:border-blue-400 focus:ring-blue-200 sm:text-sm"
                    >
                      <option value="">Select Type</option>
                      <option value="school_holiday">School Holiday</option>
                      <option value="maternal_leave">Maternal Leave</option>
                      <option value="paternal_leave">Paternal Leave</option>
                      <option value="paid_leave">Paid Leave</option>
                      <option value="unpaid_leave">Unpaid Leave</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.holiday_type && (
                      <p className="mt-2 text-sm text-red-500">{errors.holiday_type.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Holiday Category</label>
                    <select
                      {...register('holiday_category', { required: 'Holiday category is required' })}
                      className="mt-1 block w-full rounded-sm border border-gray-300 bg-gray-50 py-2 px-3 text-gray-700 shadow-sm focus:border-blue-400 focus:ring-blue-200 sm:text-sm"
                    >
                      <option value="">Select Category</option>
                      <option value="all">All</option>
                      <option value="women_only">Women Only</option>
                      <option value="men_only">Men Only</option>
                      <option value="staff_only">Staff Only</option>
                      <option value="students_only">Students Only</option>
                    </select>
                    {errors.holiday_category && (
                      <p className="mt-2 text-sm text-red-500">{errors.holiday_category.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Active</label>
                    <input
                      type="checkbox"
                      {...register('is_active')}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-400 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowHolidayModal(false);
                        setEditingHolidayId(null);
                        reset({ name: '', start_date: '', end_date: '', holiday_type: 'school_holiday', holiday_category: 'all', is_active: true });
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
                      {isLoading ? 'Saving...' : editingHolidayId ? 'Update Holiday' : 'Add Holiday'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SessionConfig;