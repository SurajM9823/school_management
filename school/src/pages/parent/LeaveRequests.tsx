import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CalendarPlus, PlusCircle, Filter, Send, Eye, CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

interface LeaveRequest {
  id: string;
  childId: string; 
  childName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  leaveType: 'Sick Leave' | 'Casual Leave' | 'Urgent Work' | 'Family Event' | 'Other';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  submittedDate: string; // YYYY-MM-DD
  approvedBy?: string; // Teacher/Admin name
  rejectionReason?: string;
  attachments?: Array<{ name: string; url: string }>; // e.g., medical certificate
}

// Mock children data for the form
const mockParentChildren = [
    { id: 'child1', name: 'Sarah Smith' },
    { id: 'child2', name: 'Michael Smith' },
    { id: 'child3', name: 'Olivia Smith' },
];

// Mock data - In a real app, this would come from an API for the logged-in parent
const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave001',
    childId: 'child1',
    childName: 'Sarah Smith',
    startDate: '2024-06-03',
    endDate: '2024-06-04',
    reason: 'Fever and cold.',
    leaveType: 'Sick Leave',
    status: 'Approved',
    submittedDate: '2024-06-02',
    approvedBy: 'Mrs. Anjali Verma (Class Teacher)',
    attachments: [{ name: 'medical_cert_sarah.pdf', url: '#'}]
  },
  {
    id: 'leave002',
    childId: 'child2',
    childName: 'Michael Smith',
    startDate: '2024-06-10',
    endDate: '2024-06-12',
    reason: 'Attending a family wedding out of station.',
    leaveType: 'Family Event',
    status: 'Pending',
    submittedDate: '2024-05-25',
  },
  {
    id: 'leave003',
    childId: 'child1',
    childName: 'Sarah Smith',
    startDate: '2024-05-01',
    endDate: '2024-05-01',
    reason: 'Doctor\'s appointment.',
    leaveType: 'Urgent Work',
    status: 'Rejected',
    rejectionReason: 'Prior intimation required for planned appointments. Please apply at least 2 days in advance unless an emergency.',
    submittedDate: '2024-04-30',
  },
];

const leaveTypes: LeaveRequest['leaveType'][] = ['Sick Leave', 'Casual Leave', 'Urgent Work', 'Family Event', 'Other'];
const leaveStatuses: LeaveRequest['status'][] = ['Pending', 'Approved', 'Rejected', 'Cancelled'];


