import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit, Trash2, Clock } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../api';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClassScheduleForm from './ClassScheduleForm';

interface SchoolTiming {
  id: number;
  start_time: string;
  end_time: string;
  periods_per_day: number;
  period_duration: number;
}

interface Break {
  id: number;
  break_type: 'short' | 'long';
  start_time: string;
  duration: number;
  order: number;
}

interface ClassSchedule {
  schedule_id: string;
  class_id: number;
  class_name: string;
  section_id?: number;
  section_name?: string;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  teacher_name: string;
  room_id?: number;
  room_name?: string;
  day_of_week: string;
  period_number: number;
  start_time: string;
  duration: number;
  is_active: boolean;
}

interface StaffDuty {
  duty_id: string;
  staff_id: number;
  staff_name: string;
  duty_type: string;
  location: string;
  day_of_week: string;
  start_time: string;
  duration: number;
  is_active: boolean;
}

interface ExamSchedule {
  exam_id: string;
  class_id: number;
  class_name: string;
  section_id?: number;
  section_name?: string;
  subject_id: number;
  subject_name: string;
  exam_date: string;
  start_time: string;
  duration: number;
  room_id?: number;
  room_name?: string;
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

interface Subject {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  name: string;
}

interface Room {
  id: number;
  name: string;
}

interface AcademicSession {
  id: number;
  name: string;
  status: string;
}

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dutyTypes = [
  { value: 'canteen', label: 'Canteen Duty' },
  { value: 'supervision', label: 'Supervision' },
  { value: 'library', label: 'Library Duty' },
  { value: 'other', label: 'Other' },
];

const ClassSchedule: React.FC = () => {
  const { user } = useAuth();
  const [schoolTiming, setSchoolTiming] = useState<SchoolTiming | null>(null);
  const [breaks, setBreaks] = useState<Break[]>([]);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [staffDuties, setStaffDuties] = useState<StaffDuty[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [activeTab, setActiveTab] = useState<'timing' | 'class' | 'duty' | 'exam'>('timing');
  const [showForm, setShowForm] = useState<'timing' | 'break' | 'class' | 'duty' | 'exam' | null>(null);
  const [formState, setFormState] = useState<any>({});
  const [editingItem, setEditingItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // First get active session
        const sessionsRes = await api.get('/school/settings/sessions/', { params: { status: 'active' } });
        setSessions(sessionsRes.data || []);
        const activeSessionId = sessionsRes.data.find(s => s.status === 'active')?.id;

        // Then fetch other data
        const [timingRes, breaksRes, classSchedulesRes, dutiesRes, examsRes, classesRes, subjectsRes] = await Promise.all([
          api.get('/school-timings/', { params: { academic_session_id: activeSessionId } }),
          api.get('/breaks/'),
          api.get('/class-schedules/', { params: { academic_session_id: activeSessionId } }),
          api.get('/staff-duties/', { params: { academic_session_id: activeSessionId } }),
          api.get('/exam-schedules/', { params: { academic_session_id: activeSessionId } }),
          api.get('/school/settings/classes/'),
          api.get('/school/settings/subjects/'),
        ]);

        // Fetch staff/teachers
        let teachersData: Teacher[] = [];
        try {
          const teachersRes = await api.get('/school/settings/staff/');
          teachersData = teachersRes.data.map(t => ({
            id: t.id,
            name: t.first_name + ' ' + t.last_name,
          }));
        } catch (err) {
          console.warn('Failed to fetch teachers:', err);
        }

        // Fetch rooms from buildings
        let allRooms: Room[] = [];
        try {
          const campusesRes = await api.get('/school/settings/campuses/');
          const buildingsPromises = campusesRes.data.map(campus =>
            api.get(`/school/settings/campuses/${campus.id}/buildings/`)
          );
          const buildingsResponses = await Promise.all(buildingsPromises);
          const allBuildings = buildingsResponses.flatMap(res => res.data || []);

          const roomsPromises = allBuildings.map(building =>
            api.get(`/school/settings/buildings/${building.id}/rooms/`)
          );
          const roomsResponses = await Promise.all(roomsPromises);
          allRooms = roomsResponses.flatMap(res => res.data || []);
        } catch (err) {
          console.warn('Failed to fetch rooms:', err);
        }

        const allSections: Section[] = [];
        for (const classItem of classesRes.data || []) {
          try {
            const sectionsRes = await api.get(`/school/settings/classes/${classItem.id}/sections/`);
            allSections.push(...(sectionsRes.data || []));
          } catch (err) {
            console.warn(`Failed to fetch sections for class ${classItem.id}:`, err);
          }
        }

        setSchoolTiming(timingRes.data[0] || null);
        setBreaks(breaksRes.data || []);
        setClassSchedules(classSchedulesRes.data || []);
        setStaffDuties(dutiesRes.data || []);
        setExamSchedules(examsRes.data || []);
        setClasses(classesRes.data || []);
        setSections(allSections);
        setSubjects(subjectsRes.data || []);
        setTeachers(teachersData);
        setRooms(allRooms);
        setFormState({ academic_session_id: activeSessionId });
      } catch (err) {
        const errorMessage = 'Failed to load data: ' + (err.response?.data?.detail || err.message || 'Unknown error');
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper function to calculate period start time with breaks
  const calculatePeriodStartTime = (periodNumber: number): string => {
    if (!schoolTiming) return '';
    
    // Convert school start time to minutes since midnight
    const [hours, minutes] = schoolTiming.start_time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    
    // Sort breaks by order
    const sortedBreaks = [...breaks].sort((a, b) => a.order - b.order);
    
    // For each period before the target period
    for (let period = 1; period < periodNumber; period++) {
      // Add period duration
      totalMinutes += schoolTiming.period_duration;
      
      // Check if there's a break after this period based on break type and order
      const breakAfterPeriod = sortedBreaks.find(b => {
        // For short breaks with order 1, place after period 2
        if (b.break_type === 'short' && b.order === 1 && period === 2) {
          return true;
        }
        // For long breaks, place after period 4
        if (b.break_type === 'long' && period === 4) {
          return true;
        }
        // For short breaks with order 2, place after period 5
        if (b.break_type === 'short' && b.order === 2 && period === 5) {
          return true;
        }
        return false;
      });
      
      if (breakAfterPeriod) {
        totalMinutes += breakAfterPeriod.duration;
      }
    }
    
    // Convert back to HH:MM format
    const resultHours = Math.floor(totalMinutes / 60);
    const resultMinutes = totalMinutes % 60;
    return `${resultHours.toString().padStart(2, '0')}:${resultMinutes.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Update form state with the new value
    setFormState(prev => {
      const newState = { ...prev, [name]: value };
      
      // Auto-calculate start time when period_number changes for class schedules
      if (name === 'period_number' && schoolTiming && showForm === 'class') {
        const periodNumber = parseInt(value);
        if (!isNaN(periodNumber) && periodNumber > 0) {
          // Calculate start time using the helper function
          newState.start_time = calculatePeriodStartTime(periodNumber);
          newState.duration = schoolTiming.period_duration;
        }
      }
      
      return newState;
    });
  };

  const handleSaveSchoolTiming = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!user || !user.school_id) {
        const errorMessage = 'Could not determine school ID from user context';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const activeSession = sessions.find(s => s.status === 'active');
      if (!activeSession) {
        const errorMessage = 'No active academic session found';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const payload = {
        ...formState,
        school_id: user.school_id,
        academic_session_id: parseInt(formState.academic_session_id) || activeSession.id,
        periods_per_day: parseInt(formState.periods_per_day) || 8,
        period_duration: parseInt(formState.period_duration) || 40,
      };

      console.log('Sending school timing payload:', payload);

      if (editingItem) {
        const response = await api.put(`/school-timings/${editingItem.id}/`, payload);
        setSchoolTiming(response.data);
        toast.success('School timing updated successfully');
      } else {
        const response = await api.post('/school-timings/', payload);
        setSchoolTiming(response.data);
        toast.success('School timing created successfully');
      }
      setShowForm(null);
      setEditingItem(null);
      setFormState({ academic_session_id: activeSession.id });
    } catch (err) {
      const errorMessage = 'Failed to save school timing: ' + (err.response?.data?.detail || err.message || 'Unknown error');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add this helper function to convert time strings to Date objects for comparison
const isTimeWithinRange = (timeStr: string, startTime: string, endTime: string): boolean => {
  const time = new Date(`1970-01-01T${timeStr}:00`);
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  return time >= start && time <= end;
};

  // Updated handleSaveBreak function
const handleSaveBreak = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    setLoading(true);
    if (!schoolTiming) {
      const errorMessage = 'School timing must be configured before adding breaks';
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    // Ensure start_time is in HH:MM:SS format
    const formattedStartTime = formState.start_time.includes(':') && formState.start_time.split(':').length === 2
      ? `${formState.start_time}:00`
      : formState.start_time;

    // Validate start_time
    const time = new Date(`1970-01-01T${formattedStartTime}`);
    const start = new Date(`1970-01-01T${schoolTiming.start_time}`);
    const end = new Date(`1970-01-01T${schoolTiming.end_time}`);
    if (time < start || time > end) {
      const errorMessage = `Break start time must be between ${schoolTiming.start_time} and ${schoolTiming.end_time}`;
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    const payload = {
      ...formState,
      start_time: formattedStartTime, // Use formatted time
      school_timing_id: schoolTiming.id,
      duration: parseInt(formState.duration) || 10,
      order: parseInt(formState.order) || breaks.length + 1,
    };

    console.log('Sending break payload:', payload);

    if (editingItem) {
      const response = await api.put(`/breaks/${editingItem.id}/`, payload);
      setBreaks(prev => prev.map(b => (b.id === editingItem.id ? response.data : b)));
      toast.success('Break updated successfully');
    } else {
      const response = await api.post('/breaks/', payload);
      setBreaks(prev => [...prev, response.data]);
      toast.success('Break created successfully');
    }

    setShowForm(null);
    setEditingItem(null);
    setFormState({ academic_session_id: sessions.find(s => s.status === 'active')?.id });
  } catch (err: any) {
    const errorMessage = err.response?.data
      ? typeof err.response.data === 'string'
        ? err.response.data
        : Object.values(err.response.data).flat().join(' ')
      : 'Failed to save break: Unknown error';
    setError(errorMessage);
    toast.error(errorMessage);
    console.error('Break save error:', err.response?.data || err.message);
  } finally {
    setLoading(false);
  }
};

  const handleSaveClassSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!user || !user.school_id) {
        const errorMessage = 'Could not determine school ID from user context';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Check if we have multiple days selected
      const selectedDays = formState.selected_days || [];
      const daysToProcess = selectedDays.length > 0 ? selectedDays : [formState.day_of_week];
      
      if (daysToProcess.length === 0 || !daysToProcess[0]) {
        const errorMessage = 'Please select at least one day of the week';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Create a base payload without day_of_week
      const basePayload = {
        ...formState,
        school_id: user.school_id,
        period_number: parseInt(formState.period_number) || 1,
        duration: parseInt(formState.duration) || schoolTiming?.period_duration || 40,
      };
      
      // Remove selected_days from payload as it's not needed by the API
      delete basePayload.selected_days;
      
      // Handle room_name instead of room_id if provided
      if (basePayload.room_name && !basePayload.room_id) {
        // If room_name is provided but no room_id, we'll use room_name directly
        // The backend will need to handle this appropriately
        delete basePayload.room_id;
      } else if (!basePayload.room_name && !basePayload.room_id) {
        // If neither is provided, remove both fields
        delete basePayload.room_id;
        delete basePayload.room_name;
      }

      // For editing, just update the single record
      if (editingItem) {
        const payload = { ...basePayload, day_of_week: formState.day_of_week };
        console.log('Sending class schedule update payload:', payload);
        const response = await api.put(`/class-schedules/${editingItem.schedule_id}/`, payload);
        setClassSchedules(prev => prev.map(s => (s.schedule_id === editingItem.schedule_id ? response.data : s)));
        toast.success('Class schedule updated successfully');
      } else {
        // For creating, handle multiple days if selected
        const createdSchedules = [];
        
        for (const day of daysToProcess) {
          const payload = { ...basePayload, day_of_week: day };
          console.log(`Sending class schedule payload for ${day}:`, payload);
          
          const response = await api.post('/class-schedules/', payload);
          createdSchedules.push(response.data);
        }
        
        setClassSchedules(prev => [...prev, ...createdSchedules]);
        toast.success(`Created ${createdSchedules.length} class schedule(s) successfully`);
      }
      
      setShowForm(null);
      setEditingItem(null);
      setFormState({ academic_session_id: sessions.find(s => s.status === 'active')?.id });
    } catch (err) {
      const errorMessage = 'Failed to save class schedule: ' + (err.response?.data?.detail || err.message || 'Unknown error');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStaffDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!user || !user.school_id) {
        const errorMessage = 'Could not determine school ID from user context';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const payload = {
        ...formState,
        school_id: user.school_id,
        duration: parseInt(formState.duration) || 30,
      };

      console.log('Sending staff duty payload:', payload);

      if (editingItem) {
        const response = await api.put(`/staff-duties/${editingItem.duty_id}/`, payload);
        setStaffDuties(prev => prev.map(d => (d.duty_id === editingItem.duty_id ? response.data : d)));
        toast.success('Staff duty updated successfully');
      } else {
        const response = await api.post('/staff-duties/', payload);
        setStaffDuties(prev => [...prev, response.data]);
        toast.success('Staff duty created successfully');
      }
      setShowForm(null);
      setEditingItem(null);
      setFormState({ academic_session_id: sessions.find(s => s.status === 'active')?.id });
    } catch (err) {
      const errorMessage = 'Failed to save staff duty: ' + (err.response?.data?.detail || err.message || 'Unknown error');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExamSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (!user || !user.school_id) {
        const errorMessage = 'Could not determine school ID from user context';
        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      const payload = {
        ...formState,
        school_id: user.school_id,
        duration: parseInt(formState.duration) || 120,
      };

      console.log('Sending exam schedule payload:', payload);

      if (editingItem) {
        const response = await api.put(`/exam-schedules/${editingItem.exam_id}/`, payload);
        setExamSchedules(prev => prev.map(e => (e.exam_id === editingItem.exam_id ? response.data : e)));
        toast.success('Exam schedule updated successfully');
      } else {
        const response = await api.post('/exam-schedules/', payload);
        setExamSchedules(prev => [...prev, response.data]);
        toast.success('Exam schedule created successfully');
      }
      setShowForm(null);
      setEditingItem(null);
      setFormState({ academic_session_id: sessions.find(s => s.status === 'active')?.id });
    } catch (err) {
      const errorMessage = 'Failed to save exam schedule: ' + (err.response?.data?.detail || err.message || 'Unknown error');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerateSchedule = async () => {
    if (!schoolTiming) {
      const errorMessage = 'Please configure school timing first.';
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    try {
      setLoading(true);
      const response = await api.post('/class-schedules/auto-generate/', {
        academic_session_id: sessions.find(s => s.status === 'active')?.id,
        school_id: user?.school_id,
      });
      setClassSchedules(response.data.schedules || []);
      toast.success(response.data.message || 'Class schedule auto-generated successfully');
    } catch (err) {
      const errorMessage = 'Failed to auto-generate schedule: ' + (err.response?.data?.detail || err.message || 'Unknown error');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'break' | 'class' | 'duty' | 'exam', id: string | number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        setLoading(true);
        if (type === 'break') {
          await api.delete(`/breaks/${id}/`);
          setBreaks(prev => prev.filter(b => b.id !== id));
          toast.success('Break deleted successfully');
        } else if (type === 'class') {
          await api.delete(`/class-schedules/${id}/`);
          setClassSchedules(prev => prev.filter(s => s.schedule_id !== id));
          toast.success('Class schedule deleted successfully');
        } else if (type === 'duty') {
          await api.delete(`/staff-duties/${id}/`);
          setStaffDuties(prev => prev.filter(d => d.duty_id !== id));
          toast.success('Staff duty deleted successfully');
        } else if (type === 'exam') {
          await api.delete(`/exam-schedules/${id}/`);
          setExamSchedules(prev => prev.filter(e => e.exam_id !== id));
          toast.success('Exam schedule deleted successfully');
        }
      } catch (err) {
        const errorMessage = 'Failed to delete item: ' + (err.response?.data?.detail || err.message || 'Unknown error');
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderForm = () => {
    if (!showForm) return null;
    const availableSections = formState.class_id
      ? sections.filter(s => s.class_id === Number(formState.class_id))
      : [];

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <Card title={editingItem ? `Edit ${showForm.charAt(0).toUpperCase() + showForm.slice(1)}` : `Create ${showForm.charAt(0).toUpperCase() + showForm.slice(1)}`} className="w-full max-w-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={
            showForm === 'timing' ? handleSaveSchoolTiming :
            showForm === 'break' ? handleSaveBreak :
            showForm === 'class' ? handleSaveClassSchedule :
            showForm === 'duty' ? handleSaveStaffDuty :
            handleSaveExamSchedule
          } className="space-y-4 p-3">
            {showForm === 'timing' && (
              <>
                <div>
                  <label className="block text-sm font-medium">Start Time</label>
                  <input type="time" name="start_time" value={formState.start_time || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">End Time</label>
                  <input type="time" name="end_time" value={formState.end_time || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Periods Per Day</label>
                  <input type="number" name="periods_per_day" value={formState.periods_per_day || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Period Duration (minutes)</label>
                  <input type="number" name="period_duration" value={formState.period_duration || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" min="1" required />
                </div>
              </>
            )}
            {showForm === 'break' && (
              <>
                <div>
                  <label className="block text-sm font-medium">Break Type</label>
                  <select name="break_type" value={formState.break_type || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required>
                    <option value="short">Short Break</option>
                    <option value="long">Long Break</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Start Time</label>
                  <input type="time" name="start_time" value={formState.start_time || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Duration (minutes)</label>
                  <input type="number" name="duration" value={formState.duration || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Order</label>
                  <input type="number" name="order" value={formState.order || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" min="1" required />
                </div>
              </>
            )}
            {showForm === 'class' && (
              <ClassScheduleForm
                formState={formState}
                handleInputChange={handleInputChange}
                classes={classes}
                sections={sections}
                subjects={subjects}
                teachers={teachers}
                rooms={rooms}
                daysOfWeek={daysOfWeek}
                schoolTiming={schoolTiming}
              />
            )}
            {showForm === 'duty' && (
              <>
                <div>
                  <label className="block text-sm font-medium">Staff</label>
                  <select name="staff_id" value={formState.staff_id || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required>
                    <option value="">Select Staff</option>
                    {teachers.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Duty Type</label>
                  <select name="duty_type" value={formState.duty_type || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required>
                    {dutyTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Location</label>
                  <input type="text" name="location" value={formState.location || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Day of Week</label>
                  <select name="day_of_week" value={formState.day_of_week || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required>
                    {daysOfWeek.map(day => <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Start Time</label>
                  <input type="time" name="start_time" value={formState.start_time || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Duration (minutes)</label>
                  <input type="number" name="duration" value={formState.duration || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" min="1" required />
                </div>
              </>
            )}
            {showForm === 'exam' && (
              <>
                <div>
                  <label className="block text-sm font-medium">Class</label>
                  <select name="class_id" value={formState.class_id || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required>
                    <option value="">Select Class</option>
                    {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Section (Optional)</label>
                  <select name="section_id" value={formState.section_id || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" disabled={!formState.class_id}>
                    <option value="">All Sections</option>
                    {availableSections.map(section => <option key={section.id} value={section.id}>{section.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Subject</label>
                  <select name="subject_id" value={formState.subject_id || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required>
                    <option value="">Select Subject</option>
                    {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Exam Date</label>
                  <input type="date" name="exam_date" value={formState.exam_date || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Start Time</label>
                  <input type="time" name="start_time" value={formState.start_time || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Duration (minutes)</label>
                  <input type="number" name="duration" value={formState.duration || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">Room (Optional)</label>
                  <select name="room_id" value={formState.room_id || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                    <option value="">Select Room</option>
                    {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
                  </select>
                </div>
              </>
            )}
            <div className="flex justify-end space-x-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(null)}>Cancel</Button>
              <Button type="submit" variant="primary">{editingItem ? 'Save Changes' : 'Create'}</Button>
            </div>
          </form>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <Calendar size={28} className="mr-3 text-blue-600" /> Schedule Management
        </h1>
        <div className="flex space-x-2">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingItem(null);
              setFormState({ academic_session_id: sessions.find(s => s.status === 'active')?.id });
              setShowForm(activeTab);
            }}
          >
            Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </Button>
          {activeTab === 'class' && (
            <Button variant="primary" onClick={handleAutoGenerateSchedule}>
              Auto-Generate Class Schedule
            </Button>
          )}
        </div>
      </div>
      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      <div className="flex space-x-4 border-b">
        <button className={`pb-2 px-4 ${activeTab === 'timing' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`} onClick={() => setActiveTab('timing')}>
          School Timing
        </button>
        <button className={`pb-2 px-4 ${activeTab === 'class' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`} onClick={() => setActiveTab('class')}>
          Class Schedules
        </button>
        <button className={`pb-2 px-4 ${activeTab === 'duty' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`} onClick={() => setActiveTab('duty')}>
          Staff Duties
        </button>
        <button className={`pb-2 px-4 ${activeTab === 'exam' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`} onClick={() => setActiveTab('exam')}>
          Exam Schedules
        </button>
      </div>
      {showForm && renderForm()}
      {activeTab === 'timing' && (
        <Card title="School Timing & Breaks">
          {schoolTiming ? (
            <div>
              <div className="p-4">
                <h3 className="text-lg font-medium">School Timing</h3>
                <p>Start Time: {schoolTiming.start_time}</p>
                <p>End Time: {schoolTiming.end_time}</p>
                <p>Periods Per Day: {schoolTiming.periods_per_day}</p>
                <p>Period Duration: {schoolTiming.period_duration} minutes</p>
                <Button
                  variant="outline"
                  icon={<Edit size={16} />}
                  onClick={() => {
                    setEditingItem(schoolTiming);
                    setFormState(schoolTiming);
                    setShowForm('timing');
                  }}
                >
                  Edit Timing
                </Button>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Breaks</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Plus size={16} />}
                    onClick={() => {
                      setEditingItem(null);
                      setFormState({
                        break_type: 'short',
                        start_time: '',
                        duration: 10,
                        order: breaks.length + 1,
                      });
                      setShowForm('break');
                    }}
                  >
                    Add Break
                  </Button>
                </div>
                {breaks.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {breaks.map(b => (
                        <tr key={b.id}>
                          <td className="px-3 py-3 whitespace-nowrap text-sm">{b.break_type.charAt(0).toUpperCase() + b.break_type.slice(1)}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm">{b.start_time}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm">{b.duration} minutes</td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm">{b.order}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm space-x-1">
                            <Button variant="icon" size="sm" onClick={() => { setEditingItem(b); setFormState(b); setShowForm('break'); }}><Edit size={16} className="text-blue-600" /></Button>
                            <Button variant="icon" size="sm" onClick={() => handleDelete('break', b.id)}><Trash2 size={16} className="text-red-600" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No breaks configured. Click "Add Break" to create one.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No school timing configured</h3>
              <p className="mt-1 text-sm text-gray-500">Configure school timing to start scheduling.</p>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => {
                  setEditingItem(null);
                  setFormState({ academic_session_id: sessions.find(s => s.status === 'active')?.id });
                  setShowForm('timing');
                }}
              >
                Configure Timing
              </Button>
            </div>
          )}
        </Card>
      )}
      {activeTab === 'class' && (
        <Card title="Class Routines">
          {classSchedules.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classSchedules.map(s => (
                  <tr key={s.schedule_id}>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{s.class_name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{s.section_name || 'All Sections'}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{s.subject_name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{s.teacher_name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{s.day_of_week.charAt(0).toUpperCase() + s.day_of_week.slice(1)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{s.period_number}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{s.start_time} ({s.duration} min)</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm space-x-1">
                      <Button variant="icon" size="sm" onClick={() => { setEditingItem(s); setFormState(s); setShowForm('class'); }}><Edit size={16} className="text-blue-600" /></Button>
                      <Button variant="icon" size="sm" onClick={() => handleDelete('class', s.schedule_id)}><Trash2 size={16} className="text-red-600" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first class routine or auto-generating one.</p>
              <div className="mt-6 flex justify-center space-x-4">
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setEditingItem(null);
                    setFormState({ academic_session_id: sessions.find(s => s.status === 'active')?.id });
                    setShowForm('class');
                  }}
                >
                  Create Schedule
                </Button>
                <Button variant="primary" onClick={handleAutoGenerateSchedule}>
                  Auto-Generate Schedule
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
      {activeTab === 'duty' && (
        <Card title="Staff Duties">
          {staffDuties.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duty Type</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffDuties.map(d => (
                  <tr key={d.duty_id}>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{d.staff_name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{dutyTypes.find(t => t.value === d.duty_type)?.label}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{d.location || '-'}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{d.day_of_week.charAt(0).toUpperCase() + d.day_of_week.slice(1)}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{d.start_time} ({d.duration} min)</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm space-x-1">
                      <Button variant="icon" size="sm" onClick={() => { setEditingItem(d); setFormState(d); setShowForm('duty'); }}><Edit size={16} className="text-blue-600" /></Button>
                      <Button variant="icon" size="sm" onClick={() => handleDelete('duty', d.duty_id)}><Trash2 size={16} className="text-red-600" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No staff duties</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first staff duty.</p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setEditingItem(null);
                    setFormState({ academic_session_id: sessions.find(s => s.status === 'active')?.id });
                    setShowForm('duty');
                  }}
                >
                  Create Duty
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
      {activeTab === 'exam' && (
        <Card title="Exam Schedules">
          {examSchedules.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examSchedules.map(e => (
                  <tr key={e.exam_id}>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{e.class_name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{e.section_name || 'All Sections'}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{e.subject_name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{format(new Date(e.exam_date), 'MMM dd, yyyy')}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">{e.start_time} ({e.duration} min)</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm space-x-1">
                      <Button variant="icon" size="sm" onClick={() => { setEditingItem(e); setFormState(e); setShowForm('exam'); }}><Edit size={16} className="text-blue-600" /></Button>
                      <Button variant="icon" size="sm" onClick={() => handleDelete('exam', e.exam_id)}><Trash2 size={16} className="text-red-600" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No exam schedules</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first exam schedule.</p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setEditingItem(null);
                    setFormState({ academic_session_id: sessions.find(s => s.status === 'active')?.id });
                    setShowForm('exam');
                  }}
                >
                  Create Exam Schedule
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ClassSchedule;