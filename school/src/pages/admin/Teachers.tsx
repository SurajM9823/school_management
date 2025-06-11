import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Filter, 
  FileText, 
  Users,
  Check,
  X,
  Eye,
  Download,
  Edit,
  BookOpen,
  Briefcase,
  Mail,
  Phone,
  DollarSign, // For financial info
  CalendarDays, // For leave info
  FilePlus // For document uploads in new section
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { format } from 'date-fns';

// Mock data for teachers
const initialTeachers = [
  {
    id: 1,
    name: 'Alice Wonderland',
    email: 'alice.wonderland@example.com',
    phone: '+1 (555) 111-2222',
    subject: 'Mathematics',
    qualification: 'M.Sc. Mathematics',
    status: 'active' as 'active' | 'inactive' | 'on_leave',
    joiningDate: '2022-08-15',
    experience: '5 years',
    address: '123 Main St, Anytown, USA'
  },
  {
    id: 2,
    name: 'Bob The Builder',
    email: 'bob.builder@example.com',
    phone: '+1 (555) 333-4444',
    subject: 'Physics',
    qualification: 'Ph.D. Physics',
    status: 'active' as 'active' | 'inactive' | 'on_leave',
    joiningDate: '2021-07-01',
    experience: '8 years',
    address: '456 Oak Ave, Anytown, USA'
  },
  {
    id: 3,
    name: 'Carol Danvers',
    email: 'carol.danvers@example.com',
    phone: '+1 (555) 555-6666',
    subject: 'English',
    qualification: 'M.A. English Literature',
    status: 'on_leave' as 'active' | 'inactive' | 'on_leave',
    joiningDate: '2023-01-10',
    experience: '3 years',
    address: '789 Pine Rd, Anytown, USA'
  },
];

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  qualification: string;
  status: 'active' | 'inactive' | 'on_leave';
  joiningDate: string;
  experience: string;
  address: string;
}

