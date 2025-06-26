import React from 'react';
import { Trash2, PlusCircle } from 'lucide-react';
import Button from './common/Button';

interface TeachingAssignmentFormProps {
  assignments: any[];
  classes: any[];
  sections: any[];
  subjects: any[];
  onAssignmentChange: (index: number, field: string, value: any) => void;
  onAddAssignment: () => void;
  onRemoveAssignment: (index: number) => void;
}

const TeachingAssignmentForm: React.FC<TeachingAssignmentFormProps> = ({
  assignments,
  classes,
  sections,
  subjects,
  onAssignmentChange,
  onAddAssignment,
  onRemoveAssignment
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Teaching Assignments</h3>
      <p className="text-sm text-gray-500 mb-4">
        Assign this teacher to specific classes, sections, and subjects.
      </p>
      
      {assignments.map((assignment, index) => (
        <div key={index} className="border rounded-md p-4 mb-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-md font-medium">Assignment #{index + 1}</h4>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={() => onRemoveAssignment(index)}
              icon={<Trash2 size={14} />}
            >
              Remove
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Class</label>
              <select
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={assignment.class_id}
                onChange={(e) => onAssignmentChange(index, 'class_id', parseInt(e.target.value))}
              >
                <option value="">Select Class</option>
                {classes.map((cls: any) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Section</label>
              <select
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={assignment.section_id}
                onChange={(e) => onAssignmentChange(index, 'section_id', parseInt(e.target.value))}
                disabled={!assignment.class_id}
              >
                <option value="">Select Section</option>
                {sections.map((section: any) => (
                  <option key={section.id} value={section.id}>{section.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <select
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={assignment.subject_id}
                onChange={(e) => onAssignmentChange(index, 'subject_id', parseInt(e.target.value))}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Hours per Week</label>
              <input
                type="number"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={assignment.hours_per_week}
                onChange={(e) => onAssignmentChange(index, 'hours_per_week', parseInt(e.target.value))}
                min="0"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={assignment.is_primary}
                  onChange={(e) => onAssignmentChange(index, 'is_primary', e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700">Primary Assignment</span>
              </label>
            </div>
          </div>
        </div>
      ))}
      
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddAssignment}
          icon={<PlusCircle size={14} />}
        >
          Add Another Assignment
        </Button>
      </div>
    </div>
  );
};

export default TeachingAssignmentForm;