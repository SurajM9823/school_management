import React, { useState, useEffect } from 'react';
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
  CheckCircle,
  XCircle,
  CalendarDays,
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { format } from 'date-fns';
import api from '../../api';

interface ScholarshipEligibilityCriteria {
  generalCriteria: string;
  minOverallPercentage?: number;
  minExamPercentage?: number;
  linkedExamId?: number;
  maxRankInExam?: number;
}

interface Scholarship {
  id: number;
  name: string;
  description: string;
  scholarship_type: string;
  amount?: number;
  percentage_waiver?: number;
  is_full_waiver: boolean;
  duration_months?: number;
  academic_session: { id: number; name: string };
  term?: { id: number; name: string };
  status: 'open' | 'closed' | 'under_review' | 'awarded' | 'discontinued';
  number_of_awards?: number;
  general_criteria: string;
  min_overall_percentage?: number;
  min_exam_percentage?: number;
  linked_exam?: { id: number; name: string };
  max_rank_in_exam?: number;
  auto_assign: boolean;
  awarded_to: { id: number; student_id: string; student_name: string; assignment_type: string; assigned_at: string; remarks: string }[];
}

interface Student {
  id: string;
  user_name: string; // Updated to match backend StudentSerializer
  class_name: string;
  section_name: string;
}

const ScholarshipTypes = ['merit-based', 'need-based', 'sports', 'arts', 'other', 'full-waiver', 'partial-waiver', 'monthly'];
const ScholarshipStatuses = ['open', 'closed', 'under_review', 'awarded', 'discontinued'];