const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [showNewTeacherForm, setShowNewTeacherForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Mathematics',
    qualification: '',
    joiningDate: '',
    experience: '',
    address: '',
    gender: 'male',
    dob: '',
    salary: '',
    // Financial Details
    panNumber: '',
    bankAccountNumber: '',
    bankName: '',
    ifscCode: '',
    // Leave Balances - simplified for now
    initialSickLeave: 12, // Default as per requirement
    initialCasualLeave: 0,
    // Tax & Deductions
    taxDeductionPercentage: 0,
    providentFundNumber: '',
    providentFundContributionEmployee: 0, // Percentage or amount
    providentFundContributionEmployer: 0, // Percentage or amount
    otherDeductions: [{ name: '', amount: 0 }],
  });

  // Filter teachers
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || teacher.status === statusFilter;
    const matchesSubject = subjectFilter === 'all' || teacher.subject === subjectFilter;
    
    return matchesSearch && matchesStatus && matchesSubject;
  });

  const handleCreateTeacher = () => {
    // In a real app, this would submit the form data to the server
    console.log('New Teacher Data:', newTeacher);
    // Add the new teacher to the list (mock implementation)
    setTeachers([...teachers, { ...newTeacher, id: teachers.length + 1, status: 'active' }]);
    setShowNewTeacherForm(false);
    setCurrentStep(1);
    // Reset form fields
    setNewTeacher({
      name: '',
      email: '',
      phone: '',
      subject: 'Mathematics',
      qualification: '',
      joiningDate: '',
      experience: '',
      address: '',
      gender: 'male',
      dob: '',
      salary: '',
      panNumber: '',
      bankAccountNumber: '',
      bankName: '',
      ifscCode: '',
      initialSickLeave: 12,
      initialCasualLeave: 0,
      taxDeductionPercentage: 0,
      providentFundNumber: '',
      providentFundContributionEmployee: 0,
      providentFundContributionEmployer: 0,
      otherDeductions: [{ name: '', amount: 0 }],
    });
    };
  
    const handleOtherDeductionChange = (index: number, field: 'name' | 'amount', value: string) => {
      const updatedDeductions = [...newTeacher.otherDeductions];
      if (field === 'amount') {
        updatedDeductions[index][field] = parseFloat(value) || 0;
      } else {
        updatedDeductions[index][field] = value;
      }
      setNewTeacher({ ...newTeacher, otherDeductions: updatedDeductions });
    };
  
    const addOtherDeduction = () => {
      setNewTeacher({ ...newTeacher, otherDeductions: [...newTeacher.otherDeductions, { name: '', amount: 0 }] });
    };
  
    const removeOtherDeduction = (index: number) => {
      const updatedDeductions = newTeacher.otherDeductions.filter((_, i) => i !== index);
      setNewTeacher({ ...newTeacher, otherDeductions: updatedDeductions });
    };
  
  
    const renderTeacherForm = () => {
      switch (currentStep) {
        case 1: // Basic Information
          return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" id="name" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.name} onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})} />
              </div>
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" id="dob" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.dob} onChange={(e) => setNewTeacher({...newTeacher, dob: e.target.value})} />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
                <select id="gender" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.gender} onChange={(e) => setNewTeacher({...newTeacher, gender: e.target.value})}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                <textarea id="address" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.address} onChange={(e) => setNewTeacher({...newTeacher, address: e.target.value})} />
              </div>
            </div>
          );
        case 2: // Contact & Academic Information
          return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="email" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.email} onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})} />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input type="tel" id="phone" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.phone} onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})} />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Primary Subject</label>
                <select id="subject" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.subject} onChange={(e) => setNewTeacher({...newTeacher, subject: e.target.value})}>
                  {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science', 'Physical Education', 'Art'].map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="qualification" className="block text-sm font-medium text-gray-700">Qualification</label>
                <input type="text" id="qualification" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.qualification} onChange={(e) => setNewTeacher({...newTeacher, qualification: e.target.value})} />
              </div>
            </div>
          );
        case 3: // Employment Details
          return (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700">Joining Date</label>
                <input type="date" id="joiningDate" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.joiningDate} onChange={(e) => setNewTeacher({...newTeacher, joiningDate: e.target.value})} />
              </div>
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700">Experience (e.g., 5 years)</label>
                <input type="text" id="experience" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.experience} onChange={(e) => setNewTeacher({...newTeacher, experience: e.target.value})} />
              </div>
               <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Upload Documents (CV, Certificates)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <FilePlus className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload-teacher-employment" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload files</span>
                        <input id="file-upload-teacher-employment" name="file-upload-teacher-employment" type="file" className="sr-only" multiple />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOCX up to 5MB each</p>
                  </div>
                </div>
              </div>
            </div>
          );
        case 4: // Financial & Leave Details
          return (
            <div className="space-y-6">
              {/* Salary & Bank Details */}
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center"><DollarSign size={20} className="mr-2 text-green-600"/>Salary & Bank Details</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="salary" className="block text-sm font-medium text-gray-700">Salary (Monthly)</label>
                    <input type="number" id="salary" placeholder="e.g., 50000" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.salary} onChange={(e) => setNewTeacher({...newTeacher, salary: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700">PAN Number / Tax ID</label>
                    <input type="text" id="panNumber" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.panNumber} onChange={(e) => setNewTeacher({...newTeacher, panNumber: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">Bank Name</label>
                    <input type="text" id="bankName" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.bankName} onChange={(e) => setNewTeacher({...newTeacher, bankName: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700">Bank Account Number</label>
                    <input type="text" id="bankAccountNumber" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.bankAccountNumber} onChange={(e) => setNewTeacher({...newTeacher, bankAccountNumber: e.target.value})} />
                  </div>
                   <div className="sm:col-span-2">
                    <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700">IFSC Code / Swift Code</label>
                    <input type="text" id="ifscCode" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.ifscCode} onChange={(e) => setNewTeacher({...newTeacher, ifscCode: e.target.value})} />
                  </div>
                </div>
              </section>
  
              {/* Tax & Deductions */}
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center"><DollarSign size={20} className="mr-2 text-red-600"/>Tax & Deductions</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="taxDeductionPercentage" className="block text-sm font-medium text-gray-700">Tax Deduction (%)</label>
                    <input type="number" id="taxDeductionPercentage" placeholder="e.g., 10 for 10%" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.taxDeductionPercentage} onChange={(e) => setNewTeacher({...newTeacher, taxDeductionPercentage: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label htmlFor="providentFundNumber" className="block text-sm font-medium text-gray-700">Provident Fund (PF) Number</label>
                    <input type="text" id="providentFundNumber" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.providentFundNumber} onChange={(e) => setNewTeacher({...newTeacher, providentFundNumber: e.target.value})} />
                  </div>
                  <div>
                    <label htmlFor="providentFundContributionEmployee" className="block text-sm font-medium text-gray-700">PF Employee Contrib. (%)</label>
                    <input type="number" id="providentFundContributionEmployee" placeholder="e.g., 12" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.providentFundContributionEmployee} onChange={(e) => setNewTeacher({...newTeacher, providentFundContributionEmployee: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label htmlFor="providentFundContributionEmployer" className="block text-sm font-medium text-gray-700">PF Employer Contrib. (%)</label>
                    <input type="number" id="providentFundContributionEmployer" placeholder="e.g., 12" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.providentFundContributionEmployer} onChange={(e) => setNewTeacher({...newTeacher, providentFundContributionEmployer: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-700 mb-1">Other Deductions (if any)</h4>
                  {newTeacher.otherDeductions.map((deduction, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input type="text" placeholder="Deduction Name" value={deduction.name} onChange={(e) => handleOtherDeductionChange(index, 'name', e.target.value)} className="flex-grow border-gray-300 rounded-md shadow-sm sm:text-sm" />
                      <input type="number" placeholder="Amount" value={deduction.amount} onChange={(e) => handleOtherDeductionChange(index, 'amount', e.target.value)} className="w-28 border-gray-300 rounded-md shadow-sm sm:text-sm" />
                      <Button variant="danger" size="sm" onClick={() => removeOtherDeduction(index)} icon={<Trash2 size={14}/>} />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addOtherDeduction} icon={<PlusCircle size={14}/>}>Add Deduction</Button>
                </div>
              </section>
  
              {/* Initial Leave Balances */}
              <section>
                <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center"><CalendarDays size={20} className="mr-2 text-blue-600"/>Initial Leave Balances</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="initialSickLeave" className="block text-sm font-medium text-gray-700">Sick Leave Balance</label>
                    <input type="number" id="initialSickLeave" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.initialSickLeave} onChange={(e) => setNewTeacher({...newTeacher, initialSickLeave: parseInt(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label htmlFor="initialCasualLeave" className="block text-sm font-medium text-gray-700">Casual Leave Balance</label>
                    <input type="number" id="initialCasualLeave" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newTeacher.initialCasualLeave} onChange={(e) => setNewTeacher({...newTeacher, initialCasualLeave: parseInt(e.target.value) || 0})} />
                  </div>
                  {/* Add more leave types here if needed, perhaps dynamically from settings in a real app */}
                </div>
                 <p className="mt-2 text-xs text-gray-500">Note: Default sick leave is set as per policy. Other leave balances can be set as per prorated entitlement or carry-over from previous employment if applicable.</p>
              </section>
               <div>
                <label className="block text-sm font-medium text-gray-700">Upload Financial/Contract Documents</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <FilePlus className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload-teacher-financial" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload files</span>
                        <input id="file-upload-teacher-financial" name="file-upload-teacher-financial" type="file" className="sr-only" multiple />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PAN Card, Bank Details, Contract, etc.</p>
                  </div>
                </div>
              </div>
            </div>
          );
        default:
          return null;
      }
    };
  
    const totalSteps = 4;
  
    const uniqueSubjects = Array.from(new Set(teachers.map(teacher => teacher.subject)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Teachers</h1>
        <Button
          variant="primary"
          icon={<UserPlus size={16} />}
          onClick={() => setShowNewTeacherForm(!showNewTeacherForm)}
        >
          Add New Teacher
        </Button>
      </div>

      {/* New Teacher Form */}
      {showNewTeacherForm && (
        <Card title={`Add New Teacher - Step ${currentStep} of ${totalSteps}`}>
          <div className="mb-8">
            <div className="relative">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div 
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300"
                ></div>
              </div>
              <div className="flex justify-between">
                {Array.from({ length: totalSteps }).map((_, index) => {
                  const stepNum = index + 1;
                  const isActive = currentStep === stepNum;
                  const isCompleted = currentStep > stepNum;
                  
                  return (
                    <div key={index} className="flex flex-col items-center w-1/3">
                      <div
                        className={`flex items-center justify-center h-8 w-8 rounded-full transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isCompleted ? <Check className="h-5 w-5" /> : <span>{stepNum}</span>}
                      </div>
                      <span className="mt-2 text-xs text-gray-500 text-center">
                        {stepNum === 1 ? 'Basic Info' : stepNum === 2 ? 'Contact & Academic' : stepNum === 3 ? 'Employment' : 'Financial & Leave'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {renderTeacherForm()}
          
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
            ) : (
              <Button variant="outline" onClick={() => {setShowNewTeacherForm(false); setCurrentStep(1);}}>Cancel</Button>
            )}
            
            {currentStep < totalSteps ? (
              <Button variant="primary" onClick={() => setCurrentStep(currentStep + 1)}>Next</Button>
            ) : (
              <Button variant="primary" onClick={handleCreateTeacher}>Add Teacher</Button>
            )}
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Teachers</dt>
                <dd className="text-2xl font-semibold text-gray-900">{teachers.length}</dd>
              </dl>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <Check className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Active Teachers</dt>
                <dd className="text-2xl font-semibold text-gray-900">{teachers.filter(t => t.status === 'active').length}</dd>
              </dl>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Teachers On Leave</dt>
                <dd className="text-2xl font-semibold text-gray-900">{teachers.filter(t => t.status === 'on_leave').length}</dd>
              </dl>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Search teachers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BookOpen className="h-5 w-5 text-gray-400" />
            </div>
            <select className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Teachers List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Teacher Roster</h3>
          <p className="mt-1 text-sm text-gray-500">Total {filteredTeachers.length} teachers found</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">{teacher.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                        <div className="text-xs text-gray-500">{teacher.qualification}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center"><Mail size={14} className="mr-1 text-gray-400"/>{teacher.email}</div>
                    <div className="text-sm text-gray-500 flex items-center"><Phone size={14} className="mr-1 text-gray-400"/>{teacher.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      {teacher.subject}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{format(new Date(teacher.joiningDate), 'MMM dd, yyyy')}</div>
                    <div className="text-xs text-gray-500">{teacher.experience} experience</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        teacher.status === 'active' ? 'bg-green-100 text-green-800'
                        : teacher.status === 'on_leave' ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {teacher.status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900" title="View Details"><Eye size={16} /></button>
                      <button className="text-yellow-600 hover:text-yellow-900" title="Edit Teacher"><Edit size={16} /></button>
                      <button className="text-gray-500 hover:text-gray-700" title="Download Profile"><Download size={16} /></button>
                      {/* Add more actions like deactivate/activate */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTeachers.length === 0 && (
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teachers;