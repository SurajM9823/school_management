import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Briefcase, UserPlus, Search, Filter, Edit, Trash2, Mail, Phone, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';

type StaffRole = 'teacher' | 'accountant' | 'librarian' | 'admin_staff' | 'support_staff' | 'principal';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: StaffRole;
  department?: string; // e.g., Science, Maths, Accounts, Administration
  subjectTaught?: string; // For teachers
  dateJoined: string; // YYYY-MM-DD
  status: 'active' | 'inactive' | 'on_leave';
  // Add other relevant fields like qualifications, address etc.
}

// Mock data
const mockStaff: StaffMember[] = [
  { id: 'stf001', name: 'Dr. Emily Carter', email: 'emily.carter@example.com', phone: '9876543210', role: 'teacher', department: 'Science', subjectTaught: 'Physics, Chemistry', dateJoined: '2020-08-15', status: 'active' },
  { id: 'stf002', name: 'Accountant Alice', email: 'alice.acc@example.com', phone: '9876543211', role: 'accountant', department: 'Finance', dateJoined: '2022-03-01', status: 'active' },
  { id: 'stf003', name: 'Librarian Louis', email: 'louis.lib@example.com', phone: '9876543212', role: 'librarian', department: 'Library', dateJoined: '2021-07-20', status: 'active' },
  { id: 'stf004', name: 'Admin Officer Bob', email: 'bob.admin@example.com', phone: '9876543213', role: 'admin_staff', department: 'Administration', dateJoined: '2019-05-10', status: 'on_leave' },
  { id: 'stf005', name: 'Support Staff Sam', email: 'sam.support@example.com', phone: '9876543214', role: 'support_staff', department: 'Maintenance', dateJoined: '2023-01-15', status: 'inactive' },
  { id: 'stf006', name: 'Principal Eva', email: 'eva.principal@example.com', phone: '9876543200', role: 'principal', department: 'Administration', dateJoined: '2018-06-01', status: 'active' },
  { id: 'stf007', name: 'Teacher Rohan', email: 'rohan.math@example.com', phone: '9876543215', role: 'teacher', department: 'Mathematics', subjectTaught: 'Mathematics', dateJoined: '2021-09-01', status: 'active' },
];

const staffRoles: StaffRole[] = ['teacher', 'accountant', 'librarian', 'admin_staff', 'support_staff', 'principal'];
const staffStatuses: StaffMember['status'][] = ['active', 'inactive', 'on_leave'];

