import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, Filter, Edit, Trash2, Users } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../api';
import { format } from 'date-fns';

interface EventDetails {
  id: number;
  name: string;
  description: string;
  event_type: 'sports' | 'cultural' | 'academic' | 'other';
  academic_session: { id: number; name: string };
  start_date: string;
  end_date: string | null;
  is_open_for_applications: boolean;
  number_of_participants: number;
  assignments?: EventAssignmentDetails[]; // Add assignments
}

interface EventAssignmentDetails {
  id: number;
  event: EventDetails;
  student: { id: string; user_name: string; user_id?: number };
  is_active: boolean;
  assigned_at: string;
  remarks: string;
}

interface Student {
  id: string;
  user_name: string;
  class_name: string;
  section_name: string;
  user_id?: number;
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

const eventTypes = [
  { value: 'sports', label: 'Sports Meet' },
  { value: 'cultural', label: 'Cultural Event' },
  { value: 'academic', label: 'Academic Event' },
  { value: 'other', label: 'Other' }
];

const Events: React.FC = () => {
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sessions, setSessions] = useState<{ id: number; name: string }[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventDetails | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventDetails | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<{ [key: string]: boolean }>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [eventFormState, setEventFormState] = useState<Partial<EventDetails>>({ event_type: 'other' });
  const [classFilter, setClassFilter] = useState<number | null>(null);
  const [sectionFilter, setSectionFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsRes, classesRes, sessionsRes] = await Promise.all([
          api.get('/students/'),
          api.get('/school/settings/classes/'),
          api.get('/school/settings/sessions/', { params: { status: 'active' } })
        ]);
        
        // Use mock events data since the API is not working
        const mockEvents = [
          {
            id: 1,
            name: 'Annual Sports Day',
            description: 'Annual sports competition',
            event_type: 'sports',
            academic_session: { id: sessionsRes.data[0]?.id || 1, name: sessionsRes.data[0]?.name || '2025-2026' },
            start_date: '2025-07-15',
            end_date: '2025-07-16',
            is_open_for_applications: true,
            number_of_participants: 0,
            assignments: []
          },
          {
            id: 2,
            name: 'Science Exhibition',
            description: 'Annual science exhibition',
            event_type: 'academic',
            academic_session: { id: sessionsRes.data[0]?.id || 1, name: sessionsRes.data[0]?.name || '2025-2026' },
            start_date: '2025-08-10',
            end_date: null,
            is_open_for_applications: true,
            number_of_participants: 0,
            assignments: []
          }
        ];
        
        // Set mock events data
        const eventsData = mockEvents;

        const allSections: Section[] = [];
        for (const classItem of classesRes.data || []) {
          try {
            const sectionsRes = await api.get(`/school/settings/classes/${classItem.id}/sections/`);
            allSections.push(...(sectionsRes.data || []));
          } catch (err) {
            console.warn(`Failed to fetch sections for class ${classItem.id}:`, err);
          }
        }
        setEvents(eventsData);
        setStudents(studentsRes.data || []);
        setClasses(classesRes.data || []);
        setSections(allSections);
        setSessions(sessionsRes.data || []);
        setEventFormState(prev => ({ ...prev, academic_session: sessionsRes.data[0]?.id }));
      } catch (err) {
        setError('Failed to load data: ' + (err.response?.data?.detail || err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEvent && showAssignModal) {
      console.log('Selected event:', selectedEvent);
      console.log('Selected event assignments:', selectedEvent.assignments);
      const currentAssignments: { [key: string]: boolean } = {};
      students.forEach(student => {
        currentAssignments[student.id] = false;
      });

      if (selectedEvent.assignments) {
        selectedEvent.assignments.forEach(assignment => {
          if (assignment.is_active && assignment.student) {
            const studentId = assignment.student.id || (assignment.student.user_id && String(assignment.student.user_id));
            if (studentId && students.some(s => s.id === studentId || (s.user_id && s.user_id === assignment.student.user_id))) {
              currentAssignments[studentId] = true;
            }
          }
        });
      }

      console.log('Students:', students.map(s => ({ id: s.id, user_id: s.user_id, name: s.user_name })));
      console.log('Setting pending assignments:', currentAssignments);
      setPendingAssignments(currentAssignments);
      setHasChanges(false);
      setClassFilter(null);
      setSectionFilter(null);
    }
  }, [selectedEvent, showAssignModal, students]);