const LeaveRequests: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [showForm, setShowForm] = useState(false);
  const [newLeaveRequest, setNewLeaveRequest] = useState<Partial<LeaveRequest>>({ 
    childId: mockParentChildren[0]?.id, 
    leaveType: 'Sick Leave',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [childFilter, setChildFilter] = useState<string>('all'); // For filtering by child if multiple

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewLeaveRequest(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaveRequest.childId || !newLeaveRequest.startDate || !newLeaveRequest.endDate || !newLeaveRequest.reason || !newLeaveRequest.leaveType) {
        alert("Please fill all required fields: Child, Start Date, End Date, Reason, and Leave Type.");
        return;
    }
    if (parseISO(newLeaveRequest.endDate) < parseISO(newLeaveRequest.startDate)) {
        alert("End date cannot be before start date.");
        return;
    }

    const submittedRequest: LeaveRequest = {
      id: `leave${Date.now()}`,
      submittedDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'Pending',
      childName: mockParentChildren.find(c => c.id === newLeaveRequest.childId)?.name || 'N/A',
      ...newLeaveRequest,
    } as LeaveRequest;
    setLeaveRequests(prev => [submittedRequest, ...prev]);
    setShowForm(false);
    setNewLeaveRequest({ 
        childId: mockParentChildren[0]?.id, 
        leaveType: 'Sick Leave',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });
    alert('Leave request submitted successfully (mock).');
  };

  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests
      .filter(req => 
        (statusFilter === 'all' || req.status === statusFilter) &&
        (childFilter === 'all' || req.childId === childFilter)
      )
      .sort((a, b) => parseISO(b.submittedDate).getTime() - parseISO(a.submittedDate).getTime());
  }, [leaveRequests, statusFilter, childFilter]);

  const getStatusPill = (status: LeaveRequest['status']) => {
    let colorClasses = '';
    let IconComponent = null;
    switch (status) {
      case 'Approved': colorClasses = 'bg-green-100 text-green-800'; IconComponent = <CheckCircle size={14} className="mr-1"/>; break;
      case 'Pending': colorClasses = 'bg-yellow-100 text-yellow-800'; IconComponent = <Clock size={14} className="mr-1"/>; break;
      case 'Rejected': colorClasses = 'bg-red-100 text-red-800'; IconComponent = <XCircle size={14} className="mr-1"/>; break;
      case 'Cancelled': colorClasses = 'bg-gray-100 text-gray-800'; IconComponent = <XCircle size={14} className="mr-1"/>; break;
      default: colorClasses = 'bg-gray-100 text-gray-800';
    }
    return <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses} items-center`}>{IconComponent}{status}</span>;
  };
  
  const calculateLeaveDays = (startDate: string, endDate: string) => {
    return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <CalendarPlus size={28} className="mr-3 text-teal-600"/> Child's Leave Requests
        </h1>
        <Button variant="primary" icon={<PlusCircle size={16} />} onClick={() => setShowForm(true)}>
          Apply for Leave
        </Button>
      </div>

      {/* New Leave Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card title="Apply for Leave" className="w-full max-w-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmitLeaveRequest} className="space-y-4 p-2">
              <div>
                <label htmlFor="childId" className="block text-sm font-medium text-gray-700">For Child*</label>
                <select name="childId" id="childId" value={newLeaveRequest.childId || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                  {mockParentChildren.map(child => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
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
                <label htmlFor="attachments" className="block text-sm font-medium text-gray-700">Attach Document (e.g., Medical Certificate)</label>
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
        <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-full md:w-auto">
                <label htmlFor="childFilter" className="block text-sm font-medium text-gray-700">Filter by Child:</label>
                <select id="childFilter" value={childFilter} onChange={(e) => setChildFilter(e.target.value)} className="mt-1 block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
                    <option value="all">All Children</option>
                    {mockParentChildren.map(child => (<option key={child.id} value={child.id}>{child.name}</option>))}
                </select>
            </div>
            <div className="w-full md:w-auto">
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Filter by Status:</label>
                <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
                    <option value="all">All Statuses</option>
                    {leaveStatuses.map(status => (<option key={status} value={status}>{status}</option>))}
                </select>
            </div>
        </div>
      </Card>

      {/* Leave Requests List */}
      {filteredLeaveRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredLeaveRequests.map((req) => (
            <Card key={req.id} className="hover:shadow-lg transition-shadow">
              <div className="p-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-2">
                  <div>
                    <p className="text-sm text-gray-500 flex items-center"><User size={14} className="mr-1"/> For: <span className="font-medium text-gray-700 ml-1">{req.childName}</span></p>
                    <p className="text-md font-semibold text-teal-700">{req.leaveType}</p>
                  </div>
                  {getStatusPill(req.status)}
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Dates:</span> {format(parseISO(req.startDate), 'MMM dd, yyyy')} - {format(parseISO(req.endDate), 'MMM dd, yyyy')} 
                  <span className="text-xs text-gray-500 ml-1">({calculateLeaveDays(req.startDate, req.endDate)} days)</span>
                </p>
                <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Reason:</span> {req.reason}</p>
                {req.status === 'Rejected' && req.rejectionReason && (
                    <p className="text-sm text-red-600 mt-1 bg-red-50 p-2 rounded-md"><span className="font-medium">Rejection Reason:</span> {req.rejectionReason}</p>
                )}
                {req.status === 'Approved' && req.approvedBy && (
                    <p className="text-sm text-green-600 mt-1"><span className="font-medium">Approved By:</span> {req.approvedBy}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">Submitted: {format(parseISO(req.submittedDate), 'MMM dd, yyyy')}</p>
                {/* TODO: Add view details/attachments and cancel button if status is Pending */}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-10">
            <CalendarPlus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Leave Requests Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no leave requests matching your filters, or none have been submitted yet.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default LeaveRequests;