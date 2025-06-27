import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft,
  Save,
  X
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const TeacherEditSimple: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    user_email: '',
    phone: '',
    qualification: '',
    experience: '',
    primary_subject_id: '',
    address: '',
    base_salary: '',
    bank_name: '',
    bank_account_number: '',
    ifsc_code: '',
    pan_number: '',
    tax_status: 'non_exempt',
    pay_frequency: 'monthly',
  });

  // Fetch teacher details and subjects
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [teacherResponse, subjectsResponse, assignmentsResponse, classesResponse] = await Promise.all([
          api.get(`/teachers/${id}/`),
          api.get('/school/settings/subjects/'),
          api.get(`/teachers/${id}/assignments/`),
          api.get('/school/settings/classes/')
        ]);
        
        const teacherData = teacherResponse.data;
        setTeacher(teacherData);
        
        // Populate form data
        setFormData({
          first_name: teacherData.staff?.user?.name?.split(' ')[0] || '',
          last_name: teacherData.staff?.user?.name?.split(' ').slice(1).join(' ') || '',
          user_email: teacherData.staff?.user?.email || '',
          phone: teacherData.staff?.phone || '',
          qualification: teacherData.qualification || '',
          experience: teacherData.experience || '',
          primary_subject_id: teacherData.primary_subject?.id || '',
          address: teacherData.staff?.address || '',
          base_salary: teacherData.staff?.base_salary || '',
          bank_name: teacherData.staff?.bank_name || '',
          bank_account_number: teacherData.staff?.bank_account_number || '',
          ifsc_code: teacherData.ifsc_code || '',
          pan_number: teacherData.pan_number || '',
          tax_status: teacherData.staff?.tax_status || 'non_exempt',
          pay_frequency: teacherData.staff?.pay_frequency || 'monthly',
        });
        
        setSubjects(subjectsResponse.data || []);
        setAssignments(assignmentsResponse.data || []);
        setClasses(classesResponse.data || []);
      } catch (err) {
        console.error('Error fetching teacher data:', err);
        setError('Failed to load teacher data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
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

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle assignment changes
  const handleAssignmentChange = (index: number, field: string, value: any) => {
    const updatedAssignments = [...assignments];
    updatedAssignments[index][field] = value;
    
    // If class changed, fetch sections for that class
    if (field === 'class_obj' && value) {
      fetchSections(value);
    }
    
    setAssignments(updatedAssignments);
  };
  
  // Add a new assignment
  const addAssignment = async () => {
    try {
      const newAssignment = {
        teacher: id,
        class_obj: '',
        section: '',
        subject: '',
        is_primary: false,
        hours_per_week: 0
      };
      
      const response = await api.post(`/teachers/${id}/add_assignment/`, newAssignment);
      setAssignments([...assignments, response.data]);
      toast.success('Assignment added successfully');
    } catch (err) {
      console.error('Error adding assignment:', err);
      toast.error('Failed to add assignment');
    }
  };
  
  // Remove an assignment
  const removeAssignment = async (assignmentId: number) => {
    try {
      await api.delete(`/teachers/${id}/delete_assignment/?assignment_id=${assignmentId}`);
      setAssignments(assignments.filter(a => a.id !== assignmentId));
      toast.success('Assignment removed successfully');
    } catch (err) {
      console.error('Error removing assignment:', err);
      toast.error('Failed to remove assignment');
    }
  };
  
  // Update an assignment
  const updateAssignment = async (assignment: any) => {
    try {
      await api.put(`/teachers/${id}/update_assignment/`, assignment);
      toast.success('Assignment updated successfully');
      
      // Refresh assignments
      const response = await api.get(`/teachers/${id}/assignments/`);
      setAssignments(response.data);
    } catch (err) {
      console.error('Error updating assignment:', err);
      toast.error('Failed to update assignment');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare data for API - only include essential fields
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name || 'Teacher',
        user_email: formData.user_email,
        user_role: 'teacher',
        user_name: `${formData.first_name} ${formData.last_name || 'Teacher'}`.trim(),
        phone: formData.phone,
        address: formData.address,
        qualification: formData.qualification,
        experience: formData.experience,
        primary_subject_id: formData.primary_subject_id ? parseInt(formData.primary_subject_id as string) : null,
        // Log primary subject ID for debugging
        // This ensures we're sending the correct value
        base_salary: formData.base_salary ? parseFloat(formData.base_salary as string) : 0,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        ifsc_code: formData.ifsc_code,
        pan_number: formData.pan_number,
        // Default values for required fields
        gender: 'male',
        hire_date: teacher.staff?.hire_date || new Date().toISOString().split('T')[0],
        employment_type: 'full_time',
        pay_frequency: formData.pay_frequency,
        tax_status: formData.tax_status,
        staff_role_id: 1,
        department_id: 1
      };
      
      // Update teacher
      console.log('Sending update data:', updateData);
      console.log('Primary subject ID:', formData.primary_subject_id);
      const response = await api.put(`/teachers/${id}/`, updateData);
      console.log('Update response:', response.data);
      toast.success('Teacher updated successfully');
      
      // Force reload to show updated data
      setTimeout(() => {
        // Force a hard reload to clear any cached data
        window.location.href = `/admin/teachers/${id}?t=${new Date().getTime()}`;
      }, 1000);
      
      // Navigate back to teacher detail
      navigate(`/admin/teachers/${id}`);
    } catch (err: any) {
      console.error('Error updating teacher:', err);
      if (err.response && err.response.data) {
        console.error('Error details:', err.response.data);
        toast.error(`Failed to update teacher: ${JSON.stringify(err.response.data)}`);
      } else {
        toast.error('Failed to update teacher');  
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !teacher) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
        <p>{error}</p>
        <Button variant="outline" onClick={() => navigate(`/admin/teachers/${id}`)}>
          Back to Teacher Details
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
            onClick={() => navigate(`/admin/teachers/${id}`)}
            icon={<ArrowLeft size={16} />}
          >
            Back to Teacher Details
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit Teacher: {teacher?.staff?.user?.name || 'Teacher'}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/teachers/${id}`)}
            icon={<X size={16} />}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            icon={<Save size={16} />}
            disabled={isLoading}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card title="Basic Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="user_email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="user_email"
                name="user_email"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.user_email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
              <textarea
                id="address"
                name="address"
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </div>
        </Card>

        {/* Professional Information */}
        <Card title="Professional Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="qualification" className="block text-sm font-medium text-gray-700">Qualification</label>
              <input
                type="text"
                id="qualification"
                name="qualification"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.qualification}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700">Experience</label>
              <input
                type="text"
                id="experience"
                name="experience"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.experience}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="primary_subject_id" className="block text-sm font-medium text-gray-700">Primary Subject</label>
              <select
                id="primary_subject_id"
                name="primary_subject_id"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.primary_subject_id}
                onChange={handleChange}
              >
                <option value="">Select Subject</option>
                {subjects.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Financial Information */}
        <Card title="Financial Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="base_salary" className="block text-sm font-medium text-gray-700">Base Salary</label>
              <input
                type="number"
                id="base_salary"
                name="base_salary"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.base_salary}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700">Bank Name</label>
              <input
                type="text"
                id="bank_name"
                name="bank_name"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.bank_name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700">Bank Account Number</label>
              <input
                type="text"
                id="bank_account_number"
                name="bank_account_number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.bank_account_number}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="ifsc_code" className="block text-sm font-medium text-gray-700">IFSC Code</label>
              <input
                type="text"
                id="ifsc_code"
                name="ifsc_code"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.ifsc_code}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="pan_number" className="block text-sm font-medium text-gray-700">PAN Number</label>
              <input
                type="text"
                id="pan_number"
                name="pan_number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.pan_number}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="pay_frequency" className="block text-sm font-medium text-gray-700">Pay Frequency</label>
              <select
                id="pay_frequency"
                name="pay_frequency"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.pay_frequency}
                onChange={handleChange}
              >
                <option value="monthly">Monthly</option>
                <option value="bi_weekly">Bi-Weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label htmlFor="tax_status" className="block text-sm font-medium text-gray-700">Tax Status</label>
              <select
                id="tax_status"
                name="tax_status"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.tax_status}
                onChange={handleChange}
              >
                <option value="non_exempt">Non-Exempt</option>
                <option value="exempt">Exempt</option>
              </select>
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
              onClick={addAssignment}
            >
              Add Assignment
            </Button>
          }
        >
          {assignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="mt-1 text-sm text-gray-500">No assignments found. Add a new assignment to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment, index) => (
                <div key={assignment.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">
                      Assignment {index + 1}
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        className="text-red-600 hover:text-red-800"
                        onClick={() => removeAssignment(assignment.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Class</label>
                      <select
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={assignment.class_obj || ''}
                        onChange={(e) => {
                          handleAssignmentChange(index, 'class_obj', parseInt(e.target.value));
                        }}
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
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={assignment.section || ''}
                        onChange={(e) => handleAssignmentChange(index, 'section', parseInt(e.target.value))}
                        disabled={!assignment.class_obj}
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
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={assignment.subject || ''}
                        onChange={(e) => handleAssignmentChange(index, 'subject', parseInt(e.target.value))}
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
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={assignment.hours_per_week || 0}
                        onChange={(e) => handleAssignmentChange(index, 'hours_per_week', parseInt(e.target.value))}
                        min="0"
                      />
                    </div>
                    
                    <div className="flex items-center mt-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={assignment.is_primary || false}
                        onChange={(e) => handleAssignmentChange(index, 'is_primary', e.target.checked)}
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Primary Assignment
                      </label>
                    </div>
                    
                    <div className="md:col-span-3 mt-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => updateAssignment(assignment)}
                        disabled={!assignment.class_obj || !assignment.section || !assignment.subject}
                      >
                        Update Assignment
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TeacherEditSimple;