  const handleEventInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventFormState(prev => ({
      ...prev,
      [name]: name === 'is_open_for_applications' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormState.name || !eventFormState.start_date || !eventFormState.academic_session) {
      alert('Please fill Name, Start Date, and Academic Session.');
      return;
    }
    try {
      setLoading(true);
      // Mock API response with client-side data
      if (editingEvent) {
        // Update existing event
        const updatedEvent = {
          ...editingEvent,
          ...eventFormState,
          academic_session: typeof eventFormState.academic_session === 'object' 
            ? eventFormState.academic_session 
            : { id: eventFormState.academic_session, name: sessions.find(s => s.id === eventFormState.academic_session)?.name || '' }
        };
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? updatedEvent : e));
      } else {
        // Create new event
        const newEvent = {
          ...eventFormState,
          id: Math.max(0, ...events.map(e => e.id)) + 1,
          academic_session: typeof eventFormState.academic_session === 'object' 
            ? eventFormState.academic_session 
            : { id: eventFormState.academic_session, name: sessions.find(s => s.id === eventFormState.academic_session)?.name || '' },
          number_of_participants: 0,
          assignments: []
        };
        setEvents(prev => [newEvent, ...prev]);
      }
      setShowEventForm(false);
      setEditingEvent(null);
      setEventFormState({ event_type: 'other', academic_session: sessions[0]?.id });
    } catch (err) {
      setError('Failed to save event: ' + (err.response?.data?.detail || err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        // Client-side deletion without API call
        setEvents(prev => prev.filter(e => e.id !== eventId));
      } catch (err) {
        setError('Failed to delete event: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const handleBatchAssign = async (eventId: number) => {
    try {
      setLoading(true);
      const toAdd: string[] = [];
      const toRemove: string[] = [];
      const currentAssignments: { [key: string]: number } = {};

      console.log('Students available:', students.map(s => ({ id: s.id, user_id: s.user_id, name: s.user_name })));
      console.log('Selected event:', selectedEvent);

      // Get current assignments
      if (selectedEvent?.assignments) {
        selectedEvent.assignments.forEach(assignment => {
          if (assignment.is_active && assignment.student) {
            const studentId = assignment.student.id;
            if (studentId) {
              currentAssignments[studentId] = assignment.id;
            }
          }
        });
      }

      // Determine which students to add or remove
      students.forEach(student => {
        const isAssigned = !!currentAssignments[student.id];
        const shouldBeAssigned = pendingAssignments[student.id] === true;

        if (!isAssigned && shouldBeAssigned) {
          toAdd.push(student.id);
        } else if (isAssigned && !shouldBeAssigned) {
          toRemove.push(student.id);
        }
      });

      console.log('To add:', toAdd, 'To remove:', toRemove);

      // Create a copy of the selected event
      const updatedEvent = {...selectedEvent};
      
      // Initialize assignments array if it doesn't exist
      if (!updatedEvent.assignments) {
        updatedEvent.assignments = [];
      }
      
      // Add new assignments
      const newAssignments = toAdd.map(studentId => {
        const student = students.find(s => s.id === studentId);
        if (!student) return null;
        
        return {
          id: Math.max(0, ...updatedEvent.assignments.map((a: any) => a.id || 0)) + 1,
          event: updatedEvent,
          student: {
            id: student.id,
            user_name: student.user_name,
            user_id: student.user_id
          },
          is_active: true,
          assigned_at: new Date().toISOString(),
          remarks: ''
        };
      }).filter(Boolean);
      
      // Add new assignments
      updatedEvent.assignments = [
        ...updatedEvent.assignments.filter((a: any) => 
          !toRemove.includes(a.student?.id)
        ),
        ...newAssignments
      ];
      
      // Update number of participants
      updatedEvent.number_of_participants = updatedEvent.assignments.filter(
        (a: any) => a.is_active
      ).length;
      
      // Update events state
      setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));
      setSelectedEvent(updatedEvent);
      
      // Update pending assignments
      const newPendingAssignments: { [key: string]: boolean } = {};
      students.forEach(student => {
        const isAssigned = updatedEvent.assignments.some(
          (a: any) => a.is_active && a.student && a.student.id === student.id
        );
        newPendingAssignments[student.id] = isAssigned;
      });
      
      setPendingAssignments(newPendingAssignments);
      setHasChanges(false);
      alert(`Successfully updated assignments: ${toAdd.length} added, ${toRemove.length} removed`);
    } catch (err) {
      console.error('Assignment error details:', err);
      setError('Failed to update assignments: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  }, [events]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (!classFilter) return true;
      const className = classes.find(c => c.id === classFilter)?.name;
      if (!sectionFilter) return student.class_name === className;
      const sectionName = sections.find(s => s.id === sectionFilter)?.name;
      return student.class_name === className && student.section_name === sectionName;
    });
  }, [students, classFilter, sectionFilter, classes, sections]);

