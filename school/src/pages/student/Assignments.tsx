import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { BookOpen, Calendar, CheckCircle, Edit, FileText, Filter, AlertCircle, Download, UploadCloud } from 'lucide-react';
import { format, parseISO, isPast, isSameDay } from 'date-fns';

interface Assignment {
  id: string;
  subject: string;
  title: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Graded' | 'Overdue';
  marks?: string; // e.g., "85/100" or "A+"
  feedback?: string;
  attachments?: Array<{ name: string; url: string }>; // Files provided by teacher
  submissionLink?: string; // For online submission
  submittedFiles?: Array<{ name: string; url: string }>; // Files submitted by student
  teacherName?: string;
}

// Mock data
const mockAssignments: Assignment[] = [
  {
    id: 'assign1',
    subject: 'Mathematics',
    title: 'Algebra Chapter 5 Exercises',
    description: 'Complete all exercises from Chapter 5, sections 5.1 to 5.3. Show all working.',
    assignedDate: '2024-05-20',
    dueDate: '2024-06-05', // Past due, should be Overdue if not submitted
    status: 'Overdue', 
    teacherName: 'Mr. A. Sharma',
    attachments: [{ name: 'Chapter5_Questions.pdf', url: '#' }],
  },
  {
    id: 'assign2',
    subject: 'Science',
    title: 'Photosynthesis Project',
    description: 'Create a detailed presentation on the process of photosynthesis, including diagrams.',
    assignedDate: '2024-05-15',
    dueDate: '2024-06-10',
    status: 'Submitted',
    teacherName: 'Ms. B. Kaur',
    submittedFiles: [{ name: 'Photosynthesis_Project.pptx', url: '#'}]
  },
  {
    id: 'assign3',
    subject: 'English',
    title: 'Book Report: To Kill a Mockingbird',
    description: 'Write a 1000-word report on the themes and characters of "To Kill a Mockingbird".',
    assignedDate: '2024-05-10',
    dueDate: '2024-05-30',
    status: 'Graded',
    marks: '92/100',
    feedback: 'Excellent analysis of themes. Work on your conclusion structure slightly.',
    teacherName: 'Mrs. C. Dsouza',
    submittedFiles: [{ name: 'Book_Report_Final.docx', url: '#'}]
  },
  {
    id: 'assign4',
    subject: 'History',
    title: 'Ancient Civilizations Research',
    description: 'Research and write a short essay on the Indus Valley Civilization.',
    assignedDate: '2024-06-01',
    dueDate: '2024-06-15',
    status: 'Pending',
    teacherName: 'Mr. D. Lal',
  },
  {
    id: 'assign5',
    subject: 'Computer Science',
    title: 'Basic Python Programming Tasks',
    description: 'Complete the 5 programming tasks provided in the worksheet. Submit your .py files.',
    assignedDate: '2024-06-08',
    dueDate: '2024-06-20',
    status: 'Pending',
    teacherName: 'Mr. Kumar',
    attachments: [{ name: 'Python_Tasks.pdf', url: '#' }],
  },
];

// Dynamically update status for overdue items
const getUpdatedAssignments = (assignments: Assignment[]): Assignment[] => {
    return assignments.map(assignment => {
        if (assignment.status === 'Pending' && isPast(parseISO(assignment.dueDate)) && !isSameDay(parseISO(assignment.dueDate), new Date())) {
            return { ...assignment, status: 'Overdue' };
        }
        return assignment;
    });
};

const assignmentSubjects = Array.from(new Set(mockAssignments.map(a => a.subject)));
const assignmentStatuses: Assignment['status'][] = ['Pending', 'Submitted', 'Graded', 'Overdue'];

