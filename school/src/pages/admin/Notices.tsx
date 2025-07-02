import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Plus, Edit, Trash2, Eye } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../api';
import { format } from 'date-fns';

interface NoticeDetails {
  id: number;
  notice_id: string;
  title: string;
  content: string;
  notice_type: 'school' | 'staff' | 'students_parents' | 'specific_class';
  class_id?: number;
  section_id?: number;
  class_name?: string;
  section_name?: string;
  academic_session_id: number;
  academic_session_name: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface Class {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
  class_id: number;
}

interface AcademicSession {
  id: number;
  name: string;
}

const noticeTypes = [
  { value: 'school', label: 'Entire School' },
  { value: 'staff', label: 'Staff Only' },
  { value: 'students_parents', label: 'Students and Parents' },
  { value: 'specific_class', label: 'Specific Class/Section' },
];

const Notices: React.FC = () => {
  const [notices, setNotices] = useState<NoticeDetails[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeDetails | null>(null);
  const [noticeFormState, setNoticeFormState] = useState<Partial<NoticeDetails>>({
    notice_type: 'school',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingNotice, setViewingNotice] = useState<NoticeDetails | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Only fetch classes, sections, and sessions - skip notices API
        const [classesRes, sessionsRes] = await Promise.all([
          api.get('/school/settings/classes/'),
          api.get('/school/settings/sessions/', { params: { status: 'active' } }),
        ]);

        const allSections: Section[] = [];
        for (const classItem of classesRes.data || []) {
          try {
            const sectionsRes = await api.get(`/school/settings/classes/${classItem.id}/sections/`);
            allSections.push(...(sectionsRes.data || []));
          } catch (err) {
            console.warn(`Failed to fetch sections for class ${classItem.id}:`, err);
          }
        }
        
        // Mock notices data
        const mockNotices: NoticeDetails[] = [
          {
            id: 1,
            notice_id: 'NOTICE-001',
            title: 'Welcome to the New Academic Year',
            content: 'We are excited to welcome all students to the new academic year. Please check the calendar for important dates.',
            notice_type: 'school',
            academic_session_id: sessionsRes.data[0]?.id || 1,
            academic_session_name: sessionsRes.data[0]?.name || '2025-2026',
            created_by_name: 'Admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          },
          {
            id: 2,
            notice_id: 'NOTICE-002',
            title: 'Staff Meeting',
            content: 'All staff members are requested to attend a meeting on Friday at 3 PM in the conference room.',
            notice_type: 'staff',
            academic_session_id: sessionsRes.data[0]?.id || 1,
            academic_session_name: sessionsRes.data[0]?.name || '2025-2026',
            created_by_name: 'Admin',
            created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            updated_at: new Date(Date.now() - 86400000).toISOString(),
            is_active: true
          }
        ];

        setNotices(mockNotices);
        setClasses(classesRes.data || []);
        setSections(allSections);
        setSessions(sessionsRes.data || []);
        setNoticeFormState(prev => ({ ...prev, academic_session_id: sessionsRes.data[0]?.id }));
      } catch (err) {
        setError('Failed to load data: ' + (err.response?.data?.detail || err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNoticeInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNoticeFormState(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeFormState.title || !noticeFormState.content || !noticeFormState.academic_session_id) {
      alert('Please fill Title, Content, and Academic Session.');
      return;
    }
    if (noticeFormState.notice_type === 'specific_class' && !noticeFormState.class_id) {
      alert('Please select a class for Specific Class/Section notice.');
      return;
    }

    try {
      setLoading(true);
      
      // Instead of API calls, handle data client-side
      if (editingNotice) {
        // Update existing notice
        const updatedNotice = {
          ...editingNotice,
          ...noticeFormState,
          updated_at: new Date().toISOString()
        };
        
        // Add class and section names if specific class
        if (updatedNotice.notice_type === 'specific_class' && updatedNotice.class_id) {
          const selectedClass = classes.find(c => c.id === Number(updatedNotice.class_id));
          updatedNotice.class_name = selectedClass?.name || '';
          
          if (updatedNotice.section_id) {
            const selectedSection = sections.find(s => s.id === Number(updatedNotice.section_id));
            updatedNotice.section_name = selectedSection?.name || '';
          } else {
            updatedNotice.section_name = '';
          }
        }
        
        setNotices(prev => prev.map(n => n.id === editingNotice.id ? updatedNotice : n));
      } else {
        // Create new notice
        const newNotice: NoticeDetails = {
          id: Math.max(0, ...notices.map(n => n.id)) + 1,
          notice_id: `NOTICE-${Date.now()}`,
          title: noticeFormState.title || '',
          content: noticeFormState.content || '',
          notice_type: noticeFormState.notice_type as any,
          academic_session_id: Number(noticeFormState.academic_session_id),
          academic_session_name: sessions.find(s => s.id === Number(noticeFormState.academic_session_id))?.name || '',
          created_by_name: 'Current User', // Replace with actual user name
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        };
        
        // Add class and section info if specific class
        if (newNotice.notice_type === 'specific_class' && noticeFormState.class_id) {
          newNotice.class_id = Number(noticeFormState.class_id);
          const selectedClass = classes.find(c => c.id === newNotice.class_id);
          newNotice.class_name = selectedClass?.name || '';
          
          if (noticeFormState.section_id) {
            newNotice.section_id = Number(noticeFormState.section_id);
            const selectedSection = sections.find(s => s.id === newNotice.section_id);
            newNotice.section_name = selectedSection?.name || '';
          }
        }
        
        setNotices(prev => [newNotice, ...prev]);
      }
      
      setShowNoticeForm(false);
      setEditingNotice(null);
      setNoticeFormState({ notice_type: 'school', academic_session_id: sessions[0]?.id });
    } catch (err) {
      setError('Failed to save notice: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotice = async (noticeId: number) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        // Client-side deletion without API call
        setNotices(prev => prev.filter(n => n.id !== noticeId));
      } catch (err) {
        setError('Failed to delete notice: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const filteredNotices = useMemo(() => {
    return notices.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [notices]);

  const renderNoticeDetail = () => {
    if (!viewingNotice) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <Card
          title={viewingNotice.title}
          className="w-full max-w-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {noticeTypes.find(t => t.value === viewingNotice.notice_type)?.label}
                </span>
                {viewingNotice.notice_type === 'specific_class' && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {viewingNotice.class_name}{viewingNotice.section_name ? ` - ${viewingNotice.section_name}` : ''}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {format(new Date(viewingNotice.created_at), 'MMM dd, yyyy HH:mm')}
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap">{viewingNotice.content}</div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>Posted by: {viewingNotice.created_by_name}</div>
                <div>Academic Session: {viewingNotice.academic_session_name}</div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setViewingNotice(null)}>Close</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderNoticeForm = () => {
    const availableSections = noticeFormState.class_id
      ? sections.filter(s => s.class_id === noticeFormState.class_id)
      : [];

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <Card
          title={editingNotice ? 'Edit Notice' : 'Create Notice'}
          className="w-full max-w-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
        >
          <form onSubmit={handleSaveNotice} className="space-y-4 p-3">
            <div>
              <label htmlFor="title" className="block text-sm font-medium">Title*</label>
              <input
                type="text"
                name="title"
                id="title"
                value={noticeFormState.title || ''}
                onChange={handleNoticeInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium">Content*</label>
              <textarea
                name="content"
                id="content"
                value={noticeFormState.content || ''}
                onChange={handleNoticeInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                rows={5}
                required
              />
            </div>
            <div>
              <label htmlFor="notice_type" className="block text-sm font-medium">Notice Type*</label>
              <select
                name="notice_type"
                id="notice_type"
                value={noticeFormState.notice_type}
                onChange={handleNoticeInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                {noticeTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="academic_session_id" className="block text-sm font-medium">Academic Session*</label>
              <select
                name="academic_session_id"
                id="academic_session_id"
                value={noticeFormState.academic_session_id || ''}
                onChange={handleNoticeInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                {sessions.map(session => (
                  <option key={session.id} value={session.id}>{session.name}</option>
                ))}
              </select>
            </div>
            {noticeFormState.notice_type === 'specific_class' && (
              <>
                <div>
                  <label htmlFor="class_id" className="block text-sm font-medium">Class*</label>
                  <select
                    name="class_id"
                    id="class_id"
                    value={noticeFormState.class_id || ''}
                    onChange={handleNoticeInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="section_id" className="block text-sm font-medium">Section (Optional)</label>
                  <select
                    name="section_id"
                    id="section_id"
                    value={noticeFormState.section_id || ''}
                    onChange={handleNoticeInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    disabled={!noticeFormState.class_id}
                  >
                    <option value="">All Sections</option>
                    {availableSections.map(section => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="flex justify-end space-x-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setShowNoticeForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">{editingNotice ? 'Save Changes' : 'Create Notice'}</Button>
            </div>
          </form>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <Bell size={28} className="mr-3 text-blue-600" /> Notices Management
        </h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setEditingNotice(null);
            setNoticeFormState({ notice_type: 'school', academic_session_id: sessions[0]?.id });
            setShowNoticeForm(true);
          }}
        >
          Create Notice
        </Button>
      </div>
      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {showNoticeForm && renderNoticeForm()}
      {viewingNotice && renderNoticeDetail()}
      <Card title="All Notices">
        {filteredNotices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotices.map(notice => (
                  <tr key={notice.id}>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{notice.title}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {noticeTypes.find(t => t.value === notice.notice_type)?.label}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {notice.notice_type === 'specific_class'
                        ? `${notice.class_name}${notice.section_name ? ` - ${notice.section_name}` : ''}`
                        : noticeTypes.find(t => t.value === notice.notice_type)?.label}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{notice.created_by_name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(notice.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => setViewingNotice(notice)}
                        title="View Notice"
                      >
                        <Eye size={16} className="text-green-600" />
                      </Button>
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => {
                          setEditingNotice(notice);
                          setNoticeFormState(notice);
                          setShowNoticeForm(true);
                        }}
                        title="Edit Notice"
                      >
                        <Edit size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => handleDeleteNotice(notice.id)}
                        title="Delete Notice"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notices</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first notice.</p>
            <div className="mt-6">
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingNotice(null);
                  setNoticeFormState({ notice_type: 'school', academic_session_id: sessions[0]?.id });
                  setShowNoticeForm(true);
                }}
              >
                Create Notice
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Notices;