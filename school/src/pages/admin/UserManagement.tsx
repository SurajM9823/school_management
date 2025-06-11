import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Users, Key, ToggleLeft, ToggleRight, Search, Filter, Edit, UserPlus, ShieldCheck, ShieldOff } from 'lucide-react';
import { format, parseISO } from 'date-fns'; // For formatting 'lastLogin' or 'dateJoined'

type UserRole = 'admin' | 'teacher' | 'student' | 'parent' | 'accountant';

interface UserManaged {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  dateJoined: string; // YYYY-MM-DD
  lastLogin?: string; // YYYY-MM-DD HH:mm
  // Add other relevant fields like class for student, department for teacher etc.
  details?: string; // e.g., "Grade 10A" for student, "Math Department" for teacher
}

// Mock data
const mockUsers: UserManaged[] = [
  { id: 'usr001', name: 'Dr. Emily Carter', email: 'emily.carter@example.com', role: 'teacher', status: 'active', dateJoined: '2020-08-15', lastLogin: '2024-06-04 10:30', details: 'Science Dept.' },
  { id: 'usr002', name: 'John Smith (Parent)', email: 'john.smith.p@example.com', role: 'parent', status: 'active', dateJoined: '2021-04-10', lastLogin: '2024-06-05 08:15', details: 'Parent of Sarah & Michael' },
  { id: 'usr003', name: 'Sarah Smith (Student)', email: 'sarah.smith.s@example.com', role: 'student', status: 'active', dateJoined: '2021-04-10', lastLogin: '2024-06-03 15:20', details: 'Grade 10A' },
  { id: 'usr004', name: 'Admin User', email: 'admin@example.com', role: 'admin', status: 'active', dateJoined: '2019-01-01', lastLogin: '2024-06-05 11:00', details: 'System Administrator' },
  { id: 'usr005', name: 'Accountant Alice', email: 'alice.acc@example.com', role: 'accountant', status: 'inactive', dateJoined: '2022-03-01', lastLogin: '2024-05-10 14:00', details: 'Finance Office' },
  { id: 'usr006', name: 'Michael Smith (Student)', email: 'michael.smith.s@example.com', role: 'student', status: 'active', dateJoined: '2021-04-10', lastLogin: '2024-06-02 09:30', details: 'Grade 7B' },
  { id: 'usr007', name: 'Teacher Bob', email: 'bob.teacher@example.com', role: 'teacher', status: 'active', dateJoined: '2023-01-20', lastLogin: '2024-06-05 07:45', details: 'English Dept.' },
];

const userRoles: UserRole[] = ['admin', 'teacher', 'student', 'parent', 'accountant'];
const userStatuses: UserManaged['status'][] = ['active', 'inactive'];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserManaged[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserManaged['status'] | 'all'>('all');
  
  // States for modals (not implemented in this step, but good to keep in mind)
  // const [showPasswordModal, setShowPasswordModal] = useState(false);
  // const [showEditUserModal, setShowEditUserModal] = useState(false);
  // const [selectedUser, setSelectedUser] = useState<UserManaged | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (roleFilter === 'all' || user.role === roleFilter) &&
      (statusFilter === 'all' || user.status === statusFilter)
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleChangePassword = (userId: string) => {
    const newPassword = prompt(`Enter new password for user ID ${userId}:`);
    if (newPassword) {
      alert(`Password for user ${userId} changed to "${newPassword}" (mock action).`);
      // API call would be here
    }
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' } : user
      )
    );
    const user = users.find(u => u.id === userId);
    alert(`User ${user?.name} status toggled to ${user?.status === 'active' ? 'inactive' : 'active'} (mock action).`);
    // API call would be here
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Users size={28} className="mr-3 text-blue-600"/> User Management
        </h1>
        <Button variant="primary" icon={<UserPlus size={16}/>} onClick={() => alert("Open 'Add New User' form/modal (mock).")}>
            Add New User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4">
          <div>
            <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">Search User</label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Name or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700">Filter by Role</label>
            <select id="roleFilter" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3">
              <option value="all">All Roles</option>
              {userRoles.map(role => <option key={role} value={role} className="capitalize">{role.charAt(0).toUpperCase() + role.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Filter by Status</label>
            <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as UserManaged['status'] | 'all')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3">
              <option value="all">All Statuses</option>
              {userStatuses.map(status => <option key={status} value={status} className="capitalize">{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
            </select>
          </div>
           <Button variant="outline" icon={<Filter size={16}/>} onClick={() => {setSearchTerm(''); setRoleFilter('all'); setStatusFilter('all');}} className="mt-1">
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card title="Registered Users">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    {user.details && <div className="text-xs text-gray-500">{user.details}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{format(parseISO(user.dateJoined), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                    <Button variant="icon" size="sm" onClick={() => alert(`Editing user ${user.name} (mock)`)} title="Edit User">
                        <Edit size={16} className="text-blue-600 hover:text-blue-800"/>
                    </Button>
                    <Button variant="icon" size="sm" onClick={() => handleChangePassword(user.id)} title="Change Password">
                        <Key size={16} className="text-yellow-600 hover:text-yellow-800"/>
                    </Button>
                    <Button variant="icon" size="sm" onClick={() => toggleUserStatus(user.id)} title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}>
                      {user.status === 'active' ? <ShieldOff size={16} className="text-red-600 hover:text-red-800"/> : <ShieldCheck size={16} className="text-green-600 hover:text-green-800"/>}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && <p className="text-center py-6 text-gray-500">No users found matching your criteria.</p>}
      </Card>
    </div>
  );
};

export default UserManagement;