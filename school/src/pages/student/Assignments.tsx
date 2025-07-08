import React, { useState, useMemo, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { BookOpen, Calendar, CheckCircle, Edit, FileText, Filter, AlertCircle, Download, UploadCloud } from 'lucide-react';
import { format, parseISO, isPast, isSameDay } from 'date-fns';
import api from '../../api';

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  subject_name: string;
  teacher_name: string;
  submission_status: 'pending' | 'submitted' | 'graded' | 'overdue';
  marks?: number;
  feedback?: string;
  submission_file?: string;
  submission_text?: string;
  submitted_at?: string;
}

const assignmentStatuses: Assignment['status'][] = ['pending', 'submitted', 'graded', 'overdue'];

const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/teacher-assignments/');
      setAssignments(response.data.filter((a: Assignment) => a.student));
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignmentSubjects = Array.from(new Set(assignments.map(a => a.subject_name)));

  const filteredAssignments = useMemo(() => {
    return assignments
      .filter(assignment => 
        (subjectFilter === 'all' || assignment.subject_name === subjectFilter) &&
        (statusFilter === 'all' || assignment.submission_status === statusFilter)
      )
      .sort((a, b) => parseISO(b.due_date).getTime() - parseISO(a.due_date).getTime());
  }, [assignments, subjectFilter, statusFilter]);

  const handleOpenSubmitModal = (assignment: Assignment) => {
    setSelectedAssignmentForSubmit(assignment);
    setShowSubmitModal(true);
  };

  const handleSubmitAssignment = async (files?: FileList) => {
    if (selectedAssignmentForSubmit) {
      try {
        const formData = new FormData();
        if (files && files.length > 0) {
          formData.append('submission_file', files[0]);
        }
        const textArea = document.querySelector('textarea') as HTMLTextAreaElement;
        if (textArea?.value) {
          formData.append('submission_text', textArea.value);
        }
        
        await api.post(`/teacher-assignments/${selectedAssignmentForSubmit.id}/submit/`, formData);
        fetchAssignments();
        alert(`Assignment "${selectedAssignmentForSubmit.title}" submitted successfully!`);
      } catch (error) {
        console.error('Error submitting assignment:', error);
        alert('Error submitting assignment');
      }
    }
    setShowSubmitModal(false);
    setSelectedAssignmentForSubmit(null);
  };

  const getStatusPill = (status: Assignment['submission_status']) => {
    let colorClasses = '';
    let Icon = Edit; // Default for pending
    if (status === 'submitted') { colorClasses = 'bg-yellow-100 text-yellow-800'; Icon = FileText; }
    else if (status === 'graded') { colorClasses = 'bg-green-100 text-green-800'; Icon = CheckCircle; }
    else if (status === 'overdue') { colorClasses = 'bg-red-100 text-red-800'; Icon = AlertCircle; }
    else { colorClasses = 'bg-blue-100 text-blue-800'; } // pending

    return (
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses} items-center`}>
        <Icon size={14} className="mr-1.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
        <FileText size={28} className="mr-3 text-blue-600"/> My Assignments
      </h1>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="subjectFilter" className="block text-sm font-medium text-gray-700">Filter by Subject</label>
            <select id="subjectFilter" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="mt-1 block w-full common-input-styles">
              <option value="all">All Subjects</option>
              {assignmentSubjects.map(subject => (<option key={subject} value={subject}>{subject}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Filter by Status</label>
            <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 block w-full common-input-styles">
              <option value="all">All Statuses</option>
              {assignmentStatuses.map(status => (<option key={status} value={status}>{status}</option>))}
            </select>
          </div>
          <Button variant="outline" icon={<Filter size={16}/>} onClick={() => {setSubjectFilter('all'); setStatusFilter('all');}}>
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Assignments List */}
      {filteredAssignments.length > 0 ? (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
              <div className="p-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700">{assignment.title}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <BookOpen size={14} className="mr-2 text-gray-500" /> {assignment.subject_name}
                      {assignment.teacher_name && <span className="ml-2 text-xs text-gray-500">(by {assignment.teacher_name})</span>}
                    </p>
                  </div>
                  {getStatusPill(assignment.submission_status)}
                </div>

                <div className="mt-3 text-sm text-gray-700 space-y-1">
                  <p className="flex items-center"><Calendar size={14} className="mr-2 text-gray-500" /> <strong>Due Date:</strong> {format(parseISO(assignment.due_date), 'MMM dd, yyyy')}</p>
                  {assignment.submission_status === 'graded' && assignment.marks && (
                    <p className="font-semibold text-green-700">Marks: {assignment.marks}</p>
                  )}
                </div>

                {expandedAssignmentId === assignment.id && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2"><strong>Description:</strong> {assignment.description}</p>
                        {assignment.submission_status === 'graded' && assignment.feedback && (
                            <p className="text-sm text-gray-600 italic bg-yellow-50 p-2 rounded-md"><strong>Feedback:</strong> {assignment.feedback}</p>
                        )}
                        {assignment.submission_file && (
                             <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">Your Submission:</p>
                                <p className="text-sm text-green-600">File submitted on {assignment.submitted_at ? format(parseISO(assignment.submitted_at), 'MMM dd, yyyy') : 'N/A'}</p>
                            </div>
                        )}
                    </div>
                )}
                <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setExpandedAssignmentId(expandedAssignmentId === assignment.id ? null : assignment.id)}>
                        {expandedAssignmentId === assignment.id ? 'Hide Details' : 'View Details'}
                    </Button>
                    {(assignment.submission_status === 'pending' || assignment.submission_status === 'overdue') && (
                        <Button variant="primary" size="sm" icon={<UploadCloud size={14}/>} onClick={() => handleOpenSubmitModal(assignment)}>
                            Submit Work
                        </Button>
                    )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div className="text-center py-10"><FileText className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No Assignments Found</h3><p className="mt-1 text-sm text-gray-500">No assignments match your filters, or you're all caught up!</p></div></Card>
      )}

      {/* Submit Assignment Modal */}
      {showSubmitModal && selectedAssignmentForSubmit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card title={`Submit: ${selectedAssignmentForSubmit.title}`} className="w-full max-w-md bg-white shadow-xl">
            <div className="p-3">
                <p className="text-sm text-gray-600 mb-2">Subject: {selectedAssignmentForSubmit.subject_name}</p>
                <p className="text-sm text-gray-600 mb-4">Due Date: {format(parseISO(selectedAssignmentForSubmit.due_date), 'MMM dd, yyyy')}</p>
                {/* Basic file input for mock */}
                <input type="file" multiple className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"/>
                <textarea placeholder="Add any comments for your teacher (optional)..." rows={3} className="w-full p-2 border border-gray-300 rounded-md text-sm mb-4"></textarea>
                <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => {setShowSubmitModal(false); setSelectedAssignmentForSubmit(null);}}>Cancel</Button>
                    <Button variant="primary" icon={<UploadCloud size={16}/>} onClick={() => handleSubmitAssignment((document.querySelector('input[type="file"]') as HTMLInputElement)?.files || undefined)}>
                        Upload & Submit
                    </Button>
                </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Helper for common input styles if needed elsewhere
const commonInputStyles = "pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md";

export default Assignments;