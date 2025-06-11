import React, { useState } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  Users,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  CalendarDays,
  ListFilter, // For application status filter
  UserCheck, // For awarding
  UserX // For rejecting
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { format } from 'date-fns';

// Mock data for scholarships
const initialScholarshipsData = [
  {
    id: 1,
    name: 'Merit Scholarship Program',
    description: 'For students with outstanding academic performance.',
    eligibility: { generalCriteria: 'Top 5% in previous grade, 90%+ overall average.', minOverallPercentage: 90 },
    amount: 5000,
    type: 'merit-based' as Scholarship['type'],
    applicationDeadline: '2024-10-31',
    status: 'open' as Scholarship['status'],
    numberOfAwards: 10,
    awardedTo: [],
  },
  {
    id: 2,
    name: 'Financial Aid Grant',
    description: 'To support students from economically weaker sections.',
    eligibility: { generalCriteria: 'Family income below specified threshold, good academic standing.' },
    amount: 3000,
    type: 'need-based' as Scholarship['type'],
    applicationDeadline: '2024-11-15',
    status: 'open' as Scholarship['status'],
    numberOfAwards: 20,
    awardedTo: [
        { studentId: 'S0901', studentName: 'Diana Prince', scholarshipId: 2, applicationDate: '2024-09-05', status: 'awarded' as ScholarshipApplication['status'], remarks: "Excellent need case." }
    ],
  },
  {
    id: 3,
    name: 'Sports Excellence Award',
    description: 'For students excelling in state/national level sports.',
    eligibility: { generalCriteria: 'Participation in recognized sports events, recommendation from coach.' },
    amount: 4000,
    type: 'sports' as Scholarship['type'],
    applicationDeadline: '2024-09-30',
    status: 'awarded' as Scholarship['status'],
    numberOfAwards: 5,
    awardedTo: [], // Example: populate if some were awarded
  },
];

// Mock student data (simplified, ideally from a shared context or API)
const mockStudents = [
  { id: 'S1001', name: 'Alice Smith', class: '10', mockExamScore: 92, mockOverallPercentage: 90.5 },
  { id: 'S1002', name: 'Bob Johnson', class: '10', mockExamScore: 85, mockOverallPercentage: 88.0 },
  { id: 'S1003', name: 'Charlie Brown', class: '10', mockExamScore: 95, mockOverallPercentage: 94.2 },
  { id: 'S0901', name: 'Diana Prince', class: '9', mockExamScore: 88, mockOverallPercentage: 85.0 },
];

interface ScholarshipEligibilityCriteria {
  generalCriteria: string; // Existing text field
  minOverallPercentage?: number;
  minExamPercentage?: number; // For a specific exam
  linkedExamId?: string; // ID of an exam from Exams module (hypothetical)
  maxRankInExam?: number;
  // Add other specific criteria as needed
}

interface Scholarship {
  id: number;
  name: string;
  description: string;
  eligibility: ScholarshipEligibilityCriteria; // Changed from string
  amount: number; // or string for "Varies"
  type: 'merit-based' | 'need-based' | 'sports' | 'arts' | 'other';
  applicationDeadline: string;
  status: 'open' | 'closed' | 'under_review' | 'awarded' | 'discontinued';
  numberOfAwards?: number; // Optional
  // applicants?: number; // This will be derived from ScholarshipApplication[]
  awardedTo?: ScholarshipApplication[]; // Store who it was awarded to
  awardDate?: string; // Optional
  renewalCriteria?: string; // Optional
}

interface ScholarshipApplication {
  studentId: string;
  studentName: string; // For convenience
  scholarshipId: number;
  applicationDate: string;
  status: 'applied' | 'shortlisted' | 'awarded' | 'rejected' | 'waitlisted';
  // Potentially store a snapshot of relevant scores/data at time of application
  remarks?: string;
}


const ScholarshipTypes = ['merit-based', 'need-based', 'sports', 'arts', 'other'];
const ScholarshipStatuses = ['open', 'closed', 'under_review', 'awarded', 'discontinued'];