const StaffManagement: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>(mockStaff);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formState, setFormState] = useState<Partial<StaffMember>>({ role: 'teacher', status: 'active', dateJoined: format(new Date(), 'yyyy-MM-dd')});

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StaffMember['status'] | 'all'>('all');

  const filteredStaff = useMemo(() => {
    return staffList.filter(staff =>
      (staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || staff.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter === 'all' || staff.role === roleFilter) &&
      (statusFilter === 'all' || staff.status === statusFilter)
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [staffList, searchTerm, roleFilter, statusFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.role || !formState.dateJoined) {
        alert("Please fill all required fields: Name, Email, Role, and Date Joined.");
        return;
    }

    if (editingStaff) {
      setStaffList(prevStaff => prevStaff.map(s => s.id === editingStaff.id ? { ...s, ...formState } as StaffMember : s));
      alert('Staff member updated successfully! (Mock)');
    } else {
      const newStaffMember: StaffMember = {
        id: `stf${Date.now()}`,
        status: 'active', // Default status
        ...formState,
      } as StaffMember;
      setStaffList(prevStaff => [newStaffMember, ...prevStaff]);
      alert('New staff member added successfully! (Mock)');
    }
    setShowForm(false);
    setEditingStaff(null);
    setFormState({ role: 'teacher', status: 'active', dateJoined: format(new Date(), 'yyyy-MM-dd') });
  };

  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormState(staff);
    setShowForm(true);
  };
  
  const handleDeleteStaff = (staffId: string) => {
      if(window.confirm("Are you sure you want to delete this staff member? This action cannot be undone.")){
          setStaffList(prev => prev.filter(s => s.id !== staffId));
          alert(`Staff member ${staffId} deleted. (Mock)`);
      }
  };
  
  const toggleStaffStatus = (staffId: string) => {
    setStaffList(prevStaff =>
      prevStaff.map(staff =>
        staff.id === staffId ? { ...staff, status: staff.status === 'active' ? 'inactive' : (staff.status === 'inactive' ? 'on_leave' : 'active') } : staff // Cycle through statuses for demo
      )
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Briefcase size={28} className="mr-3 text-green-600"/> Staff Management
        </h1>
        <Button variant="primary" icon={<UserPlus size={16}/>} onClick={() => { setEditingStaff(null); setFormState({ role: 'teacher', status: 'active', dateJoined: format(new Date(), 'yyyy-MM-dd') }); setShowForm(true); }}>
            Add New Staff
        </Button>
      </div>

      {/* Add/Edit Staff Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card title={editingStaff ? "Edit Staff Member" : "Add New Staff Member"} className="w-full max-w-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSaveStaff} className="space-y-4 p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name*</label>
                            <input type="text" name="name" id="name" value={formState.name || ''} onChange={handleInputChange} className="mt-1 block w-full common-input-styles" required />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address*</label>
                            <input type="email" name="email" id="email" value={formState.email || ''} onChange={handleInputChange} className="mt-1 block w-full common-input-styles" required />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input type="tel" name="phone" id="phone" value={formState.phone || ''} onChange={handleInputChange} className="mt-1 block w-full common-input-styles" />
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role*</label>
                            <select name="role" id="role" value={formState.role} onChange={handleInputChange} className="mt-1 block w-full common-input-styles" required>
                                {staffRoles.map(role => <option key={role} value={role} className="capitalize">{role.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                            <input type="text" name="department" id="department" value={formState.department || ''} onChange={handleInputChange} className="mt-1 block w-full common-input-styles" />
                        </div>
                        {formState.role === 'teacher' && (
                             <div>
                                <label htmlFor="subjectTaught" className="block text-sm font-medium text-gray-700">Subject(s) Taught</label>
                                <input type="text" name="subjectTaught" id="subjectTaught" value={formState.subjectTaught || ''} onChange={handleInputChange} className="mt-1 block w-full common-input-styles" placeholder="e.g., Physics, Mathematics"/>
                            </div>
                        )}
                        <div>
                            <label htmlFor="dateJoined" className="block text-sm font-medium text-gray-700">Date Joined*</label>
                            <input type="date" name="dateJoined" id="dateJoined" value={formState.dateJoined} onChange={handleInputChange} className="mt-1 block w-full common-input-styles" required />
                        </div>
                         <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status*</label>
                            <select name="status" id="status" value={formState.status} onChange={handleInputChange} className="mt-1 block w-full common-input-styles" required>
                                {staffStatuses.map(status => <option key={status} value={status} className="capitalize">{status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>)}
                            </select>
                        </div>
                    </div>
                    {/* Add more fields like qualifications, address, photo upload etc. */}
                    <div className="flex justify-end space-x-3 pt-3">
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">{editingStaff ? "Save Changes" : "Add Staff"}</Button>
                    </div>
                </form>
            </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4">
          <div>
            <label htmlFor="searchTermStaff" className="block text-sm font-medium text-gray-700">Search Staff</label>
            <input type="text" id="searchTermStaff" placeholder="Name or Email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mt-1 block w-full common-input-styles"/>
          </div>
          <div>
            <label htmlFor="roleFilterStaff" className="block text-sm font-medium text-gray-700">Filter by Role</label>
            <select id="roleFilterStaff" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as StaffRole | 'all')} className="mt-1 block w-full common-input-styles">
              <option value="all">All Roles</option>
              {staffRoles.map(role => <option key={role} value={role} className="capitalize">{role.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="statusFilterStaff" className="block text-sm font-medium text-gray-700">Filter by Status</label>
            <select id="statusFilterStaff" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StaffMember['status'] | 'all')} className="mt-1 block w-full common-input-styles">
              <option value="all">All Statuses</option>
              {staffStatuses.map(status => <option key={status} value={status} className="capitalize">{status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>)}
            </select>
          </div>
           <Button variant="outline" icon={<Filter size={16}/>} onClick={() => {setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all');}} className="mt-1">Clear Filters</Button>
        </div>
      </Card>

      {/* Staff Table */}
      <Card title="School Staff Members">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((staff) => (
                <tr key={staff.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                    <div className="text-xs text-gray-500">{staff.subjectTaught ? `Teaches: ${staff.subjectTaught}` : `Joined: ${format(parseISO(staff.dateJoined), 'MMM dd, yyyy')}`}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center"><Mail size={13} className="mr-1.5 text-gray-400"/>{staff.email}</div>
                    {staff.phone && <div className="flex items-center mt-0.5"><Phone size={13} className="mr-1.5 text-gray-400"/>{staff.phone}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">{staff.role.replace('_', ' ')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{staff.department || 'N/A'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Button
                        size="sm"
                        variant={staff.status === 'active' ? 'success' : (staff.status === 'on_leave' ? 'warning' : 'danger')}
                        onClick={() => toggleStaffStatus(staff.id)}
                        className="capitalize w-24 text-center py-1 px-2 text-xs" // Adjusted padding for smaller look
                    >
                        {staff.status.replace('_', ' ')}
                    </Button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                    <Button variant="icon" size="sm" onClick={() => handleEditStaff(staff)} title="Edit Staff"><Edit size={16} className="text-blue-600"/></Button>
                    <Button variant="icon" size="sm" onClick={() => handleDeleteStaff(staff.id)} title="Delete Staff"><Trash2 size={16} className="text-red-600"/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStaff.length === 0 && <p className="text-center py-6 text-gray-500">No staff members found matching your criteria.</p>}
      </Card>
    </div>
  );
};

export default StaffManagement;