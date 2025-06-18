import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Briefcase, User, DollarSign, Calendar, FileText, Upload, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import jsPDF from 'jspdf';

interface Staff {
  id: number;
  user: {
    email: string;
    name: string;
    role: string;
    avatar?: string;
  };
  school: {
    school_id: string;
    name: string;
  };
  staff_role: {
    name: string;
  } | null;
  department: {
    name: string;
  } | null;
  employee_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  hire_date: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'temporary';
  contract_end_date?: string;
  status: 'active' | 'on_leave' | 'terminated';
  classes: { id: number; name: string }[];
  subjects: { id: number; name: string }[];
  base_salary: number;
  pay_frequency: 'weekly' | 'bi_weekly' | 'monthly';
  tax_status: 'exempt' | 'non_exempt';
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  bank_account_number?: string;
  bank_name?: string;
  bank_branch?: string;
  health_insurance_number?: string;
  pension_plan_number?: string;
  provident_fund_number?: string;
  profile_image?: string;
  leaves: {
    id: number;
    leave_type: string ;
    academic_session: string ;
    start_date: string;
    end_date?: string;
    days: number;
    reason?: string;
  }[];
}

interface ProfileImageForm {
  profilePicture: FileList;
}

const StaffDetailDrill: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileImageForm>();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login');
      toast.error('Please log in.');
      setIsLoading(false);
      return;
    }

    if (user.role !== 'admin') {
      navigate('/login');
      toast.error('Unauthorized access. Please log in as admin.');
      setIsLoading(false);
      return;
    }

    fetchStaffDetails();
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [id, user, loading, navigate, imagePreview]);

  const fetchStaffDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/school/settings/staff/${id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      setStaff(response.data);
      if (response.data.profile_image) {
        setImagePreview(response.data.profile_image);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to load staff details.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitProfileImage = async () => {
    if (!selectedFile) {
      toast.error('Please select an image.');
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('profile_image', selectedFile);
      const response = await api.post(`/school/settings/staff/${id}/profile-image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      setStaff(prev => prev ? { ...prev, profile_image: response.data.profile_image } : null);
      setImagePreview(response.data.profile_image);
      toast.success('Profile image updated successfully.');
      setSelectedFile(null);
      reset();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to upload profile image.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setSelectedFile(file);
    }
  };

  const downloadSummaryPDF = () => {
    if (!staff) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${staff.first_name} ${staff.last_name} - Staff Summary`, 15, 15);
    doc.setFontSize(10);
    doc.text(`Employee ID: ${staff.employee_id}`, 15, 25);
    doc.text(`Role: ${staff.user.role.replace('_', ' ').toUpperCase()}`, 15, 35);
    doc.text(`Staff Role: ${staff.staff_role?.name || 'N/A'}`, 15, 45);
    doc.text(`Status: ${staff.status.replace('_', ' ').toUpperCase()}`, 15, 55);
    doc.text(`Email: ${staff.user.email}`, 15, 65);
    doc.text(`Phone: ${staff.phone || 'N/A'}`, 15, 75);
    doc.text(`Department: ${staff.department?.name || 'N/A'}`, 15, 85);
    doc.text(`Hire Date: ${format(parseISO(staff.hire_date), 'MMM dd, yyyy')}`, 15, 95);
    doc.text(`Base Salary: ${staff.base_salary} NPR`, 15, 105);
    doc.save(`${staff.first_name}_${staff.last_name}_summary.pdf`);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'employment', label: 'Employment', icon: Briefcase },
    { id: 'payroll', label: 'Payroll', icon: DollarSign },
    { id: 'benefits', label: 'Benefits', icon: FileText },
    { id: 'leaves', label: 'Leaves', icon: Calendar },
  ];

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-4 text-red-500 text-xs">
          {error}
          <Button variant="outline" size="sm" className="ml-3" onClick={fetchStaffDetails}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!staff) {
    return <Card><div className="text-center py-4 text-gray-500 text-xs">Staff not found.</div></Card>;
  }

  return (
    <div className="max-w-6xl mx-auto py-4 px-3 sm:px-4 lg:px-6 space-y-4 bg-gray-50">
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-800 flex items-center">
          <Briefcase size={20} className="mr-2 text-blue-500" /> Staff Details
        </h1>
        <Button
          variant="primary"
          size="sm"
          icon={<Download size={14} />}
          onClick={downloadSummaryPDF}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5"
        >
          Download Summary
        </Button>
      </div>

      <Card className="shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
          <div className="w-full lg:w-1/4 flex flex-col items-center space-y-4">
            <form onSubmit={handleSubmit(onSubmitProfileImage)} className="w-full flex flex-col items-center">
              <div className="relative">
                <img
                  src={imagePreview || 'https://via.placeholder.com/120'}
                  alt={`${staff.first_name} ${staff.last_name}`}
                  className="h-32 w-32 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                />
                <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2 shadow-md">
                  <label htmlFor="profilePicture" className="cursor-pointer">
                    <Upload size={14} className="text-white" />
                    <input
                      id="profilePicture"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      {...register('profilePicture', {
                        validate: (files) => {
                          if (!files || files.length === 0) return true;
                          const file = files[0];
                          const validTypes = ['image/png', 'image/jpeg'];
                          const maxSize = 2 * 1024 * 1024; // 2MB
                          if (!validTypes.includes(file.type)) {
                            return 'Only PNG or JPG images are allowed';
                          }
                          if (file.size > maxSize) {
                            return 'Image must be less than 2MB';
                          }
                          return true;
                        },
                      })}
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              {errors.profilePicture && (
                <p className="mt-1 text-xs text-red-500">{errors.profilePicture.message}</p>
              )}
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="mt-3 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 w-full max-w-40"
                disabled={isLoading || !selectedFile}
              >
                {isLoading ? 'Saving...' : 'Save Image'}
              </Button>
            </form>
            <div className="text-center space-y-1">
              <h2 className="text-lg font-medium text-gray-800">{staff.first_name} {staff.last_name}</h2>
              <p className="text-xs text-gray-500 capitalize">{staff.user.role.replace('_', ' ')}</p>
              <p className="text-xs text-gray-500">{staff.staff_role?.name || 'No specific role'}</p>
              <p className="text-xs font-medium capitalize">
                Status:{' '}
                <span
                  className={`text-${staff.status === 'active' ? 'green' : staff.status === 'on_leave' ? 'yellow' : 'red'}-500`}
                >
                  {staff.status.replace('_', ' ')}
                </span>
              </p>
            </div>
          </div>
          <div className="hidden lg:block border-l border-gray-200"></div>
          <div className="w-full lg:w-3/4 space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-800">Summary</h3>
              <p className="text-xs text-gray-600 mt-1">
                {staff.user.role === 'teacher' ? (
                  `Teaches ${staff.subjects.length > 0 ? staff.subjects.map(s => s.name).join(', ') : 'no subjects'} in ${staff.classes.length > 0 ? staff.classes.map(c => c.name).join(', ') : 'no classes'}.`
                ) : staff.user.role === 'admin' ? (
                  `Manages school operations and staff for ${staff.school.name}.`
                ) : staff.user.role === 'accountant' ? (
                  `Handles financial records and payroll for ${staff.school.name}.`
                ) : 'No specific role summary available.'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600">Employee ID</p>
                <p className="text-xs text-gray-800">{staff.employee_id}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Department</p>
                <p className="text-xs text-gray-800">{staff.department?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Hire Date</p>
                <p className="text-xs text-gray-800">{format(parseISO(staff.hire_date), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Email</p>
                <p className="text-xs text-gray-800">{staff.user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-4 py-1.5" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2 text-xs font-medium rounded-t-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white border border-b-0 border-gray-200 text-blue-500 shadow-sm'
                    : 'text-gray-600 hover:text-blue-500 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={14} className="mr-1" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4">
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600">First Name</p>
                <p className="text-xs text-gray-800">{staff.first_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Last Name</p>
                <p className="text-xs text-gray-800">{staff.last_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Date of Birth</p>
                <p className="text-xs text-gray-800">{staff.date_of_birth ? format(parseISO(staff.date_of_birth), 'MMM dd, yyyy') : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Gender</p>
                <p className="text-xs text-gray-800 capitalize">{staff.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Address</p>
                <p className="text-xs text-gray-800">{staff.address || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Phone</p>
                <p className="text-xs text-gray-800">{staff.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Emergency Contact</p>
                <p className="text-xs text-gray-800">{staff.emergency_contact_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Emergency Phone</p>
                <p className="text-xs text-gray-800">{staff.emergency_contact_phone || 'N/A'}</p>
              </div>
            </div>
          )}
          {activeTab === 'employment' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600">Staff Role</p>
                <p className="text-xs text-gray-800">{staff.staff_role?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Employment Type</p>
                <p className="text-xs text-gray-800 capitalize">{staff.employment_type.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Hire Date</p>
                <p className="text-xs text-gray-800">{format(parseISO(staff.hire_date), 'MMM dd, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Contract End Date</p>
                <p className="text-xs text-gray-800">{staff.contract_end_date ? format(parseISO(staff.contract_end_date), 'MMM dd, yyyy') : 'N/A'}</p>
              </div>
              {staff.user.role === 'teacher' && (
                <>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Classes</p>
                    <p className="text-xs text-gray-800">{staff.classes.length > 0 ? staff.classes.map(c => c.name).join(', ') : 'None'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Subjects</p>
                    <p className="text-xs text-gray-800">{staff.subjects.length > 0 ? staff.subjects.map(s => s.name).join(', ') : 'None'}</p>
                  </div>
                </>
              )}
            </div>
          )}
          {activeTab === 'payroll' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600">Base Salary</p>
                <p className="text-xs text-gray-800">{staff.base_salary} NPR</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Pay Frequency</p>
                <p className="text-xs text-gray-800 capitalize">{staff.pay_frequency.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Tax Status</p>
                <p className="text-xs text-gray-800 capitalize">{staff.tax_status.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Bank Account</p>
                <p className="text-xs text-gray-800">{staff.bank_account_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Bank Name</p>
                <p className="text-xs text-gray-800">{staff.bank_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Bank Branch</p>
                <p className="text-xs text-gray-800">{staff.bank_branch || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Allowances</p>
                <p className="text-xs text-gray-800">
                  {Object.entries(staff.allowances).length > 0
                    ? Object.entries(staff.allowances).map(([key, value]) => `${key}: ${value} NPR`).join(', ')
                    : 'None'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Deductions</p>
                <p className="text-xs text-gray-800">
                  {Object.entries(staff.deductions).length > 0
                    ? Object.entries(staff.deductions).map(([key, value]) => `${key}: ${value} NPR`).join(', ')
                    : 'None'}
                </p>
              </div>
            </div>
          )}
          {activeTab === 'benefits' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600">Health Insurance Number</p>
                <p className="text-xs text-gray-800">{staff.health_insurance_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Pension Plan Number</p>
                <p className="text-xs text-gray-800">{staff.pension_plan_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600">Provident Fund Number</p>
                <p className="text-xs text-gray-800">{staff.provident_fund_number || 'N/A'}</p>
              </div>
            </div>
          )}
          {activeTab === 'leaves' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 bg-white rounded-sm shadow-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {staff.leaves.length > 0 ? (
                    staff.leaves.map((leave, index) => (
                      <tr key={leave.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                        <td className="px-4 py-2 text-xs text-gray-800">{leave.leave_type || 'Unknown'}</td>
                        <td className="px-4 py-2 text-xs text-gray-800">{leave.academic_session || 'Unknown'}</td>
                        <td className="px-4 py-2 text-xs text-gray-800">{format(parseISO(leave.start_date), 'MMM dd, yyyy')}</td>
                        <td className="px-4 py-2 text-xs text-gray-800">{leave.end_date ? format(parseISO(leave.end_date), 'MMM dd, yyyy') : 'N/A'}</td>
                        <td className="px-4 py-2 text-xs text-gray-800">{leave.days}</td>
                        <td className="px-4 py-2 text-xs text-gray-800">{leave.reason || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-2 text-xs text-gray-500 text-center">No leave records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default StaffDetailDrill;