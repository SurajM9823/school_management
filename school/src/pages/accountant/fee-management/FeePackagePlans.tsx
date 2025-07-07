import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { PlusCircle, Save, Trash2, Edit2, Users, FileText } from 'lucide-react';

interface FeeType {
  id: string;
  name: string;
  amount: number;
  mandatory: boolean;
}

interface FeePackage {
  id: string;
  name: string;
  type: 'class' | 'individual';
  class?: string;
  section?: string;
  studentId?: string;
  paymentPlan: string;
  totalAmount: number;
  feeTypes: FeeType[];
}

const FeePackagePlans: React.FC = () => {
  const [feePackages, setFeePackages] = useState<FeePackage[]>([
    {
      id: '1',
      name: 'Grade 5 Annual Package',
      type: 'class',
      class: 'Grade 5',
      section: 'A',
      paymentPlan: 'Annual',
      totalAmount: 6500,
      feeTypes: [
        { id: '1', name: 'Tuition', amount: 5000, mandatory: true },
        { id: '2', name: 'Library', amount: 500, mandatory: false },
        { id: '3', name: 'Bus', amount: 1000, mandatory: false },
      ],
    },
    {
      id: '2',
      name: 'John Doe Custom Package',
      type: 'individual',
      studentId: 'STU123',
      paymentPlan: 'Quarterly',
      totalAmount: 5500,
      feeTypes: [
        { id: '1', name: 'Tuition', amount: 5000, mandatory: true },
        { id: '2', name: 'Library', amount: 500, mandatory: false },
      ],
    },
  ]);

  const [newPackage, setNewPackage] = useState({
    name: '',
    type: 'class' as 'class' | 'individual',
    class: '',
    section: '',
    studentId: '',
    paymentPlan: 'Monthly',
    selectedFeeTypes: [] as string[],
  });

  const [feeTypes] = useState<FeeType[]>([
    { id: '1', name: 'Tuition', amount: 5000, mandatory: true },
    { id: '2', name: 'Library', amount: 500, mandatory: false },
    { id: '3', name: 'Bus', amount: 1000, mandatory: false },
    { id: '4', name: 'Hostel', amount: 2000, mandatory: false },
    { id: '5', name: 'Lab', amount: 800, mandatory: false },
  ]);

  const addFeePackage = () => {
    if (newPackage.name && (newPackage.type === 'class' ? newPackage.class && newPackage.section : newPackage.studentId)) {
      const selectedFees = feeTypes.filter(fee => newPackage.selectedFeeTypes.includes(fee.id));
      const totalAmount = selectedFees.reduce((sum, fee) => sum + fee.amount, 0);
      setFeePackages([
        ...feePackages,
        {
          id: Date.now().toString(),
          name: newPackage.name,
          type: newPackage.type,
          class: newPackage.type === 'class' ? newPackage.class : undefined,
          section: newPackage.type === 'class' ? newPackage.section : undefined,
          studentId: newPackage.type === 'individual' ? newPackage.studentId : undefined,
          paymentPlan: newPackage.paymentPlan,
          totalAmount,
          feeTypes: selectedFees,
        },
      ]);
      setNewPackage({ name: '', type: 'class', class: '', section: '', studentId: '', paymentPlan: 'Monthly', selectedFeeTypes: [] });
    }
  };

  const deleteFeePackage = (id: string) => {
    setFeePackages(feePackages.filter(pkg => pkg.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Fee Package Plans</h1>
        <Button variant="primary" size="sm" icon={<Save size={16} />} className="w-full sm:w-auto">
          Save Changes
        </Button>
      </div>

      {/* Add Fee Package */}
      <Card title="Create Fee Package">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Package Name"
            value={newPackage.name}
            onChange={e => setNewPackage({ ...newPackage, name: e.target.value })}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newPackage.type}
            onChange={e => setNewPackage({ ...newPackage, type: e.target.value as 'class' | 'individual', class: '', section: '', studentId: '' })}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="class">Class-based</option>
            <option value="individual">Individual Student</option>
          </select>
          {newPackage.type === 'class' ? (
            <>
              <input
                type="text"
                placeholder="Class"
                value={newPackage.class}
                onChange={e => setNewPackage({ ...newPackage, class: e.target.value })}
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Section"
                value={newPackage.section}
                onChange={e => setNewPackage({ ...newPackage, section: e.target.value })}
                className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </>
          ) : (
            <input
              type="text"
              placeholder="Student ID"
              value={newPackage.studentId}
              onChange={e => setNewPackage({ ...newPackage, studentId: e.target.value })}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          <select
            value={newPackage.paymentPlan}
            onChange={e => setNewPackage({ ...newPackage, paymentPlan: e.target.value })}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annual">Annual</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700">Select Fee Types</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {feeTypes.map(fee => (
              <div key={fee.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={fee.id}
                  checked={newPackage.selectedFeeTypes.includes(fee.id)}
                  onChange={e => {
                    const updated = e.target.checked
                      ? [...newPackage.selectedFeeTypes, fee.id]
                      : newPackage.selectedFeeTypes.filter(id => id !== fee.id);
                    setNewPackage({ ...newPackage, selectedFeeTypes: updated });
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">{fee.name} (₹{fee.amount})</label>
              </div>
            ))}
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<PlusCircle size={16} />}
          className="mt-4"
          onClick={addFeePackage}
        >
          Add Fee Package
        </Button>
      </Card>

      {/* Fee Packages List */}
      <Card title="Fee Package Plans">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class/Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Types</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feePackages.map(pkg => (
                <tr key={pkg.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pkg.type === 'class' ? 'Class-based' : 'Individual'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pkg.type === 'class' ? pkg.class : pkg.studentId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.type === 'class' ? pkg.section : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.paymentPlan}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.totalAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pkg.feeTypes.map(fee => fee.name).join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteFeePackage(pkg.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Navigation Links */}
      <div className="flex justify-end space-x-4">
        <Link to="/accountant/fee-structures" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          Manage Fee Types →
        </Link>
        <Link to="/accountant/assign-fees" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          Assign Fees to Students →
        </Link>
      </div>
    </div>
  );
};

export default FeePackagePlans;