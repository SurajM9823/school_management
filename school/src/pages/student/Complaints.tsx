import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { MessageCircle, PlusCircle, Filter, Send, Eye, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface StudentComplaint {
  id: string;
  dateSubmitted: string; // YYYY-MM-DD
  category: 'Academic' | 'Bullying' | 'Facilities' | 'Suggestion' | 'Other';
  subject: string;
  description: string;
  status: 'Submitted' | 'In Review' | 'Action Taken' | 'Resolved' | 'Closed';
  resolutionDetails?: string;
  lastUpdated: string; // YYYY-MM-DD
  isAnonymous?: boolean; // Option for students
}

// Mock data - In a real app, this would come from an API for the logged-in student
const mockStudentComplaints: StudentComplaint[] = [
  {
    id: 'scomp001',
    dateSubmitted: '2024-05-20',
    category: 'Facilities',
    subject: 'Library Computer Not Working',
    description: 'The computer at terminal 5 in the library is not booting up. It has been like this for a few days.',
    status: 'Resolved',
    resolutionDetails: 'IT support has fixed the computer. It is now operational.',
    lastUpdated: '2024-05-22',
    isAnonymous: false,
  },
  {
    id: 'scomp002',
    dateSubmitted: '2024-06-02',
    category: 'Suggestion',
    subject: 'More Books in Sci-Fi Section',
    description: 'I would like to suggest adding more recent science fiction novels to the library collection.',
    status: 'In Review',
    lastUpdated: '2024-06-03',
    isAnonymous: true,
  },
  {
    id: 'scomp003',
    dateSubmitted: '2024-04-15',
    category: 'Academic',
    subject: 'Difficulty understanding recent Physics topic',
    description: 'I am finding the topic of "Quantum Entanglement" very difficult to understand. Requesting extra help or resources.',
    status: 'Action Taken',
    resolutionDetails: 'Teacher has scheduled an extra doubt-clearing session after school on Friday.',
    lastUpdated: '2024-04-18',
    isAnonymous: false,
  },
];

const complaintCategories: StudentComplaint['category'][] = ['Academic', 'Bullying', 'Facilities', 'Suggestion', 'Other'];
const complaintStatuses: StudentComplaint['status'][] = ['Submitted', 'In Review', 'Action Taken', 'Resolved', 'Closed'];

const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<StudentComplaint[]>(mockStudentComplaints);
  const [showForm, setShowForm] = useState(false);
  const [newComplaint, setNewComplaint] = useState<Partial<StudentComplaint>>({ category: 'Suggestion', isAnonymous: false });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setNewComplaint(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
        setNewComplaint(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.subject || !newComplaint.description || !newComplaint.category) {
        alert("Please fill in Subject, Description, and Category.");
        return;
    }
    const submittedComplaint: StudentComplaint = {
      id: `scomp${Date.now()}`,
      dateSubmitted: format(new Date(), 'yyyy-MM-dd'),
      lastUpdated: format(new Date(), 'yyyy-MM-dd'),
      status: 'Submitted',
      ...newComplaint,
    } as StudentComplaint;
    setComplaints(prev => [submittedComplaint, ...prev]);
    setShowForm(false);
    setNewComplaint({ category: 'Suggestion', isAnonymous: false });
    alert('Your concern has been submitted. (Mock)');
  };

  const filteredComplaints = useMemo(() => {
    return complaints
      .filter(complaint => statusFilter === 'all' || complaint.status === statusFilter)
      .sort((a, b) => parseISO(b.lastUpdated).getTime() - parseISO(a.lastUpdated).getTime());
  }, [complaints, statusFilter]);

  const getStatusPill = (status: StudentComplaint['status']) => {
    let colorClasses = '';
    let Icon = MessageCircle;
    if (status === 'Resolved' || status === 'Closed') { colorClasses = 'bg-green-100 text-green-800'; Icon = CheckCircle; }
    else if (status === 'In Review' || status === 'Action Taken') { colorClasses = 'bg-yellow-100 text-yellow-800'; Icon = Clock; }
    else if (status === 'Submitted') { colorClasses = 'bg-blue-100 text-blue-800'; Icon = Send; }
    else { colorClasses = 'bg-gray-100 text-gray-800'; }

    return <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses} items-center`}><Icon size={14} className="mr-1.5"/>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <MessageCircle size={28} className="mr-3 text-purple-600"/> Complaint Box / Suggestions
        </h1>
        <Button variant="primary" icon={<PlusCircle size={16} />} onClick={() => setShowForm(true)}>
          Submit New
        </Button>
      </div>

      {/* New Complaint Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card title="Submit a Concern or Suggestion" className="w-full max-w-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmitComplaint} className="space-y-4 p-3">
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
              <div className="flex items-center">
                <input type="checkbox" name="isAnonymous" id="isAnonymous" checked={newComplaint.isAnonymous || false} onChange={handleInputChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-900">Submit Anonymously (your name will not be shared)</label>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary" icon={<Send size={16}/>}>Submit</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Filter by Status:</label>
            <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
              <option value="all">All Statuses</option>
              {complaintStatuses.map(status => (<option key={status} value={status}>{status}</option>))}
            </select>
        </div>
      </Card>

      {/* Complaints List */}
      {filteredComplaints.length > 0 ? (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <Card key={complaint.id} className="hover:shadow-lg transition-shadow">
              <div className="p-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-2">
                  <div>
                    <h3 className="text-md font-semibold text-purple-700">{complaint.subject}</h3>
                    <p className="text-xs text-gray-500">
                      Submitted: {format(parseISO(complaint.dateSubmitted), 'MMM dd, yyyy')} | Category: {complaint.category}
                      {complaint.isAnonymous && <span className="ml-2 italic text-gray-400">(Submitted Anonymously)</span>}
                    </p>
                  </div>
                  {getStatusPill(complaint.status)}
                </div>
                
                {expandedComplaintId === complaint.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-700 space-y-2">
                        <p><strong>Your Concern/Suggestion:</strong> {complaint.description}</p>
                        {complaint.resolutionDetails && (
                            <div className="bg-green-50 p-3 rounded-md border border-green-200">
                                <p className="font-semibold text-green-700">Response/Action Taken:</p>
                                <p>{complaint.resolutionDetails}</p>
                            </div>
                        )}
                        <p className="text-xs text-gray-500">Last Updated: {format(parseISO(complaint.lastUpdated), 'MMM dd, yyyy hh:mm a')}</p>
                    </div>
                )}

                <div className="mt-3 text-right">
                    <Button variant="outline" size="sm" onClick={() => setExpandedComplaintId(expandedComplaintId === complaint.id ? null : complaint.id)} icon={<Eye size={14}/>}>
                        {expandedComplaintId === complaint.id ? 'Hide Details' : 'View Details'}
                    </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div className="text-center py-10"><MessageCircle className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No Records Found</h3><p className="mt-1 text-sm text-gray-500">You haven't submitted any concerns/suggestions yet, or none match the filter.</p></div></Card>
      )}
    </div>
  );
};

export default Complaints;