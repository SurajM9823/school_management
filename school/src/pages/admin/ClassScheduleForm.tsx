import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import api from '../../api';

interface ClassScheduleFormProps {
  formState: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  classes: any[];
  sections: any[];
  subjects: any[];
  teachers: any[];
  rooms: any[];
  daysOfWeek: string[];
  schoolTiming: any;
}

const ClassScheduleForm: React.FC<ClassScheduleFormProps> = ({
  formState,
  handleInputChange,
  classes,
  sections,
  subjects,
  teachers,
  rooms,
  daysOfWeek,
  schoolTiming,
}) => {
  // State for filtered subjects and teacher assignments
  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<{[key: number]: number}>({});
  const [loading, setLoading] = useState(false);
  
  // Get sections for the selected class
  const availableSections = formState.class_id
    ? sections.filter(s => s.class_id === Number(formState.class_id))
    : [];
    
  // Filter subjects and teachers based on class/section selection
  useEffect(() => {
    if (!formState.class_id) {
      setClassSubjects([]);
      setSubjectTeachers({});
      return;
    }
    
    setLoading(true);
    try {
      // Filter subjects that are assigned to this class
      const classId = Number(formState.class_id);
      const sectionId = formState.section_id ? Number(formState.section_id) : null;
      
      // Since we don't have a teacher-assignments API endpoint,
      // we'll use the available subjects and filter them
      // In a real implementation, you would fetch this data from an API
      
      // For now, we'll just use all subjects for the selected class
      const filteredSubjects = subjects.filter(subject => {
        // In a real implementation, you would check if the subject is assigned to the class
        // For now, we'll just include all subjects
        return true;
      });
      
      // Create a mapping of subject to teacher
      // In a real implementation, this would come from the API
      const teacherMap: {[key: number]: number} = {};
      
      // For demonstration, assign the first teacher to each subject
      filteredSubjects.forEach(subject => {
        if (teachers.length > 0) {
          teacherMap[subject.id] = teachers[0].id;
        }
      });
      
      setClassSubjects(filteredSubjects);
      setSubjectTeachers(teacherMap);
    } catch (err) {
      console.error('Failed to process class subjects:', err);
      // Fallback to all subjects
      setClassSubjects(subjects);
    } finally {
      setLoading(false);
    }
  }, [formState.class_id, formState.section_id, subjects, teachers]);

  return (
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
        <select 
          name="subject_id" 
          value={formState.subject_id || ''} 
          onChange={(e) => {
            // Handle subject change
            handleInputChange(e);
            
            // Auto-select teacher if available
            const subjectId = parseInt(e.target.value);
            if (subjectTeachers[subjectId]) {
              const teacherEvent = {
                target: { name: 'teacher_id', value: subjectTeachers[subjectId].toString() }
              } as React.ChangeEvent<HTMLSelectElement>;
              handleInputChange(teacherEvent);
            }
          }} 
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" 
          required
        >
          <option value="">Select Subject</option>
          {loading ? (
            <option value="" disabled>Loading subjects...</option>
          ) : (
            subjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))
          )}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Teacher</label>
        <select 
          name="teacher_id" 
          value={formState.teacher_id || ''} 
          onChange={handleInputChange} 
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" 
          required
          disabled={!formState.subject_id}
        >
          <option value="">Select Teacher</option>
          {teachers.map(teacher => (
            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Room (Optional)</label>
        <select name="room_id" value={formState.room_id || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
          <option value="">Select Room</option>
          {rooms.map(room => <option key={room.id} value={room.id}>{room.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Days of Week</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {daysOfWeek.map(day => (
            <div 
              key={day}
              onClick={() => {
                // If single day is selected, use that as day_of_week
                // If multiple days are selected, store in selected_days array
                const selectedDays = formState.selected_days || [];
                const isSelected = selectedDays.includes(day);
                
                const newSelectedDays = isSelected
                  ? selectedDays.filter(d => d !== day)
                  : [...selectedDays, day];
                  
                // Update both fields
                const newDay = newSelectedDays.length === 1 ? newSelectedDays[0] : '';
                const event = {
                  target: { name: 'day_of_week', value: newDay }
                } as React.ChangeEvent<HTMLInputElement>;
                handleInputChange(event);
                
                // Also update the selected_days array
                const daysEvent = {
                  target: { name: 'selected_days', value: newSelectedDays }
                } as React.ChangeEvent<HTMLInputElement>;
                handleInputChange(daysEvent);
              }}
              className={`
                cursor-pointer px-3 py-1 rounded-full text-sm font-medium
                ${(formState.selected_days || []).includes(day) 
                  ? 'bg-blue-100 text-blue-800 border-blue-300' 
                  : 'bg-gray-100 text-gray-600 border-gray-200'}
                border hover:bg-blue-50 transition-colors
              `}
            >
              {day.charAt(0).toUpperCase() + day.slice(1)}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">Select one or more days for this class period</p>
      </div>
      <div>
        <label className="block text-sm font-medium">Period Number</label>
        <input type="number" name="period_number" value={formState.period_number || ''} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" min="1" max={schoolTiming?.periods_per_day || 8} required />
      </div>
      <div>
        <label className="block text-sm font-medium">Start Time (Auto-calculated)</label>
        <input type="time" name="start_time" value={formState.start_time || ''} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100" required />
        <p className="text-xs text-gray-500 mt-1">Start time is automatically calculated based on period number</p>
      </div>
      <div>
        <label className="block text-sm font-medium">Duration (minutes)</label>
        <input type="number" name="duration" value={formState.duration || schoolTiming?.period_duration || ''} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100" min="1" required />
        <p className="text-xs text-gray-500 mt-1">Duration is set to the school period duration</p>
      </div>
    </>
  );
};

export default ClassScheduleForm;