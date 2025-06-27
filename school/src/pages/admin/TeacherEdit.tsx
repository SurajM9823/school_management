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
import TeacherAssignments from './TeacherAssignments';

const TeacherEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staffRoles, setStaffRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    user_email: '',
    phone: '',
    address: '',
    gender: 'male',
    date_of_birth: '',
    qualification: '',
    experience: '',
    primary_subject_id: '',
    hire_date: '',
    employment_type: 'full_time',
    base_salary: '',
    pay_frequency: 'monthly',
    bank_name: '',
    bank_account_number: '',
    ifsc_code: '',
    pan_number: '',
    staff_role_id: '',
    department_id: '',
    assignments: []
  });

  // Fetch teacher details and other data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [
          teacherResponse, 
          assignmentsResponse, 
          classesResponse, 
          subjectsResponse
        ] = await Promise.all([
          api.get(`/teachers/${id}/`),
          api.get(`/teachers/${id}/assignments/`),
          api.get('/school/settings/classes/'),
          api.get('/school/settings/subjects/')
        ]);
        
        const teacherData = teacherResponse.data;
        setTeacher(teacherData);
        
        // Populate form data
        setFormData({
          first_name: teacherData.staff?.user?.name?.split(' ')[0] || '',
          last_name: teacherData.staff?.user?.name?.split(' ').slice(1).join(' ') || '',
          user_email: teacherData.staff?.user?.email || '',
          phone: teacherData.staff?.phone || '',
          address: teacherData.staff?.address || '',
          gender: teacherData.staff?.gender || 'male',
          date_of_birth: teacherData.staff?.date_of_birth || '',
          qualification: teacherData.qualification || '',
          experience: teacherData.experience || '',
          primary_subject_id: teacherData.primary_subject?.id || '',
          hire_date: teacherData.staff?.hire_date || '',
          employment_type: teacherData.staff?.employment_type || 'full_time',
          base_salary: teacherData.staff?.base_salary || '',
          pay_frequency: teacherData.staff?.pay_frequency || 'monthly',
          bank_name: teacherData.staff?.bank_name || '',
          bank_account_number: teacherData.staff?.bank_account_number || '',
          ifsc_code: teacherData.ifsc_code || '',
          pan_number: teacherData.pan_number || '',
          staff_role_id: teacherData.staff?.staff_role?.id || '1',
          department_id: teacherData.staff?.department?.id || '1',
          assignments: assignmentsResponse.data || []
        });
        
        setClasses(classesResponse.data);
        setSubjects(subjectsResponse.data || []);
        // Set default values for staff roles and departments
        setStaffRoles([{id: 1, name: 'Teacher'}]);
        setDepartments([{id: 1, name: 'Academic'}]);
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare data for API
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name || 'Teacher',  // Provide default value if empty
        user_email: formData.user_email,
        user_role: 'teacher',
        user_name: `${formData.first_name} ${formData.last_name}`.trim(),
        phone: formData.phone,
        address: formData.address,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        qualification: formData.qualification,
        experience: formData.experience,
        primary_subject_id: formData.primary_subject_id ? parseInt(formData.primary_subject_id as string) : null,
        hire_date: formData.hire_date,
        employment_type: formData.employment_type,
        contract_end_date: null,  // Default value
        base_salary: formData.base_salary ? parseFloat(formData.base_salary as string) : 0,
        pay_frequency: formData.pay_frequency,
        tax_status: 'non_exempt',  // Default value
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        ifsc_code: formData.ifsc_code,
        pan_number: formData.pan_number,
        staff_role_id: formData.staff_role_id ? parseInt(formData.staff_role_id as string) : null,
        department_id: formData.department_id ? parseInt(formData.department_id as string) : null
      };
      
      // Update teacher
      console.log('Sending update data:', updateData);
      const response = await api.put(`/teachers/${id}/`, updateData);
      console.log('Update response:', response.data);
      toast.success('Teacher updated successfully');
      
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
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                id="gender"
                name="gender"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.date_of_birth}
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
            <div>
              <label htmlFor="staff_role_id" className="block text-sm font-medium text-gray-700">Staff Role</label>
              <input
                type="text"
                id="staff_role_id"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100"
                value="Teacher"
                disabled
              />
              <input type="hidden" name="staff_role_id" value="1" />
            </div>
            <div>
              <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                id="department_id"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-100"
                value="Academic"
                disabled
              />
              <input type="hidden" name="department_id" value="1" />
            </div>
            <div>
              <label htmlFor="hire_date" className="block text-sm font-medium text-gray-700">Hire Date</label>
              <input
                type="date"
                id="hire_date"
                name="hire_date"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.hire_date}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700">Employment Type</label>
              <select
                id="employment_type"
                name="employment_type"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.employment_type}
                onChange={handleChange}
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="temporary">Temporary</option>
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
          </div>
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

export default TeacherEdit;