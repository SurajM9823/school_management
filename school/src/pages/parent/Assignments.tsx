import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button'; // Assuming Button component exists
import { BookOpen, Calendar, CheckCircle, Edit, FileText, Filter, AlertCircle, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';

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
  attachments?: Array<{ name: string; url: string }>;
  teacherName?: string;
}

// Mock data - In a real app, this would come from an API, likely filtered by selected child
const mockAssignments: Assignment[] = [
  {
    id: 'assign1',
    subject: 'Mathematics',
    title: 'Algebra Chapter 5 Exercises',
    description: 'Complete all exercises from Chapter 5, sections 5.1 to 5.3. Show all working.',
    assignedDate: '2024-05-20',
    dueDate: '2024-06-05',
    status: 'Pending',
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
  },
  {
    id: 'assign3',
    subject: 'English',
    title: 'Book Report: To Kill a Mockingbird',
    description: 'Write a 1000-word report on the themes and characters of "To Kill a Mockingbird".',
    assignedDate: '2024-05-10',
    dueDate: '2024-05-30', // Past due date
    status: 'Graded',
    marks: '92/100',
    feedback: 'Excellent analysis of themes. Work on your conclusion structure slightly.',
    teacherName: 'Mrs. C. Dsouza',
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
    subject: 'Mathematics',
    title: 'Geometry Problem Set 2',
    description: 'Solve problems 1-10 from the provided worksheet.',
    assignedDate: '2024-06-03',
    dueDate: '2024-06-01', // Past due date, should be overdue
    status: 'Overdue',
    teacherName: 'Mr. A. Sharma',
    attachments: [{ name: 'Geometry_Worksheet2.pdf', url: '#' }],
  },
];

const assignmentSubjects = Array.from(new Set(mockAssignments.map(a => a.subject)));
const assignmentStatuses: Assignment['status'][] = ['Pending', 'Submitted', 'Graded', 'Overdue'];

const Assignments: React.FC = () => {
  // Assume selectedChildId is available from context or props
  // For now, we'll use all assignments
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);

  const filteredAssignments = useMemo(() => {
    return assignments
      .filter(assignment => 
        (subjectFilter === 'all' || assignment.subject === subjectFilter) &&
        (statusFilter === 'all' || assignment.status === statusFilter)
      )
      .sort((a, b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime()); // Sort by due date descending
  }, [assignments, subjectFilter, statusFilter]);

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'Pending': return 'bg-blue-100 text-blue-800';
      case 'Submitted': return 'bg-yellow-100 text-yellow-800';
      case 'Graded': return 'bg-green-100 text-green-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusIcon = (status: Assignment['status']) => {
    switch (status) {
      case 'Pending': return <Edit size={16} className="mr-1 text-blue-600" />;
      case 'Submitted': return <FileText size={16} className="mr-1 text-yellow-600" />;
      case 'Graded': return <CheckCircle size={16} className="mr-1 text-green-600" />;
      case 'Overdue': return <AlertCircle size={16} className="mr-1 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Child's Assignments</h1>
        {/* Child selector would go here if not handled globally */}
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="subjectFilter" className="block text-sm font-medium text-gray-700">Filter by Subject</label>
            <select
              id="subjectFilter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Subjects</option>
              {assignmentSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Filter by Status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Statuses</option>
              {assignmentStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
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
              <div className="p-2"> {/* Reduced padding for Card content */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700">{assignment.title}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <BookOpen size={14} className="mr-2 text-gray-500" /> {assignment.subject}
                      {assignment.teacherName && <span className="ml-2 text-xs text-gray-500">(by {assignment.teacherName})</span>}
                    </p>
                  </div>
                  <span className={`mt-2 sm:mt-0 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
                    {getStatusIcon(assignment.status)}
                    {assignment.status}
                  </span>
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
                        {assignment.status === 'Graded' && assignment.feedback && (
                            <p className="text-sm text-gray-600 italic bg-yellow-50 p-2 rounded-md"><strong>Feedback:</strong> {assignment.feedback}</p>
                        )}
                        {assignment.attachments && assignment.attachments.length > 0 && (
                            <div className="mt-2">
                                <p className="text-sm font-medium text-gray-700">Attachments:</p>
                                <ul className="list-disc list-inside ml-4">
                                {assignment.attachments.map((file, idx) => (
                                    <li key={idx} className="text-sm">
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                                        <Download size={14} className="mr-1"/> {file.name}
                                    </a>
                                    </li>
                                ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                <div className="mt-4 text-right">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setExpandedAssignmentId(expandedAssignmentId === assignment.id ? null : assignment.id)}
                    >
                        {expandedAssignmentId === assignment.id ? 'Show Less' : 'View Details'}
                    </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Assignments Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no assignments matching your current filters, or no assignments have been posted yet.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Assignments;