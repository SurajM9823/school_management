import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  Search, 
  Filter, 
  PlusCircle, 
  Edit, 
  Trash,
  Download,
  Eye
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { format } from 'date-fns';
import api from '../../api';

interface Assignment {
  id: number;
  title: string;
  description: string;
  class_assigned: number;
  class_name: string;
  subject: number;
  subject_name: string;
  due_date: string;
  created_at: string;
  status: string;
  submissions: number;
  total_students: number;
  teacher_name: string;
}

interface ClassOption {
  id: number;
  name: string;
}

interface SubjectOption {
  id: number;
  name: string;
  code: string;
}

const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [showNewAssignmentForm, setShowNewAssignmentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    class_assigned: '',
    subject: '',
    due_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchAssignments();
    fetchTeacherClassesSubjects();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/teacher-assignments/teacher_assignments/');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherClassesSubjects = async () => {
    try {
      const response = await api.get('/teacher/myclasses/');
      
      // Extract classes and subjects from the response structure
      const subjectData = response.data.subject_assignments || [];
      
      // Get unique classes
      const uniqueClasses = subjectData.reduce((acc: ClassOption[], item: any) => {
        if (!acc.find(cls => cls.id === item.class_obj)) {
          acc.push({ id: item.class_obj, name: item.class_name });
        }
        return acc;
      }, []);
      
      // Get unique subjects
      const uniqueSubjects = subjectData.reduce((acc: SubjectOption[], item: any) => {
        if (!acc.find(subj => subj.id === item.subject)) {
          acc.push({ id: item.subject, name: item.subject_name, code: '' });
        }
        return acc;
      }, []);
      
      setClasses(uniqueClasses);
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Error fetching classes and subjects:', error);
      setClasses([]);
      setSubjects([]);
    }
  };

  // Filter assignments based on search term and filters
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || assignment.class_name === selectedClass;
    const matchesSubject = selectedSubject === 'all' || assignment.subject_name === selectedSubject;
    
    return matchesSearch && matchesClass && matchesSubject;
  });

  const handleCreateAssignment = async () => {
    try {
      await api.post('/teacher-assignments/', newAssignment);
      fetchAssignments();
      setShowNewAssignmentForm(false);
      setNewAssignment({
        title: '',
        description: '',
        class_assigned: '',
        subject: '',
        due_date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setShowEditForm(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;
    try {
      await api.put(`/teacher-assignments/${editingAssignment.id}/`, editingAssignment);
      fetchAssignments();
      setShowEditForm(false);
      setEditingAssignment(null);
    } catch (error) {
      console.error('Error updating assignment:', error);
    }
  };

  const handleViewAssignment = (assignment: Assignment) => {
    setViewingAssignment(assignment);
    setShowViewModal(true);
  };

  // Get unique classes and subjects for filters
  const uniqueClasses = Array.from(new Set(assignments.map(a => a.class_name)));
  const uniqueSubjects = Array.from(new Set(assignments.map(a => a.subject_name)));

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Assignments</h1>
        <Button
          variant="primary"
          icon={<PlusCircle size={16} />}
          onClick={() => setShowNewAssignmentForm(!showNewAssignmentForm)}
        >
          New Assignment
        </Button>
      </div>

      {/* New Assignment Form */}
      {showNewAssignmentForm && (
        <Card title="Create New Assignment">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
              />
            </div>
            
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  id="dueDate"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={newAssignment.due_date}
                  onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="class" className="block text-sm font-medium text-gray-700">
                Class
              </label>
              <select
                id="class"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={newAssignment.class_assigned}
                onChange={(e) => setNewAssignment({...newAssignment, class_assigned: e.target.value})}
              >
                <option value="">Select Class</option>
                {classes.length > 0 ? classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                )) : <option disabled>No classes assigned</option>}
              </select>
            </div>
            
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Subject
              </label>
              <select
                id="subject"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={newAssignment.subject}
                onChange={(e) => setNewAssignment({...newAssignment, subject: e.target.value})}
              >
                <option value="">Select Subject</option>
                {subjects.length > 0 ? subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                )) : <option disabled>No subjects assigned</option>}
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Attachments
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
                    >
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLSX up to 10MB</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowNewAssignmentForm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateAssignment}
              disabled={!newAssignment.title || !newAssignment.due_date || !newAssignment.class_assigned || !newAssignment.subject}
            >
              Create Assignment
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {uniqueSubjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Assignments
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Total {filteredAssignments.length} assignments
          </p>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {filteredAssignments.map((assignment) => (
            <li key={assignment.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                      <FileText className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-md font-medium text-gray-900">{assignment.title}</h4>
                    <div className="flex space-x-2 mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {assignment.class_name}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {assignment.subject_name}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Due: {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {assignment.submissions}/{assignment.total_students} submissions
                    </p>
                    <div className="mt-1 w-32 bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${(assignment.submissions / assignment.total_students) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Eye size={16} />}
                      onClick={() => handleViewAssignment(assignment)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit size={16} />}
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Download size={16} />}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500 line-clamp-2">{assignment.description}</p>
            </li>
          ))}
        </ul>

        {filteredAssignments.length === 0 && (
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new assignment.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                icon={<PlusCircle size={16} />}
                onClick={() => setShowNewAssignmentForm(true)}
              >
                New Assignment
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Assignment Modal */}
      {showEditForm && editingAssignment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <Card title="Edit Assignment" className="w-full max-w-2xl bg-white">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={editingAssignment.title}
                  onChange={(e) => setEditingAssignment({...editingAssignment, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={editingAssignment.due_date}
                  onChange={(e) => setEditingAssignment({...editingAssignment, due_date: e.target.value})}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={editingAssignment.description}
                  onChange={(e) => setEditingAssignment({...editingAssignment, description: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <Button variant="outline" onClick={() => setShowEditForm(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleUpdateAssignment}>Update Assignment</Button>
            </div>
          </Card>
        </div>
      )}

      {/* View Assignment Modal */}
      {showViewModal && viewingAssignment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <Card title={viewingAssignment.title} className="w-full max-w-2xl bg-white">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Description</h4>
                <p className="text-gray-600">{viewingAssignment.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Class</h4>
                  <p className="text-gray-600">{viewingAssignment.class_name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Subject</h4>
                  <p className="text-gray-600">{viewingAssignment.subject_name}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Due Date</h4>
                  <p className="text-gray-600">{format(new Date(viewingAssignment.due_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Status</h4>
                  <p className="text-gray-600">{viewingAssignment.status}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Submissions</h4>
                <p className="text-gray-600">{viewingAssignment.submissions}/{viewingAssignment.total_students} students submitted</p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Assignments;