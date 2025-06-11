import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Users, DollarSign, PlusCircle, Edit, FileText, Send } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: string; // e.g., Teacher, Admin Staff, Support Staff
  department?: string;
  basicSalary: number;
  allowances: Array<{ name: string; amount: number }>;
  deductions: Array<{ name: string; amount: number }>; // e.g., PF, TDS
  netSalary?: number; // Calculated
  lastPayrollRun?: string; // Date of last payroll
}

const mockStaff: StaffMember[] = [
  {
    id: 'staff1',
    name: 'Dr. Emily Carter',
    role: 'Senior Teacher',
    department: 'Science',
    basicSalary: 70000,
    allowances: [{ name: 'HRA', amount: 15000 }, { name: 'Travel Allowance', amount: 5000 }],
    deductions: [{ name: 'Provident Fund', amount: 5000 }, { name: 'TDS', amount: 7000 }],
    lastPayrollRun: '2024-05-30',
  },
  {
    id: 'staff2',
    name: 'Mr. John Davis',
    role: 'Admin Officer',
    basicSalary: 50000,
    allowances: [{ name: 'Special Allowance', amount: 8000 }],
    deductions: [{ name: 'Provident Fund', amount: 3000 }, { name: 'TDS', amount: 4000 }],
    lastPayrollRun: '2024-05-30',
  },
];

// Calculate net salary
mockStaff.forEach(staff => {
  const totalAllowances = staff.allowances.reduce((sum, curr) => sum + curr.amount, 0);
  const totalDeductions = staff.deductions.reduce((sum, curr) => sum + curr.amount, 0);
  staff.netSalary = staff.basicSalary + totalAllowances - totalDeductions;
});

const Payroll: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>(mockStaff);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  // Basic form state for adding/editing staff salary details
  const [formState, setFormState] = useState<Partial<StaffMember>>({});

  const handleSaveStaff = () => {
    // TODO: Implement save logic (add new or update existing staff salary details)
    // Add validation
    if (editingStaff) {
      setStaffList(staffList.map(s => s.id === editingStaff.id ? {...s, ...formState} as StaffMember : s));
      alert('Staff salary details updated (mock)!');
    } else {
      const newId = `staff${Date.now()}`;
      // Ensure basicSalary, allowances, and deductions are initialized if not provided
      const newStaff: StaffMember = {
        id: newId,
        name: formState.name || 'New Staff',
        role: formState.role || 'Unassigned',
        basicSalary: formState.basicSalary || 0,
        allowances: formState.allowances || [],
        deductions: formState.deductions || [],
        ...formState,
      };
      setStaffList([...staffList, newStaff]);
      alert('Staff member added to payroll (mock)!');
    }
    setShowStaffForm(false);
    setEditingStaff(null);
    setFormState({});
  };
  
  const handleEditStaff = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormState(staff); // Pre-fill form with staff data
    setShowStaffForm(true);
  };

  const handleProcessPayrollRun = () => {
    // TODO: Implement logic for processing a payroll run
    alert('Processing payroll run for selected staff (mock)!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Payroll Management</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button variant="secondary" icon={<PlusCircle size={16} />} onClick={() => { setShowStaffForm(true); setEditingStaff(null); setFormState({}); }} className="w-full sm:w-auto">
            Add Staff to Payroll
          </Button>
          <Button variant="primary" icon={<Send size={16} />} onClick={handleProcessPayrollRun} className="w-full sm:w-auto">
            Process Payroll Run
          </Button>
        </div>
      </div>

      {showStaffForm && (
        <Card title={editingStaff ? "Edit Staff Salary Details" : "Add Staff to Payroll"}>
          <div className="space-y-4">
            <div>
              <label htmlFor="staff-name" className="block text-sm font-medium text-gray-700">Staff Name</label>
              <input type="text" id="staff-name" value={formState.name || ''} onChange={e => setFormState({...formState, name: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            <div>
              <label htmlFor="staff-role" className="block text-sm font-medium text-gray-700">Role</label>
              <input type="text" id="staff-role" value={formState.role || ''} onChange={e => setFormState({...formState, role: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>
             <div>
              <label htmlFor="staff-salary" className="block text-sm font-medium text-gray-700">Basic Salary (₹)</label>
              <input type="number" id="staff-salary" value={formState.basicSalary || ''} onChange={e => setFormState({...formState, basicSalary: parseFloat(e.target.value) || 0})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            </div>
            {/* TODO: Add dynamic fields for allowances and deductions */}
            <p className="text-sm text-gray-500">Detailed fields for allowances and deductions would be added here.</p>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowStaffForm(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveStaff}>{editingStaff ? "Save Changes" : "Add Staff"}</Button>
          </div>
        </Card>
      )}

      <Card title="Staff Payroll Overview">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Run</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staffList.map((staff) => (
                <tr key={staff.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.basicSalary.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700">{staff.netSalary?.toLocaleString() || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.lastPayrollRun || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="icon" size="sm" onClick={() => alert(`Viewing payslip for ${staff.name}`)} title="View Payslip"><FileText size={16} className="text-blue-600"/></Button>
                    <Button variant="icon" size="sm" onClick={() => handleEditStaff(staff)} title="Edit Salary Details"><Edit size={16} className="text-yellow-600"/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {staffList.length === 0 && <p className="text-center py-4 text-gray-500">No staff members added to payroll yet.</p>}
      </Card>
      {/* TODO: Add filtering, pagination, detailed view for staff, bulk payroll processing */}
    </div>
  );
};

export default Payroll;