const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>(getUpdatedAssignments(mockAssignments));
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<Assignment | null>(null);

  const filteredAssignments = useMemo(() => {
    return assignments
      .filter(assignment => 
        (subjectFilter === 'all' || assignment.subject === subjectFilter) &&
        (statusFilter === 'all' || assignment.status === statusFilter)
      )
      .sort((a, b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime());
  }, [assignments, subjectFilter, statusFilter]);

  const handleOpenSubmitModal = (assignment: Assignment) => {
    setSelectedAssignmentForSubmit(assignment);
    setShowSubmitModal(true);
  };

  const handleSubmitAssignment = (files?: FileList) => { // Mock submission
    if (selectedAssignmentForSubmit) {
        setAssignments(prev => prev.map(asn => 
            asn.id === selectedAssignmentForSubmit.id 
            ? {...asn, status: 'Submitted', submittedFiles: files ? Array.from(files).map(f => ({name: f.name, url: '#'})) : [] } 
            : asn
        ));
        alert(`Assignment "${selectedAssignmentForSubmit.title}" submitted! (Mock)`);
    }
    setShowSubmitModal(false);
    setSelectedAssignmentForSubmit(null);
  };

  const getStatusPill = (status: Assignment['status']) => {
    let colorClasses = '';
    let Icon = Edit; // Default for Pending
    if (status === 'Submitted') { colorClasses = 'bg-yellow-100 text-yellow-800'; Icon = FileText; }
    else if (status === 'Graded') { colorClasses = 'bg-green-100 text-green-800'; Icon = CheckCircle; }
    else if (status === 'Overdue') { colorClasses = 'bg-red-100 text-red-800'; Icon = AlertCircle; }
    else { colorClasses = 'bg-blue-100 text-blue-800'; } // Pending

    return (
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses} items-center`}>
        <Icon size={14} className="mr-1.5" />
        {status}
      </span>
    );
  };

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
                      <BookOpen size={14} className="mr-2 text-gray-500" /> {assignment.subject}
                      {assignment.teacherName && <span className="ml-2 text-xs text-gray-500">(by {assignment.teacherName})</span>}
                    </p>
                  </div>
                  {getStatusPill(assignment.status)}
                </div>

                <div className="mt-3 text-sm text-gray-700 space-y-1">
                  <p className="flex items-center"><Calendar size={14} className="mr-2 text-gray-500" /> <strong>Due Date:</strong> {format(parseISO(assignment.dueDate), 'MMM dd, yyyy')}</p>
                  {assignment.status === 'Graded' && assignment.marks && (
                    <p className="font-semibold text-green-700">Marks: {assignment.marks}</p>
                  )}
                </div>

                {expandedAssignmentId === assignment.id && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2"><strong>Description:</strong> {assignment.description}</p>
                        {assignment.attachments && assignment.attachments.length > 0 && (
                            <div className="mb-2">
                                <p className="text-sm font-medium text-gray-700">Provided Attachments:</p>
                                <ul className="list-disc list-inside ml-4">
                                {assignment.attachments.map((file, idx) => (
                                    <li key={idx} className="text-sm"><a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center"><Download size={14} className="mr-1"/> {file.name}</a></li>
                                ))}
                                </ul>
                            </div>
                        )}
                        {assignment.status === 'Graded' && assignment.feedback && (
                            <p className="text-sm text-gray-600 italic bg-yellow-50 p-2 rounded-md"><strong>Feedback:</strong> {assignment.feedback}</p>
                        )}
                        {assignment.submittedFiles && assignment.submittedFiles.length > 0 && (
                             <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">Your Submissions:</p>
                                <ul className="list-disc list-inside ml-4">
                                {assignment.submittedFiles.map((file, idx) => (
                                    <li key={idx} className="text-sm"><a href={file.url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center"><FileText size={14} className="mr-1"/> {file.name}</a></li>
                                ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setExpandedAssignmentId(expandedAssignmentId === assignment.id ? null : assignment.id)}>
                        {expandedAssignmentId === assignment.id ? 'Hide Details' : 'View Details'}
                    </Button>
                    {(assignment.status === 'Pending' || assignment.status === 'Overdue') && (
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
                <p className="text-sm text-gray-600 mb-2">Subject: {selectedAssignmentForSubmit.subject}</p>
                <p className="text-sm text-gray-600 mb-4">Due Date: {format(parseISO(selectedAssignmentForSubmit.dueDate), 'MMM dd, yyyy')}</p>
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