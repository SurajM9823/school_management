import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { MessageSquare, PlusCircle, Filter, Send, Eye, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Complaint {
  id: string;
  childId?: string; // Optional: if complaint is specific to a child
  childName?: string; // Optional
  dateSubmitted: string; // YYYY-MM-DD
  category: 'Academic' | 'Bullying' | 'Facilities' | 'Teacher Conduct' | 'Transport' | 'Other';
  subject: string;
  description: string;
  status: 'Submitted' | 'In Review' | 'Action Taken' | 'Resolved' | 'Closed';
  resolutionDetails?: string;
  lastUpdated: string; // YYYY-MM-DD
  attachments?: Array<{ name: string; url: string }>;
}

// Mock data - In a real app, this would come from an API for the logged-in parent
const mockComplaints: Complaint[] = [
  {
    id: 'comp001',
    childId: 'child1',
    childName: 'Sarah Smith',
    dateSubmitted: '2024-05-15',
    category: 'Academic',
    subject: 'Concerns about Math Test Grading',
    description: 'I believe there was an error in the grading of Sarah\'s recent math test. Question 5 was marked incorrect but seems to follow the correct methodology.',
    status: 'Resolved',
    resolutionDetails: 'The math teacher reviewed the test and found a calculation error in marking. The grade has been updated. We apologize for the oversight.',
    lastUpdated: '2024-05-20',
  },
  {
    id: 'comp002',
    dateSubmitted: '2024-06-01',
    category: 'Facilities',
    subject: 'Broken Water Cooler in West Wing',
    description: 'The water cooler near the Grade 7 classrooms has been out of order for three days. Could this please be looked into?',
    status: 'In Review',
    lastUpdated: '2024-06-03',
  },
  {
    id: 'comp003',
    childId: 'child2',
    childName: 'Michael Smith',
    dateSubmitted: '2024-04-20',
    category: 'Bullying',
    subject: 'Issue with another student during lunch break',
    description: 'Michael reported an incident during lunch break on April 19th involving another student. Requesting the school to investigate.',
    status: 'Closed',
    resolutionDetails: 'Counsellor met with both students and parents. Matter addressed and resolved with appropriate guidance.',
    lastUpdated: '2024-04-28',
  },
];

const complaintCategories: Complaint['category'][] = ['Academic', 'Bullying', 'Facilities', 'Teacher Conduct', 'Transport', 'Other'];
const complaintStatuses: Complaint['status'][] = ['Submitted', 'In Review', 'Action Taken', 'Resolved', 'Closed'];

// Mock children data for the form
const mockParentChildren = [
    { id: 'child1', name: 'Sarah Smith' },
    { id: 'child2', name: 'Michael Smith' },
    { id: 'child3', name: 'Olivia Smith' },
];


const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [showForm, setShowForm] = useState(false);
  const [newComplaint, setNewComplaint] = useState<Partial<Complaint>>({ category: 'Other', childId: mockParentChildren[0]?.id });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewComplaint(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.subject || !newComplaint.description || !newComplaint.category) {
        alert("Please fill in Subject, Description, and Category.");
        return;
    }
    const submittedComplaint: Complaint = {
      id: `comp${Date.now()}`,
      dateSubmitted: format(new Date(), 'yyyy-MM-dd'),
      lastUpdated: format(new Date(), 'yyyy-MM-dd'),
      status: 'Submitted',
      childName: mockParentChildren.find(c => c.id === newComplaint.childId)?.name,
      ...newComplaint,
    } as Complaint;
    setComplaints(prev => [submittedComplaint, ...prev]);
    setShowForm(false);
    setNewComplaint({ category: 'Other', childId: mockParentChildren[0]?.id });
    alert('Complaint submitted successfully (mock).');
  };

  const filteredComplaints = useMemo(() => {
    return complaints
      .filter(complaint => statusFilter === 'all' || complaint.status === statusFilter)
      .sort((a, b) => parseISO(b.lastUpdated).getTime() - parseISO(a.lastUpdated).getTime());
  }, [complaints, statusFilter]);

  const getStatusColor = (status: Complaint['status']) => {
    if (status === 'Resolved' || status === 'Closed') return 'bg-green-100 text-green-800';
    if (status === 'In Review' || status === 'Action Taken') return 'bg-yellow-100 text-yellow-800';
    if (status === 'Submitted') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  const getStatusIcon = (status: Complaint['status']) => {
    if (status === 'Resolved' || status === 'Closed') return <CheckCircle size={16} className="mr-1 text-green-600" />;
    if (status === 'In Review' || status === 'Action Taken') return <Clock size={16} className="mr-1 text-yellow-600" />;
    if (status === 'Submitted') return <Send size={16} className="mr-1 text-blue-600" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <MessageSquare size={28} className="mr-3 text-orange-600"/> Complaints & Concerns
        </h1>
        <Button variant="primary" icon={<PlusCircle size={16} />} onClick={() => setShowForm(true)}>
          Submit New Complaint
        </Button>
      </div>

      {/* New Complaint Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card title="Submit New Complaint" className="w-full max-w-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmitComplaint} className="space-y-4 p-2"> {/* Reduced padding for Card content */}
              <div>
                <label htmlFor="childId" className="block text-sm font-medium text-gray-700">Regarding Child (Optional)</label>
                <select name="childId" id="childId" value={newComplaint.childId || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                  <option value="">General Concern (Not child-specific)</option>
                  {mockParentChildren.map(child => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category*</label>
                <select name="category" id="category" value={newComplaint.category} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                  {complaintCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject*</label>
                <input type="text" name="subject" id="subject" value={newComplaint.subject || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Detailed Description*</label>
                <textarea name="description" id="description" value={newComplaint.description || ''} onChange={handleInputChange} rows={5} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
              </div>
              <div>
                <label htmlFor="attachments" className="block text-sm font-medium text-gray-700">Attachments (Optional)</label>
                <input type="file" name="attachments" id="attachments" multiple className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary" icon={<Send size={16}/>}>Submit Complaint</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Filter by Status:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Statuses</option>
              {complaintStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
        </div>
      </Card>

      {/* Complaints List */}
      {filteredComplaints.length > 0 ? (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <Card key={complaint.id} className="hover:shadow-lg transition-shadow">
              <div className="p-2"> {/* Reduced padding for Card content */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-start">
                  <div>
                    <h3 className="text-md font-semibold text-orange-700">{complaint.subject}</h3>
                    <p className="text-xs text-gray-500">
                      Submitted: {format(parseISO(complaint.dateSubmitted), 'MMM dd, yyyy')} | Category: {complaint.category}
                      {complaint.childName && <span className="ml-1">| For: {complaint.childName}</span>}
                    </p>
                  </div>
                  <span className={`mt-2 sm:mt-0 px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                    {getStatusIcon(complaint.status)}
                    {complaint.status}
                  </span>
                </div>
                
                {expandedComplaintId === complaint.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-700 space-y-2">
                        <p><strong>Description:</strong> {complaint.description}</p>
                        {complaint.resolutionDetails && (
                            <div className="bg-green-50 p-3 rounded-md border border-green-200">
                                <p className="font-semibold text-green-700">Resolution/Response:</p>
                                <p>{complaint.resolutionDetails}</p>
                            </div>
                        )}
                        <p className="text-xs text-gray-500">Last Updated: {format(parseISO(complaint.lastUpdated), 'MMM dd, yyyy hh:mm a')}</p>
                    </div>
                )}

                <div className="mt-3 text-right">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setExpandedComplaintId(expandedComplaintId === complaint.id ? null : complaint.id)}
                        icon={<Eye size={14}/>}
                    >
                        {expandedComplaintId === complaint.id ? 'Hide Details' : 'View Details'}
                    </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-10">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Complaints Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You have not submitted any complaints yet, or none match the current filter.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Complaints;