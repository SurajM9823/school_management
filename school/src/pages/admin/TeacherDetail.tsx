import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  BookOpen,
  Award,
  DollarSign,
  Edit,
  Key,
  Trash2,
  PlusCircle,
  Save,
  X
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const TeacherDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<any>(null);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Fetch teacher details
  useEffect(() => {
    const fetchTeacherDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [teacherResponse, assignmentsResponse, classesResponse, subjectsResponse] = await Promise.all([
          api.get(`/teachers/${id}/`),
          api.get(`/teachers/${id}/assignments/`),
          api.get('/school/settings/classes/'),
          api.get('/school/settings/subjects/')
        ]);
        
        setTeacher(teacherResponse.data);
        setAssignments(assignmentsResponse.data);
        setClasses(classesResponse.data);
        setSubjects(subjectsResponse.data);
      } catch (err) {
        console.error('Error fetching teacher details:', err);
        setError('Failed to load teacher details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeacherDetails();
  }, [id]);

  // Fetch sections for a specific class
  const fetchSections = async (classId: number) => {
    try {
      const response = await api.get(`/school/settings/classes/${classId}/sections/`);
      setSections(response.data);
    } catch (err) {
      console.error('Error fetching sections:', err);
      toast.error('Failed to load sections');
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    try {
      await api.post(`/teachers/${id}/reset_password/`, { new_password: newPassword });
      toast.success('Password reset successfully');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      console.error('Error resetting password:', err);
      toast.error('Failed to reset password');
    }
  };

  // Handle assignment edit/add
  const handleSaveAssignment = async () => {
    try {
      if (currentAssignment.id) {
        // Update existing assignment
        await api.put(`/teachers/${id}/assignments/${currentAssignment.id}/`, currentAssignment);
        toast.success('Assignment updated successfully');
      } else {
        // Add new assignment
        await api.post(`/teachers/${id}/add_assignment/`, {
          ...currentAssignment,
          teacher: id
        });
        toast.success('Assignment added successfully');
      }
      
      // Refresh assignments
      const response = await api.get(`/teachers/${id}/assignments/`);
      setAssignments(response.data);
      setShowAssignmentModal(false);
      setCurrentAssignment(null);
    } catch (err) {
      console.error('Error saving assignment:', err);
      toast.error('Failed to save assignment');
    }
  };

  // Handle assignment delete
  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }
    
    try {
      await api.delete(`/teachers/${id}/assignments/${assignmentId}/`);
      toast.success('Assignment deleted successfully');
      
      // Refresh assignments
      const response = await api.get(`/teachers/${id}/assignments/`);
      setAssignments(response.data);
    } catch (err) {
      console.error('Error deleting assignment:', err);
      toast.error('Failed to delete assignment');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
        <p>{error}</p>
        <Button variant="outline" onClick={() => navigate('/admin/teachers')}>
          Back to Teachers
        </Button>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md p-4">
        <p>Teacher not found</p>
        <Button variant="outline" onClick={() => navigate('/admin/teachers')}>
          Back to Teachers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/teachers')}
            icon={<ArrowLeft size={16} />}
          >
            Back to Teachers
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {teacher.staff?.user?.name || 'Teacher Details'}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordModal(true)}
            icon={<Key size={16} />}
          >
            Reset Password
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/admin/teachers/edit/${id}`)}
            icon={<Edit size={16} />}
          >
            Edit Teacher
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <User className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-base text-gray-900">{teacher.staff?.user?.name}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Mail className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-base text-gray-900">{teacher.staff?.user?.email}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Phone className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-base text-gray-900">{teacher.staff?.phone || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Calendar className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Date of Birth</p>
              <p className="text-base text-gray-900">
                {teacher.staff?.date_of_birth ? new Date(teacher.staff.date_of_birth).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p className="text-base text-gray-900">{teacher.staff?.address || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <User className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Gender</p>
              <p className="text-base text-gray-900">{teacher.staff?.gender ? teacher.staff.gender.charAt(0).toUpperCase() + teacher.staff.gender.slice(1) : 'Not provided'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Employment Details */}
      <Card title="Employment Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <Briefcase className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Employee ID</p>
              <p className="text-base text-gray-900">{teacher.staff?.employee_id || 'Not assigned'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Calendar className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Joining Date</p>
              <p className="text-base text-gray-900">
                {teacher.staff?.hire_date ? new Date(teacher.staff.hire_date).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Briefcase className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Employment Type</p>
              <p className="text-base text-gray-900">
                {teacher.staff?.employment_type ? teacher.staff.employment_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Not provided'}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Award className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Experience</p>
              <p className="text-base text-gray-900">{teacher.experience || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <BookOpen className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Qualification</p>
              <p className="text-base text-gray-900">{teacher.qualification || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <BookOpen className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Primary Subject</p>
              <p className="text-base text-gray-900">{teacher.primary_subject?.name || 'Not assigned'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Financial Details */}
      <Card title="Financial Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start space-x-3">
            <DollarSign className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Base Salary</p>
              <p className="text-base text-gray-900">{teacher.staff?.base_salary || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <DollarSign className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Pay Frequency</p>
              <p className="text-base text-gray-900">
                {teacher.staff?.pay_frequency ? teacher.staff.pay_frequency.charAt(0).toUpperCase() + teacher.staff.pay_frequency.slice(1) : 'Not provided'}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <DollarSign className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">PAN Number</p>
              <p className="text-base text-gray-900">{teacher.pan_number || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <DollarSign className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Bank Name</p>
              <p className="text-base text-gray-900">{teacher.staff?.bank_name || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <DollarSign className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">Bank Account</p>
              <p className="text-base text-gray-900">{teacher.staff?.bank_account_number || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <DollarSign className="text-gray-400 mt-1" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-500">IFSC Code</p>
              <p className="text-base text-gray-900">{teacher.ifsc_code || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Teaching Assignments */}
      <Card 
        title="Teaching Assignments"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentAssignment({ class_id: '', section_id: '', subject_id: '', is_primary: false, hours_per_week: 0 });
              setShowAssignmentModal(true);
            }}
            icon={<PlusCircle size={16} />}
          >
            Add Assignment
          </Button>
        }
      >
        {assignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new assignment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((assignment: any) => (
              <div key={assignment.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">
                    {assignment.class_name} - {assignment.section_name}
                  </h3>
                  <div className="flex space-x-2">
                    <button 
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        setCurrentAssignment(assignment);
                        fetchSections(assignment.class_obj);
                        setShowAssignmentModal(true);
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Subject: {assignment.subject_name}</p>
                <p className="text-sm text-gray-600">Hours per week: {assignment.hours_per_week}</p>
                {assignment.is_primary && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                    Primary Assignment
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Password Reset Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Reset Password"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              id="new-password"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleResetPassword} disabled={!newPassword}>Reset Password</Button>
          </div>
        </div>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        title={currentAssignment?.id ? "Edit Assignment" : "Add Assignment"}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="class" className="block text-sm font-medium text-gray-700">Class</label>
            <select
              id="class"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={currentAssignment?.class_obj || ''}
              onChange={(e) => {
                const classId = parseInt(e.target.value);
                setCurrentAssignment({...currentAssignment, class_obj: classId, section_id: ''});
                fetchSections(classId);
              }}
            >
              <option value="">Select Class</option>
              {classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="section" className="block text-sm font-medium text-gray-700">Section</label>
            <select
              id="section"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={currentAssignment?.section || ''}
              onChange={(e) => setCurrentAssignment({...currentAssignment, section: parseInt(e.target.value)})}
              disabled={!currentAssignment?.class_obj}
            >
              <option value="">Select Section</option>
              {sections.map((section: any) => (
                <option key={section.id} value={section.id}>{section.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
            <select
              id="subject"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={currentAssignment?.subject || ''}
              onChange={(e) => setCurrentAssignment({...currentAssignment, subject: parseInt(e.target.value)})}
            >
              <option value="">Select Subject</option>
              {subjects.map((subject: any) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="hours" className="block text-sm font-medium text-gray-700">Hours per Week</label>
            <input
              type="number"
              id="hours"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={currentAssignment?.hours_per_week || 0}
              onChange={(e) => setCurrentAssignment({...currentAssignment, hours_per_week: parseInt(e.target.value)})}
              min="0"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is-primary"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={currentAssignment?.is_primary || false}
              onChange={(e) => setCurrentAssignment({...currentAssignment, is_primary: e.target.checked})}
            />
            <label htmlFor="is-primary" className="ml-2 block text-sm text-gray-900">
              Primary Assignment
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowAssignmentModal(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleSaveAssignment}
              disabled={!currentAssignment?.class_obj || !currentAssignment?.section || !currentAssignment?.subject}
            >
              {currentAssignment?.id ? "Update" : "Add"} Assignment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherDetail;