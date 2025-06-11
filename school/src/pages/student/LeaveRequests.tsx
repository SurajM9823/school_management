import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CalendarPlus, PlusCircle, Filter, Send, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

interface StudentLeaveRequest {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  leaveType: 'Sick Leave' | 'Casual Leave' | 'Urgent Work' | 'Family Event' | 'Other';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  submittedDate: string; // YYYY-MM-DD
  approvedBy?: string; // Teacher/Admin name
  rejectionReason?: string;
  attachments?: Array<{ name: string; url: string }>;
}

// Mock data - In a real app, this would come from an API for the logged-in student
const mockStudentLeaveRequests: StudentLeaveRequest[] = [
  {
    id: 'sleave001',
    startDate: '2024-06-03',
    endDate: '2024-06-04',
    reason: 'High fever and sore throat. Doctor advised rest.',
    leaveType: 'Sick Leave',
    status: 'Approved',
    submittedDate: '2024-06-02',
    approvedBy: 'Mrs. Anjali Verma (Class Teacher)',
    attachments: [{ name: 'medical_note.pdf', url: '#'}]
  },
  {
    id: 'sleave002',
    startDate: '2024-06-10',
    endDate: '2024-06-12',
    reason: 'Attending cousin\'s wedding in another city.',
    leaveType: 'Family Event',
    status: 'Pending',
    submittedDate: '2024-05-28',
  },
  {
    id: 'sleave003',
    startDate: '2024-05-01',
    endDate: '2024-05-01',
    reason: 'Urgent dental appointment.',
    leaveType: 'Urgent Work',
    status: 'Rejected',
    rejectionReason: 'Please provide a note from parents for urgent appointments if possible. Approved for half-day.',
    submittedDate: '2024-04-30',
  },
   {
    id: 'sleave004',
    startDate: '2024-06-20',
    endDate: '2024-06-20',
    reason: 'Participating in inter-school debate competition.',
    leaveType: 'Other',
    status: 'Approved',
    submittedDate: '2024-06-15',
    approvedBy: 'School Admin',
  },
];

const leaveTypes: StudentLeaveRequest['leaveType'][] = ['Sick Leave', 'Casual Leave', 'Urgent Work', 'Family Event', 'Other'];
const leaveStatuses: StudentLeaveRequest['status'][] = ['Pending', 'Approved', 'Rejected', 'Cancelled'];

const LeaveRequests: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<StudentLeaveRequest[]>(mockStudentLeaveRequests);
  const [showForm, setShowForm] = useState(false);
  const [newLeaveRequest, setNewLeaveRequest] = useState<Partial<StudentLeaveRequest>>({ 
    leaveType: 'Sick Leave',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewLeaveRequest(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveRequest.startDate || !newLeaveRequest.endDate || !newLeaveRequest.reason || !newLeaveRequest.leaveType) {
        alert("Please fill all required fields: Start Date, End Date, Reason, and Leave Type.");
        return;
    }
    if (parseISO(newLeaveRequest.endDate) < parseISO(newLeaveRequest.startDate)) {
        alert("End date cannot be before start date.");
        return;
    }

    const submittedRequest: StudentLeaveRequest = {
      id: `sleave${Date.now()}`,
      submittedDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'Pending',
      ...newLeaveRequest,
    } as StudentLeaveRequest;
    setLeaveRequests(prev => [submittedRequest, ...prev]);
    setShowForm(false);
    setNewLeaveRequest({ 
        leaveType: 'Sick Leave',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });
    alert('Your leave request has been submitted for approval. (Mock)');
  };

  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests
      .filter(req => statusFilter === 'all' || req.status === statusFilter)
      .sort((a, b) => parseISO(b.submittedDate).getTime() - parseISO(a.submittedDate).getTime());
  }, [leaveRequests, statusFilter]);

  const getStatusPill = (status: StudentLeaveRequest['status']) => {
    let colorClasses = '';
    let IconComponent = Clock; // Default for Pending
    if (status === 'Approved') { colorClasses = 'bg-green-100 text-green-800'; IconComponent = CheckCircle; }
    else if (status === 'Rejected') { colorClasses = 'bg-red-100 text-red-800'; IconComponent = XCircle; }
    else if (status === 'Cancelled') { colorClasses = 'bg-gray-100 text-gray-800'; IconComponent = XCircle; }
    else { colorClasses = 'bg-yellow-100 text-yellow-800'; } // Pending

    return <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses} items-center`}><IconComponent size={14} className="mr-1.5"/>{status}</span>;
  };
  
  const calculateLeaveDays = (startDate: string, endDate: string) => {
    return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
  };

  const handleCancelRequest = (requestId: string) => {
    // Mock cancellation
    setLeaveRequests(prev => prev.map(req => req.id === requestId && req.status === 'Pending' ? {...req, status: 'Cancelled'} : req));
    alert(`Leave request ${requestId} cancelled. (Mock)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <CalendarPlus size={28} className="mr-3 text-teal-600"/> My Leave Requests
        </h1>
        <Button variant="primary" icon={<PlusCircle size={16} />} onClick={() => setShowForm(true)}>
          Apply for Leave
        </Button>
      </div>

      {/* New Leave Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card title="Apply for Leave" className="w-full max-w-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmitLeaveRequest} className="space-y-4 p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date*</label>
                    <input type="date" name="startDate" id="startDate" value={newLeaveRequest.startDate} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date*</label>
                    <input type="date" name="endDate" id="endDate" value={newLeaveRequest.endDate} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                </div>
              </div>
              <div>
                <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700">Leave Type*</label>
                <select name="leaveType" id="leaveType" value={newLeaveRequest.leaveType} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                  {leaveTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Leave*</label>
                <textarea name="reason" id="reason" value={newLeaveRequest.reason || ''} onChange={handleInputChange} rows={4} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
              </div>
              <div>
                <label htmlFor="attachments" className="block text-sm font-medium text-gray-700">Attach Document (Optional)</label>
                <input type="file" name="attachments" id="attachments" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="primary" icon={<Send size={16}/>}>Submit Request</Button>
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
              {leaveStatuses.map(status => (<option key={status} value={status}>{status}</option>))}
            </select>
        </div>
      </Card>

      {/* Leave Requests List */}
      {filteredLeaveRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredLeaveRequests.map((req) => (
            <Card key={req.id} className="hover:shadow-lg transition-shadow">
              <div className="p-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-2">
                  <p className="text-md font-semibold text-teal-700">{req.leaveType}</p>
                  {getStatusPill(req.status)}
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Dates:</span> {format(parseISO(req.startDate), 'MMM dd, yyyy')} - {format(parseISO(req.endDate), 'MMM dd, yyyy')} 
                  <span className="text-xs text-gray-500 ml-1">({calculateLeaveDays(req.startDate, req.endDate)} days)</span>
                </p>
                <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Reason:</span> {req.reason}</p>
                
                {expandedRequestId === req.id && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                        {req.status === 'Rejected' && req.rejectionReason && (
                            <p className="text-red-600"><span className="font-medium">Rejection Reason:</span> {req.rejectionReason}</p>
                        )}
                        {req.status === 'Approved' && req.approvedBy && (
                            <p className="text-green-600"><span className="font-medium">Approved By:</span> {req.approvedBy}</p>
                        )}
                        {req.attachments && req.attachments.length > 0 && (
                            <div>Attachments: {req.attachments.map(f => f.name).join(', ')}</div>
                        )}
                        <p>Submitted: {format(parseISO(req.submittedDate), 'MMM dd, yyyy')}</p>
                    </div>
                )}

                <div className="mt-3 flex justify-end space-x-2">
                    <Button variant="outline" size="sm" icon={<Eye size={14}/>} onClick={() => setExpandedRequestId(expandedRequestId === req.id ? null : req.id)}>
                        {expandedRequestId === req.id ? 'Hide Details' : 'View Details'}
                    </Button>
                    {req.status === 'Pending' && (
                        <Button variant="danger" size="sm" icon={<XCircle size={14}/>} onClick={() => handleCancelRequest(req.id)}>
                            Cancel Request
                        </Button>
                    )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div className="text-center py-10"><CalendarPlus className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No Leave Requests Found</h3><p className="mt-1 text-sm text-gray-500">You haven't submitted any leave requests yet, or none match the filter.</p></div></Card>
      )}
    </div>
  );
};

export default LeaveRequests;