const Scholarships: React.FC = () => {
  const [scholarships, setScholarships] = useState<Scholarship[]>(initialScholarshipsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewScholarshipForm, setShowNewScholarshipForm] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);

  // State for Manage Applications Modal
  const [showManageApplicationsModal, setShowManageApplicationsModal] = useState(false);
  const [selectedScholarshipForApps, setSelectedScholarshipForApps] = useState<Scholarship | null>(null);
  // Mock applications - in a real app, this would be fetched or managed more robustly
  const [scholarshipApplications, setScholarshipApplications] = useState<ScholarshipApplication[]>([
    { studentId: 'S1001', studentName: 'Alice Smith', scholarshipId: 1, applicationDate: '2024-09-01', status: 'applied' },
    { studentId: 'S1002', studentName: 'Bob Johnson', scholarshipId: 1, applicationDate: '2024-09-02', status: 'shortlisted' },
    { studentId: 'S1003', studentName: 'Charlie Brown', scholarshipId: 1, applicationDate: '2024-09-03', status: 'applied' },
    { studentId: 'S0901', studentName: 'Diana Prince', scholarshipId: 2, applicationDate: '2024-09-05', status: 'awarded', remarks: "Excellent need case." },
  ]);


  const [newScholarship, setNewScholarship] = useState<Omit<Scholarship, 'id' | 'awardedTo'>>({
    name: '',
    description: '',
    eligibility: { generalCriteria: '' },
    amount: 0,
    type: 'merit-based',
    applicationDeadline: '',
    status: 'open',
    numberOfAwards: 1,
    // applicants: 0, // Removed, will be dynamic
  });

  // Filter scholarships
  const filteredScholarships = scholarships.filter(scholarship => {
    const matchesSearch = scholarship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scholarship.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || scholarship.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || scholarship.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateOrUpdateScholarship = () => {
    if (editingScholarship) {
      setScholarships(scholarships.map(sch =>
        sch.id === editingScholarship.id
        ? { ...editingScholarship, ...newScholarship, eligibility: { ...editingScholarship.eligibility, ...newScholarship.eligibility } }
        : sch
      ));
      setEditingScholarship(null);
    } else {
      const newId = scholarships.length > 0 ? Math.max(...scholarships.map(s => s.id)) + 1 : 1;
      setScholarships([...scholarships, { ...newScholarship, id: newId, awardedTo: [] }]);
    }
    setShowNewScholarshipForm(false);
    resetNewScholarshipForm();
  };

  const resetNewScholarshipForm = () => {
    setNewScholarship({
      name: '',
      description: '',
      eligibility: { generalCriteria: '' },
      amount: 0,
      type: 'merit-based',
      applicationDeadline: '',
      status: 'open',
      numberOfAwards: 1,
    });
  };

  const handleEditScholarship = (scholarship: Scholarship) => {
    setEditingScholarship(scholarship);
    setNewScholarship({
      name: scholarship.name,
      description: scholarship.description,
      eligibility: { ...scholarship.eligibility },
      amount: scholarship.amount,
      type: scholarship.type,
      applicationDeadline: scholarship.applicationDeadline,
      status: scholarship.status,
      numberOfAwards: scholarship.numberOfAwards,
      awardDate: scholarship.awardDate,
      renewalCriteria: scholarship.renewalCriteria,
    });
    setShowNewScholarshipForm(true);
  };

  const handleDeleteScholarship = (id: number) => {
    setScholarships(scholarships.filter(sch => sch.id !== id));
  };

  const handleOpenManageApplicationsModal = (scholarship: Scholarship) => {
    setSelectedScholarshipForApps(scholarship);
    setShowManageApplicationsModal(true);
  };

  const handleUpdateApplicationStatus = (scholarshipId: number, studentId: string, newStatus: ScholarshipApplication['status']) => {
    setScholarshipApplications(prevApps =>
      prevApps.map(app =>
        app.scholarshipId === scholarshipId && app.studentId === studentId
          ? { ...app, status: newStatus }
          : app
      )
    );
    // Additionally, update the scholarship's awardedTo list if status is 'awarded' or 'applied' (for revoke)
    if (newStatus === 'awarded' || (newStatus === 'applied' && scholarships.find(s=>s.id === scholarshipId)?.awardedTo?.find(aw => aw.studentId === studentId))) {
        setScholarships(prevSchs => prevSchs.map(sch => {
            if (sch.id === scholarshipId) {
                let updatedAwardedTo = [...(sch.awardedTo || [])];
                const applicationDetails = scholarshipApplications.find(app => app.studentId === studentId && app.scholarshipId === scholarshipId);

                if (newStatus === 'awarded' && applicationDetails) {
                    if (!updatedAwardedTo.find(aw => aw.studentId === studentId)) { // Add if not already there
                        updatedAwardedTo.push({...applicationDetails, status: 'awarded'});
                    }
                } else if (newStatus === 'applied') { // Revoking
                    updatedAwardedTo = updatedAwardedTo.filter(aw => aw.studentId !== studentId);
                }
                return { ...sch, awardedTo: updatedAwardedTo };
            }
            return sch;
        }));
    }
  };


  const renderScholarshipForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="scholarshipName" className="block text-sm font-medium text-gray-700">Scholarship Name</label>
          <input type="text" id="scholarshipName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.name} onChange={(e) => setNewScholarship({...newScholarship, name: e.target.value})} />
        </div>
        <div>
          <label htmlFor="scholarshipType" className="block text-sm font-medium text-gray-700">Type</label>
          <select id="scholarshipType" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.type} onChange={(e) => setNewScholarship({...newScholarship, type: e.target.value as Scholarship['type']})}>
            {ScholarshipTypes.map(type => <option key={type} value={type}>{type.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea id="description" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.description} onChange={(e) => setNewScholarship({...newScholarship, description: e.target.value})} />
      </div>
      <div>
        <label htmlFor="eligibilityCriteria" className="block text-sm font-medium text-gray-700">General Eligibility Criteria</label>
        <textarea id="eligibilityCriteria" rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.eligibility?.generalCriteria || ''} onChange={(e) => setNewScholarship({...newScholarship, eligibility: { ...newScholarship.eligibility, generalCriteria: e.target.value }})} />
      </div>

      {newScholarship.type === 'merit-based' && (
        <div className="p-4 border border-blue-200 rounded-md bg-blue-50 space-y-4">
          <h4 className="text-sm font-medium text-blue-700">Merit-Specific Criteria</h4>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="minOverallPercentage" className="block text-xs font-medium text-gray-600">Min. Overall % (Optional)</label>
              <input type="number" id="minOverallPercentage" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1 px-2 sm:text-xs" value={newScholarship.eligibility?.minOverallPercentage || ''} onChange={(e) => setNewScholarship({...newScholarship, eligibility: { ...newScholarship.eligibility, minOverallPercentage: parseFloat(e.target.value) || undefined }})} />
            </div>
            <div>
              <label htmlFor="linkedExamId" className="block text-xs font-medium text-gray-600">Relevant Exam (Optional)</label>
              <input type="text" id="linkedExamId" placeholder="e.g., Annual Exam ID" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1 px-2 sm:text-xs" value={newScholarship.eligibility?.linkedExamId || ''} onChange={(e) => setNewScholarship({...newScholarship, eligibility: { ...newScholarship.eligibility, linkedExamId: e.target.value }})} />
            </div>
            <div>
              <label htmlFor="minExamPercentage" className="block text-xs font-medium text-gray-600">Min. % in Exam (Optional)</label>
              <input type="number" id="minExamPercentage" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1 px-2 sm:text-xs" value={newScholarship.eligibility?.minExamPercentage || ''} onChange={(e) => setNewScholarship({...newScholarship, eligibility: { ...newScholarship.eligibility, minExamPercentage: parseFloat(e.target.value) || undefined }})} />
            </div>
            <div>
              <label htmlFor="maxRankInExam" className="block text-xs font-medium text-gray-600">Max Rank in Exam (Optional)</label>
              <input type="number" id="maxRankInExam" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1 px-2 sm:text-xs" value={newScholarship.eligibility?.maxRankInExam || ''} onChange={(e) => setNewScholarship({...newScholarship, eligibility: { ...newScholarship.eligibility, maxRankInExam: parseInt(e.target.value) || undefined }})} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (USD)</label>
          <input type="number" id="amount" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.amount} onChange={(e) => setNewScholarship({...newScholarship, amount: parseFloat(e.target.value) || 0})} />
        </div>
        <div>
          <label htmlFor="applicationDeadline" className="block text-sm font-medium text-gray-700">Application Deadline</label>
          <input type="date" id="applicationDeadline" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.applicationDeadline} onChange={(e) => setNewScholarship({...newScholarship, applicationDeadline: e.target.value})} />
        </div>
        <div>
          <label htmlFor="numberOfAwards" className="block text-sm font-medium text-gray-700">Number of Awards (Optional)</label>
          <input type="number" id="numberOfAwards" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.numberOfAwards || ''} onChange={(e) => setNewScholarship({...newScholarship, numberOfAwards: parseInt(e.target.value) || undefined})} />
        </div>
        <div>
          <label htmlFor="scholarshipStatus" className="block text-sm font-medium text-gray-700">Status</label>
          <select id="scholarshipStatus" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.status} onChange={(e) => setNewScholarship({...newScholarship, status: e.target.value as Scholarship['status']})}>
            {ScholarshipStatuses.map(status => <option key={status} value={status}>{status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</option>)}
          </select>
        </div>
      </div>
       <div>
        <label htmlFor="awardDate" className="block text-sm font-medium text-gray-700">Award Date (Optional, if status is 'Awarded')</label>
        <input type="date" id="awardDate" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.awardDate || ''} onChange={(e) => setNewScholarship({...newScholarship, awardDate: e.target.value})} />
      </div>
      <div>
        <label htmlFor="renewalCriteria" className="block text-sm font-medium text-gray-700">Renewal Criteria (Optional)</label>
        <textarea id="renewalCriteria" rows={2} placeholder="e.g., Maintain a GPA of 3.5" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.renewalCriteria || ''} onChange={(e) => setNewScholarship({...newScholarship, renewalCriteria: e.target.value})} />
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={() => { setShowNewScholarshipForm(false); setEditingScholarship(null); resetNewScholarshipForm(); }}>Cancel</Button>
        <Button variant="primary" onClick={handleCreateOrUpdateScholarship}>{editingScholarship ? 'Update Scholarship' : 'Create Scholarship'}</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Scholarships</h1>
        <Button
          variant="primary"
          icon={<PlusCircle size={16} />}
          onClick={() => { setEditingScholarship(null); resetNewScholarshipForm(); setShowNewScholarshipForm(true); }}
        >
          Add New Scholarship
        </Button>
      </div>

      {/* New/Edit Scholarship Form */}
      {showNewScholarshipForm && (
        <Card title={editingScholarship ? `Edit Scholarship: ${editingScholarship.name}` : "Add New Scholarship Program"}>
          {renderScholarshipForm()}
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3"><Award className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><dt className="text-sm font-medium text-gray-500 truncate">Total Programs</dt><dd className="text-2xl font-semibold text-gray-900">{scholarships.length}</dd></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3"><CheckCircle className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><dt className="text-sm font-medium text-gray-500 truncate">Open for Applications</dt><dd className="text-2xl font-semibold text-gray-900">{scholarships.filter(s => s.status === 'open').length}</dd></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3"><Users className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><dt className="text-sm font-medium text-gray-500 truncate">Total Applications (All)</dt><dd className="text-2xl font-semibold text-gray-900">{scholarshipApplications.length}</dd></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3"><DollarSign className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><dt className="text-sm font-medium text-gray-500 truncate">Total Awarded Value (Approx)</dt><dd className="text-2xl font-semibold text-gray-900">${scholarships.filter(s => s.status === 'awarded').reduce((sum, s) => sum + (s.amount * (s.numberOfAwards || 1)), 0).toLocaleString()}</dd></div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Search by name or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Filter className="h-5 w-5 text-gray-400" /></div>
            <select className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              {ScholarshipTypes.map(type => <option key={type} value={type}>{type.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</option>)}
            </select>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Filter className="h-5 w-5 text-gray-400" /></div>
            <select className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              {ScholarshipStatuses.map(status => <option key={status} value={status}>{status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Scholarships List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Scholarship Programs</h3>
          <p className="mt-1 text-sm text-gray-500">Total {filteredScholarships.length} programs found</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Awards / Applied</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredScholarships.map((scholarship) => (
                <tr key={scholarship.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{scholarship.name}</div>
                    <div className="text-xs text-gray-500">{scholarship.type.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${scholarship.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {format(new Date(scholarship.applicationDeadline), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {scholarship.numberOfAwards || 'N/A'} / {scholarshipApplications.filter(app => app.scholarshipId === scholarship.id).length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        scholarship.status === 'open' ? 'bg-green-100 text-green-800' :
                        scholarship.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        scholarship.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                        scholarship.status === 'awarded' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800' // discontinued
                      }`}
                    >
                      {scholarship.status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      <Button variant="icon" size="sm" onClick={() => alert(`Viewing details for ${scholarship.name}`)} title="View Details"><Eye size={16} /></Button>
                      <Button variant="icon" size="sm" onClick={() => handleEditScholarship(scholarship)} title="Edit Scholarship"><Edit size={16} className="text-yellow-600 hover:text-yellow-700" /></Button>
                      <Button variant="icon" size="sm" onClick={() => handleOpenManageApplicationsModal(scholarship)} title="Manage Applications"><FileText size={16} className="text-indigo-600 hover:text-indigo-700"/></Button>
                      <Button variant="icon" size="sm" onClick={() => handleDeleteScholarship(scholarship.id)} title="Delete Scholarship"><Trash2 size={16} className="text-red-600 hover:text-red-700" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredScholarships.length === 0 && (
          <div className="text-center py-10">
            <Award className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No scholarships found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter, or add a new scholarship program.</p>
          </div>
        )}
      </div>

      {/* Manage Applications Modal */}
      {showManageApplicationsModal && selectedScholarshipForApps && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-70 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <Card title={`Manage Applications: ${selectedScholarshipForApps.name}`} className="w-full max-w-4xl bg-white shadow-xl rounded-lg">
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <p className="text-sm text-gray-600 mb-1">Total Awards Available: {selectedScholarshipForApps.numberOfAwards || 'N/A'}</p>
              <p className="text-sm text-gray-600 mb-4">Currently Awarded: {scholarshipApplications.filter(app => app.scholarshipId === selectedScholarshipForApps.id && app.status === 'awarded').length}</p>
              
              {/* TODO: Add filters for application status */}
              <table className="min-w-full divide-y divide-gray-200 mb-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Applied On</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">(Mock) Score</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scholarshipApplications.filter(app => app.scholarshipId === selectedScholarshipForApps!.id).map(app => {
                    const student = mockStudents.find(s => s.id === app.studentId);
                    const isAwarded = app.status === 'awarded';
                    const awardedCount = scholarshipApplications.filter(a => a.scholarshipId === selectedScholarshipForApps!.id && a.status === 'awarded').length;
                    const canAwardMore = selectedScholarshipForApps.numberOfAwards === undefined || awardedCount < selectedScholarshipForApps.numberOfAwards;

                    return (
                      <tr key={app.studentId}>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{student?.name || app.studentName}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{student?.class || 'N/A'}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{format(new Date(app.applicationDate), 'MMM dd, yyyy')}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{student?.mockExamScore || 'N/A'}</td>
                        <td className="px-3 py-2 text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            app.status === 'awarded' ? 'bg-green-100 text-green-800' :
                            app.status === 'shortlisted' ? 'bg-yellow-100 text-yellow-800' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            app.status === 'waitlisted' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}`}>
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm space-x-1">
                          {!isAwarded && app.status !== 'rejected' && canAwardMore && (
                             <Button variant="success" size="sm" onClick={() => handleUpdateApplicationStatus(app.scholarshipId, app.studentId, 'awarded')} icon={<UserCheck size={14}/>}>Award</Button>
                          )}
                          {isAwarded && (
                             <Button variant="warning" size="sm" onClick={() => handleUpdateApplicationStatus(app.scholarshipId, app.studentId, 'applied')} icon={<UserX size={14}/>}>Revoke</Button>
                          )}
                          {!isAwarded && app.status !== 'rejected' && app.status !== 'shortlisted' && (
                             <Button variant="outline" size="sm" onClick={() => handleUpdateApplicationStatus(app.scholarshipId, app.studentId, 'shortlisted')}>Shortlist</Button>
                          )}
                           {app.status !== 'rejected' && !isAwarded && (
                             <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700" onClick={() => handleUpdateApplicationStatus(app.scholarshipId, app.studentId, 'rejected')}>Reject</Button>
                           )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {scholarshipApplications.filter(app => app.scholarshipId === selectedScholarshipForApps!.id).length === 0 && (
                <p className="text-center text-gray-500 py-4">No applications found for this scholarship yet.</p>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end">
              <Button variant="outline" onClick={() => setShowManageApplicationsModal(false)}>Close</Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default Scholarships;