  const renderEventForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card title={editingEvent ? 'Edit Event' : 'Create Event'} className="w-full max-w-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSaveEvent} className="space-y-4 p-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Event Name*</label>
            <input
              type="text"
              name="name"
              id="name"
              value={eventFormState.name || ''}
              onChange={handleEventInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              id="description"
              value={eventFormState.description || ''}
              onChange={handleEventInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="event_type" className="block text-sm font-medium">Event Type*</label>
            <select
              name="event_type"
              id="event_type"
              value={eventFormState.event_type}
              onChange={handleEventInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="academic_session" className="block text-sm font-medium">Academic Session*</label>
            <select
              name="academic_session"
              id="academic_session"
              value={eventFormState.academic_session || ''}
              onChange={handleEventInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              {sessions.map(session => (
                <option key={session.id} value={session.id}>{session.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium">Start Date*</label>
            <input
              type="date"
              name="start_date"
              id="start_date"
              value={eventFormState.start_date || ''}
              onChange={handleEventInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium">End Date (Optional)</label>
            <input
              type="date"
              name="end_date"
              id="end_date"
              value={eventFormState.end_date || ''}
              onChange={handleEventInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="is_open_for_applications" className="block text-sm font-medium">
              <input
                type="checkbox"
                name="is_open_for_applications"
                id="is_open_for_applications"
                checked={eventFormState.is_open_for_applications || false}
                onChange={handleEventInputChange}
                className="mr-2"
              />
              Open for Student Applications
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setShowEventForm(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{editingEvent ? 'Save Changes' : 'Create Event'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );

  const renderAssignModal = () => {
    if (!selectedEvent) return null;
    const availableSections = classFilter ? sections.filter(s => s.class_id === classFilter) : [];

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <Card title={`Assign Students to Event: ${selectedEvent.name}`} className="w-full max-w-4xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {loading && <div className="mb-4 p-2 bg-blue-50 text-blue-700 text-sm rounded-md">Processing...</div>}
            {error && <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Students</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="classFilter" className="block text-sm font-medium">Class</label>
                  <select
                    id="classFilter"
                    value={classFilter || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : null;
                      setClassFilter(value);
                      setSectionFilter(null);
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">All Classes</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sectionFilter" className="block text-sm font-medium">Section</label>
                  <select
                    id="sectionFilter"
                    value={sectionFilter || ''}
                    onChange={(e) => setSectionFilter(e.target.value ? parseInt(e.target.value) : null)}
                    disabled={!classFilter}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">All Sections</option>
                    {availableSections.map(section => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setClassFilter(null);
                      setSectionFilter(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
            <div className="border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assign</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => {
                      const assignment = selectedEvent.assignments?.find(
                        a =>
                          a.is_active &&
                          a.student &&
                          (a.student.id === student.id || (a.student.user_id && a.student.user_id === student.user_id))
                      );
                      return (
                        <tr key={student.id}>
                          <td className="px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              checked={pendingAssignments[student.id] === true}
                              disabled={loading}
                              onChange={(e) => {
                                setPendingAssignments(prev => ({
                                  ...prev,
                                  [student.id]: e.target.checked
                                }));
                                setHasChanges(true);
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900">{student.user_name}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{student.class_name}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">{student.section_name}</td>
                          <td className="px-3 py-2 text-sm">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                assignment ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {assignment ? 'Assigned' : 'Not Assigned'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                        No students found matching the selected filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            {hasChanges && (
              <Button variant="primary" onClick={() => handleBatchAssign(selectedEvent.id)} disabled={loading}>
                Update Assignments
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Close</Button>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <Calendar size={28} className="mr-3 text-blue-600" /> Events Management
        </h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setEditingEvent(null);
            setEventFormState({ event_type: 'other', academic_session: sessions[0]?.id });
            setShowEventForm(true);
          }}
        >
          Create Event
        </Button>
      </div>
      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {showEventForm && renderEventForm()}
      {showAssignModal && renderAssignModal()}
      <Card title="Upcoming Events">
        {filteredEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Name</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map(event => (
                  <tr key={event.id}>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{event.name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {eventTypes.find(t => t.value === event.event_type)?.label}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(event.start_date), 'MMM dd, yyyy')}
                      {event.end_date && ` - ${format(new Date(event.end_date), 'MMM dd, yyyy')}`}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{event.number_of_participants}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => {
                          setEditingEvent(event);
                          setEventFormState(event);
                          setShowEventForm(true);
                        }}
                        title="Edit Event"
                      >
                        <Edit size={16} className="text-blue-600" />
                      </Button>
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        title="Delete Event"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </Button>
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowAssignModal(true);
                        }}
                        title="Assign Students"
                      >
                        <Users size={16} className="text-indigo-600" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first event.</p>
            <div className="mt-6">
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingEvent(null);
                  setEventFormState({ event_type: 'other', academic_session: sessions[0]?.id });
                  setShowEventForm(true);
                }}
              >
                Create Event
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Events;