const Scholarships: React.FC = () => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [sessions, setSessions] = useState<{ id: number; name: string }[]>([]);
  const [terms, setTerms] = useState<{ id: number; name: string }[]>([]);
  const [exams, setExams] = useState<{ id: number; name: string }[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allClasses, setAllClasses] = useState<{ id: number; name: string }[]>([]);
  const [allSections, setAllSections] = useState<{ id: number; name: string; class_id: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState<number | null>(null);
  const [sectionFilter, setSectionFilter] = useState<number | null>(null);
  const [showNewScholarshipForm, setShowNewScholarshipForm] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);
  const [showManageAssignmentsModal, setShowManageAssignmentsModal] = useState(false);
  const [selectedScholarshipForAssignments, setSelectedScholarshipForAssignments] = useState<Scholarship | null>(null);
  const [selectedScholarshipForDetails, setSelectedScholarshipForDetails] = useState<Scholarship | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localClassFilter, setLocalClassFilter] = useState<number | null>(null);
  const [localSectionFilter, setLocalSectionFilter] = useState<number | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<{[key: string]: boolean}>({});
  const [hasChanges, setHasChanges] = useState(false);

  const [newScholarship, setNewScholarship] = useState({
    name: '',
    description: '',
    scholarship_type: 'merit-based' as const,
    amount: 0,
    percentage_waiver: 0,
    is_full_waiver: false,
    academic_session_id: 0,
    term_id: null as number | null,
    status: 'open' as const,
    general_criteria: '',
  });

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const sessionsRes = await api.get('/school/settings/sessions/', { params: { status: 'active' } });
        setSessions(sessionsRes.data || []);
        
        if (!sessionsRes.data || sessionsRes.data.length === 0) {
          throw new Error('No active academic sessions found');
        }
        
        const [scholarshipsRes, termsRes, examsRes, studentsRes, classesRes] = await Promise.all([
          api.get('/scholarships/'),
          api.get(`/school/settings/sessions/${sessionsRes.data[0].id}/terms/`),
          api.get('/school/exams/'),
          api.get('/students/'),
          api.get('/school/settings/classes/'),
        ]);
        
        setScholarships(scholarshipsRes.data || []);
        setTerms(termsRes.data || []);
        setExams(examsRes.data || []);
        setStudents(studentsRes.data || []);
        setAllClasses(classesRes.data || []);
        
        if (classesRes.data && classesRes.data.length > 0) {
          const sectionsPromises = classesRes.data.map((cls: any) => 
            api.get(`/school/settings/classes/${cls.id}/sections/`)
          );
          const sectionsResponses = await Promise.all(sectionsPromises);
          const allSectionsData = sectionsResponses.flatMap((res, index) => {
            const classId = classesRes.data[index].id;
            return (res.data || []).map((section: any) => ({
              ...section,
              class_id: classId
            }));
          });
          setAllSections(allSectionsData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load initial data: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Initialize pendingAssignments when modal opens
  useEffect(() => {
  if (selectedScholarshipForAssignments && showManageAssignmentsModal) {
    const currentAssignments: { [key: string]: boolean } = {};
    // Initialize all students with false
    students.forEach(student => {
      currentAssignments[student.id] = false;
    });
    // Set true for currently assigned students
    selectedScholarshipForAssignments.awarded_to.forEach(assignment => {
      currentAssignments[assignment.student_id] = true;
    });
    console.log('Initialized pendingAssignments:', currentAssignments); // Debug
    setPendingAssignments(currentAssignments);
    setHasChanges(false);
    setLocalClassFilter(null);
    setLocalSectionFilter(null);
  }
}, [selectedScholarshipForAssignments, showManageAssignmentsModal, students]);

  // Filter scholarships
  const filteredScholarships = scholarships.filter(scholarship => {
    const matchesSearch = scholarship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scholarship.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || scholarship.scholarship_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || scholarship.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateOrUpdateScholarship = async () => {
    try {
      setLoading(true);
      const payload = {
        ...newScholarship,
        amount: newScholarship.is_full_waiver ? null : newScholarship.amount,
        percentage_waiver: newScholarship.scholarship_type === 'partial-waiver' ? newScholarship.percentage_waiver : null,
      };
      if (editingScholarship) {
        await api.put(`/scholarships/${editingScholarship.id}/`, payload);
        setScholarships(scholarships.map(sch => sch.id === editingScholarship.id ? { ...sch, ...payload } : sch));
      } else {
        const response = await api.post('/scholarships/', payload);
        setScholarships([...scholarships, response.data]);
      }
      setShowNewScholarshipForm(false);
      resetNewScholarshipForm();
      setEditingScholarship(null);
    } catch (err) {
      setError('Failed to save scholarship');
    } finally {
      setLoading(false);
    }
  };

  const resetNewScholarshipForm = () => {
    setNewScholarship({
      name: '',
      description: '',
      scholarship_type: 'merit-based',
      amount: 0,
      percentage_waiver: 0,
      is_full_waiver: false,
      academic_session_id: 0,
      term_id: null,
      status: 'open',
      general_criteria: '',
    });
  };

  const handleEditScholarship = (scholarship: Scholarship) => {
    setEditingScholarship(scholarship);
    setNewScholarship({
      name: scholarship.name,
      description: scholarship.description,
      scholarship_type: scholarship.scholarship_type as any,
      amount: scholarship.amount || 0,
      percentage_waiver: scholarship.percentage_waiver || 0,
      is_full_waiver: scholarship.is_full_waiver,
      academic_session_id: scholarship.academic_session.id,
      term_id: scholarship.term?.id || null,
      status: scholarship.status,
      general_criteria: scholarship.general_criteria,
    });
    setShowNewScholarshipForm(true);
  };

  const handleDeleteScholarship = async (id: number) => {
    try {
      await api.delete(`/scholarships/${id}/`);
      setScholarships(scholarships.filter(sch => sch.id !== id));
    } catch (err) {
      setError('Failed to delete scholarship');
    }
  };

  const handleAutoAssign = async (scholarshipId: number) => {
    try {
      setLoading(true);
      const response = await api.post(`/scholarships/${scholarshipId}/auto_assign/`);
      const updatedScholarship = await api.get(`/scholarships/${scholarshipId}/`);
      setScholarships(scholarships.map(sch => sch.id === scholarshipId ? updatedScholarship.data : sch));
      setError(response.data.message);
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError('Failed to auto-assign scholarship');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignScholarship = async (scholarshipId: number, studentId: string) => {
    try {
      setLoading(true);
      await api.post('/assignments/', {
        scholarship_id: scholarshipId,
        student_id: studentId,
        assignment_type: 'manual'
      });
      const updatedScholarship = await api.get(`/scholarships/${scholarshipId}/`);
      setScholarships(scholarships.map(sch => sch.id === scholarshipId ? updatedScholarship.data : sch));
      if (selectedScholarshipForAssignments && selectedScholarshipForAssignments.id === scholarshipId) {
        setSelectedScholarshipForAssignments(updatedScholarship.data);
        setPendingAssignments(prev => ({
          ...prev,
          [studentId]: true
        }));
        setHasChanges(true);
      }
    } catch (err) {
      console.error('Assignment error:', err);
      setError('Failed to assign scholarship');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeScholarship = async (assignmentId: number, scholarshipId: number) => {
    if (!assignmentId) return;
    try {
      setLoading(true);
      const response = await api.post(`/assignments/${assignmentId}/revoke/`);
      console.log('Revoke response:', response.data);
      const updatedScholarship = await api.get(`/scholarships/${scholarshipId}/`);
      setScholarships(scholarships.map(sch => sch.id === scholarshipId ? updatedScholarship.data : sch));
      if (selectedScholarshipForAssignments && selectedScholarshipForAssignments.id === scholarshipId) {
        setSelectedScholarshipForAssignments(updatedScholarship.data);
        setPendingAssignments(prev => {
          const newAssignments = { ...prev };
          const studentId = Object.keys(prev).find(id => 
            selectedScholarshipForAssignments.awarded_to.find(a => a.student_id === id && a.id === assignmentId)
          );
          if (studentId) {
            newAssignments[studentId] = false;
          }
          return newAssignments;
        });
        setHasChanges(true);
      }
    } catch (err) {
      console.error('Revocation error:', err);
      setError('Failed to revoke scholarship');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUpdate = async (scholarshipId: number) => {
  if (!selectedScholarshipForAssignments) return;

  try {
    setLoading(true);
    const toAdd: string[] = [];
    const toRemove: number[] = [];

    // Get current assignments map
    const currentAssignments: { [key: string]: number } = {};
    selectedScholarshipForAssignments.awarded_to.forEach(assignment => {
      currentAssignments[String(assignment.student_id)] = assignment.id; // Coerce to string
    });
    console.log('Current Assignments:', currentAssignments); // Debug

    // Process all students
    console.log('Pending Assignments:', pendingAssignments); // Debug
    students.forEach(student => {
      const isCurrentlyAssigned = !!currentAssignments[String(student.id)]; // Coerce to string
      const shouldBeAssigned = pendingAssignments[student.id] === true;

      if (!isCurrentlyAssigned && shouldBeAssigned) {
        toAdd.push(student.id);
      } else if (isCurrentlyAssigned && !shouldBeAssigned) {
        const assignmentId = currentAssignments[String(student.id)];
        if (assignmentId) {
          toRemove.push(assignmentId);
        }
      }
    });

    console.log('toAdd:', toAdd, 'toRemove:', toRemove); // Debug

    // Check if number of awards is sufficient
    const totalAssignmentsAfterUpdate = selectedScholarshipForAssignments.awarded_to.length - toRemove.length + toAdd.length;
    if (selectedScholarshipForAssignments.number_of_awards && totalAssignmentsAfterUpdate > selectedScholarshipForAssignments.number_of_awards) {
      throw new Error(`Cannot assign more than ${selectedScholarshipForAssignments.number_of_awards} awards`);
    }

    // Process additions
    const addPromises = toAdd.map(studentId =>
      api.post('/assignments/', {
        scholarship_id: scholarshipId,
        student_id: studentId,
        assignment_type: 'manual'
      })
    );

    // Process removals
    const removePromises = toRemove.map(assignmentId =>
      api.post(`/assignments/${assignmentId}/revoke/`).catch(err => {
        console.error(`Failed to revoke assignment ${assignmentId}:`, err.response?.data || err.message);
        throw err;
      })
    );

    // Execute all API calls
    await Promise.all([...addPromises, ...removePromises]);

    // Refresh scholarship data
    const updatedScholarship = await api.get(`/scholarships/${scholarshipId}/`);
    setScholarships(scholarships.map(sch => sch.id === scholarshipId ? updatedScholarship.data : sch));
    setSelectedScholarshipForAssignments(updatedScholarship.data);

    // Reset pendingAssignments to match server state
    const newPendingAssignments: { [key: string]: boolean } = {};
    students.forEach(student => {
      newPendingAssignments[student.id] = false;
    });
    updatedScholarship.data.awarded_to.forEach(assignment => {
      newPendingAssignments[String(assignment.student_id)] = true;
    });
    console.log('Reset pendingAssignments:', newPendingAssignments); // Debug
    setPendingAssignments(newPendingAssignments);
    setHasChanges(false);

    setError(`Successfully updated assignments: ${toAdd.length} added, ${toRemove.length} removed`);
    setTimeout(() => setError(null), 3000);
  } catch (err) {
    console.error('Batch update error:', err);
    setError('Failed to update assignments: ' + (err.message || 'Unknown error'));
  } finally {
    setLoading(false);
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
          <select id="scholarshipType" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.scholarship_type} onChange={(e) => setNewScholarship({...newScholarship, scholarship_type: e.target.value as any})}>
            {ScholarshipTypes.map(type => <option key={type} value={type}>{type.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea id="description" rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.description} onChange={(e) => setNewScholarship({...newScholarship, description: e.target.value})} />
      </div>
      <div>
        <label htmlFor="generalCriteria" className="block text-sm font-medium text-gray-700">General Eligibility Criteria</label>
        <textarea id="generalCriteria" rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.general_criteria} onChange={(e) => setNewScholarship({...newScholarship, general_criteria: e.target.value})} />
      </div>
      <div className="mb-4">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <input 
            type="checkbox" 
            className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
            checked={newScholarship.is_full_waiver} 
            onChange={(e) => setNewScholarship({...newScholarship, is_full_waiver: e.target.checked})}
          />
          Full Fee Waiver
        </label>
      </div>
      {!newScholarship.is_full_waiver && (
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Scholarship Amount (USD)</label>
          <input 
            type="number" 
            id="amount" 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
            value={newScholarship.amount} 
            onChange={(e) => setNewScholarship({...newScholarship, amount: parseFloat(e.target.value) || 0})} 
            required
          />
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {!newScholarship.is_full_waiver && newScholarship.scholarship_type === 'partial-waiver' && (
          <div>
            <label htmlFor="percentageWaiver" className="block text-sm font-medium text-gray-700">Percentage Waiver (%)</label>
            <input type="number" id="percentageWaiver" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.percentage_waiver} onChange={(e) => setNewScholarship({...newScholarship, percentage_waiver: parseInt(e.target.value) || 0})} />
          </div>
        )}
        <div>
          <label htmlFor="academicSession" className="block text-sm font-medium text-gray-700">Academic Session</label>
          <select id="academicSession" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.academic_session_id || ''} onChange={(e) => setNewScholarship({...newScholarship, academic_session_id: parseInt(e.target.value)})}>
            <option value="">Select Session</option>
            {sessions.map(session => <option key={session.id} value={session.id}>{session.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="term" className="block text-sm font-medium text-gray-700">Term (Optional)</label>
          <select id="term" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.term_id || ''} onChange={(e) => setNewScholarship({...newScholarship, term_id: parseInt(e.target.value) || null})}>
            <option value="">Select Term</option>
            {terms.map(term => <option key={term.id} value={term.id}>{term.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="scholarshipStatus" className="block text-sm font-medium text-gray-700">Status</label>
          <select id="scholarshipStatus" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newScholarship.status} onChange={(e) => setNewScholarship({...newScholarship, status: e.target.value as any})}>
            {ScholarshipStatuses.map(status => <option key={status} value={status}>{status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={() => { setShowNewScholarshipForm(false); setEditingScholarship(null); resetNewScholarshipForm(); }}>Cancel</Button>
        <Button variant="primary" onClick={handleCreateOrUpdateScholarship} disabled={loading}>
          {editingScholarship ? 'Update Scholarship' : 'Create Scholarship'}
        </Button>
      </div>
    </div>
  );

  const renderDetailsModal = () => {
    if (!selectedScholarshipForDetails) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-70 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
        <Card title={`Scholarship Details: ${selectedScholarshipForDetails.name}`} className="w-full max-w-3xl bg-white shadow-xl rounded-lg">
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Basic Information</h3>
                <hr className="border-gray-200 mb-3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-base">{selectedScholarshipForDetails.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="text-base">{selectedScholarshipForDetails.scholarship_type.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedScholarshipForDetails.status === 'open' ? 'bg-green-100 text-green-800' :
                      selectedScholarshipForDetails.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                      selectedScholarshipForDetails.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                      selectedScholarshipForDetails.status === 'awarded' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedScholarshipForDetails.status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Academic Session</p>
                    <p className="text-base">{selectedScholarshipForDetails.academic_session.name}</p>
                  </div>
                  {selectedScholarshipForDetails.term && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Term</p>
                      <p className="text-base">{selectedScholarshipForDetails.term.name}</p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Award Details</h3>
                <hr className="border-gray-200 mb-3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Award Type</p>
                    <p className="text-base">
                      {selectedScholarshipForDetails.is_full_waiver ? 'Full Waiver' : 
                       selectedScholarshipForDetails.percentage_waiver ? `${selectedScholarshipForDetails.percentage_waiver}% Waiver` : 
                       selectedScholarshipForDetails.amount ? `$${selectedScholarshipForDetails.amount.toLocaleString()}` : 'N/A'}
                    </p>
                  </div>
                  {selectedScholarshipForDetails.duration_months && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Duration</p>
                      <p className="text-base">{selectedScholarshipForDetails.duration_months} months</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Number of Awards</p>
                    <p className="text-base">{selectedScholarshipForDetails.number_of_awards || 'Unlimited'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Currently Assigned</p>
                    <p className="text-base">{selectedScholarshipForDetails.awarded_to.length}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Description & Eligibility Criteria</h3>
                <hr className="border-gray-200 mb-3" />
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-base whitespace-pre-line">{selectedScholarshipForDetails.description}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">General Criteria</p>
                    <p className="text-base whitespace-pre-line">{selectedScholarshipForDetails.general_criteria}</p>
                  </div>
                </div>
              </div>
              {selectedScholarshipForDetails.scholarship_type === 'merit-based' && (
                <div>
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Merit-Based Criteria</h3>
                  <hr className="border-gray-200 mb-3" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedScholarshipForDetails.min_overall_percentage && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Minimum Overall Percentage</p>
                        <p className="text-base">{selectedScholarshipForDetails.min_overall_percentage}%</p>
                      </div>
                    )}
                    {selectedScholarshipForDetails.linked_exam && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Linked Exam</p>
                        <p className="text-base">{selectedScholarshipForDetails.linked_exam.name}</p>
                      </div>
                    )}
                    {selectedScholarshipForDetails.min_exam_percentage && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Minimum Exam Percentage</p>
                        <p className="text-base">{selectedScholarshipForDetails.min_exam_percentage}%</p>
                      </div>
                    )}
                    {selectedScholarshipForDetails.max_rank_in_exam && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Maximum Rank in Exam</p>
                        <p className="text-base">{selectedScholarshipForDetails.max_rank_in_exam}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-500">Auto-Assignment</p>
                      <p className="text-base">{selectedScholarshipForDetails.auto_assign ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Assigned Students</h3>
                <hr className="border-gray-200 mb-3" />
                {selectedScholarshipForDetails.awarded_to.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assignment Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedScholarshipForDetails.awarded_to.map((assignment) => (
                          <tr key={assignment.student_id}>
                            <td className="px-3 py-2 text-sm">{assignment.student_name}</td>
                            <td className="px-3 py-2 text-sm">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                assignment.assignment_type === 'auto' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {assignment.assignment_type.charAt(0).toUpperCase() + assignment.assignment_type.slice(1)}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm">{new Date(assignment.assigned_at).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-sm">{assignment.remarks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No students have been assigned to this scholarship yet.</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>Close</Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderManageAssignmentsModal = () => {
  if (!selectedScholarshipForAssignments) return null;
  
  const availableSections = localClassFilter 
    ? allSections.filter(section => section.class_id === localClassFilter)
    : [];
  
  const filteredStudents = students.filter(student => {
    if (!localClassFilter) return true;
    const className = allClasses.find(c => c.id === localClassFilter)?.name;
    if (!localSectionFilter) {
      return student.class_name === className;
    }
    const sectionName = allSections.find(s => s.id === localSectionFilter)?.name;
    return student.class_name === className && student.section_name === sectionName;
  });
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-70 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <Card title={`Assign Scholarship: ${selectedScholarshipForAssignments.name}`} className="w-full max-w-3xl bg-white shadow-xl rounded-lg">
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {loading && (
            <div className="mb-4 p-2 bg-blue-50 text-blue-700 text-sm rounded-md">
              Processing... Please wait.
            </div>
          )}
          <p className="text-sm text-gray-600 mb-2">Currently Assigned: {selectedScholarshipForAssignments.awarded_to.length} students</p>
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Filter Students</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
                <select 
                  className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                  value={localClassFilter || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : null;
                    setLocalClassFilter(value);
                    setLocalSectionFilter(null);
                  }}
                >
                  <option value="">All Classes</option>
                  {allClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
                <select 
                  className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                  value={localSectionFilter || ''}
                  onChange={(e) => setLocalSectionFilter(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={!localClassFilter}
                >
                  <option value="">All Sections</option>
                  {availableSections.map(section => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setLocalClassFilter(null);
                    setLocalSectionFilter(null);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
          <div className="border rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assign</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length > 0 ? filteredStudents.map(student => {
                  const assignment = selectedScholarshipForAssignments.awarded_to.find(a => String(a.student_id) === String(student.id));
                  return (
                    <tr key={student.id}>
                      <td className="px-3 py-2 text-sm">
                        <input 
                          type="checkbox" 
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          checked={pendingAssignments[student.id] === true} // Explicit check
                          disabled={loading}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            console.log(`Checkbox for ${student.id} changed to: ${checked}`); // Debug
                            setPendingAssignments(prev => ({
                              ...prev,
                              [student.id]: checked
                            }));
                            setHasChanges(true);
                          }}
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{student.user_name}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{student.class_name}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{student.section_name}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${assignment ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {assignment ? 'Assigned' : 'Not Assigned'}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                      No students found matching the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
          {hasChanges && (
            <Button 
              variant="primary" 
              onClick={() => handleBatchUpdate(selectedScholarshipForAssignments.id)}
              disabled={loading}
            >
              Update Assignments
            </Button>
          )}
          <Button variant="outline" onClick={() => {
            setShowManageAssignmentsModal(false);
            setLocalClassFilter(null);
            setLocalSectionFilter(null);
            setPendingAssignments({});
            setHasChanges(false);
          }}>Close</Button>
        </div>
      </Card>
    </div>
  );
};

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
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
      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {showNewScholarshipForm && (
        <Card title={editingScholarship ? `Edit Scholarship: ${editingScholarship.name}` : "Add New Scholarship Program"}>
          {renderScholarshipForm()}
        </Card>
      )}
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
            <div className="ml-4"><dt className="text-sm font-medium text-gray-500 truncate">Open Programs</dt><dd className="text-2xl font-semibold text-gray-900">{scholarships.filter(s => s.status === 'open').length}</dd></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3"><Users className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><dt className="text-sm font-medium text-gray-500 truncate">Total Assigned</dt><dd className="text-2xl font-semibold text-gray-900">{scholarships.reduce((sum, s) => sum + s.awarded_to.length, 0)}</dd></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3"><DollarSign className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><dt className="text-sm font-medium text-gray-500 truncate">Total Awarded Value</dt><dd className="text-2xl font-semibold text-gray-900">${scholarships.reduce((sum, s) => sum + (s.amount ? s.amount * s.awarded_to.length : 0), 0).toLocaleString()}</dd></div>
          </div>
        </Card>
      </div>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Award Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session/Term</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Awards/Assigned</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredScholarships.map((scholarship) => (
                <tr key={scholarship.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{scholarship.name}</div>
                    <div className="text-xs text-gray-500">{scholarship.scholarship_type.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {scholarship.is_full_waiver ? 'Full Waiver' : scholarship.percentage_waiver ? `${scholarship.percentage_waiver}% Waiver` : scholarship.amount ? `$${scholarship.amount.toLocaleString()}` : 'N/A'}
                    {scholarship.duration_months ? ` (${scholarship.duration_months} months)` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {scholarship.academic_session.name}
                    {scholarship.term ? ` / ${scholarship.term.name}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {scholarship.number_of_awards || 'N/A'} / {scholarship.awarded_to.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      scholarship.status === 'open' ? 'bg-green-100 text-green-800' :
                      scholarship.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                      scholarship.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                      scholarship.status === 'awarded' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {scholarship.status.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      <Button variant="icon" size="sm" onClick={() => { setSelectedScholarshipForDetails(scholarship); setShowDetailsModal(true); }} title="View Details"><Eye size={16} /></Button>
                      <Button variant="icon" size="sm" onClick={() => handleEditScholarship(scholarship)} title="Edit Scholarship"><Edit size={16} className="text-yellow-600 hover:text-yellow-700" /></Button>
                      <Button variant="icon" size="sm" onClick={() => { setSelectedScholarshipForAssignments(scholarship); setShowManageAssignmentsModal(true); }} title="Manage Assignments"><Users size={16} className="text-indigo-600 hover:text-indigo-700" /></Button>
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
      {showManageAssignmentsModal && renderManageAssignmentsModal()}
      {showDetailsModal && renderDetailsModal()}
    </div>
  );
};

export default Scholarships;