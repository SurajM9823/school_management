import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { PlusCircle, Save, Trash2, Edit2 } from 'lucide-react';

interface FeeType {
  id: string;
  name: string;
  amount: number;
  mandatory: boolean;
}

interface FeePackage {
  id: string;
  name: string;
  class: string;
  section: string;
  paymentPlan: string;
  totalAmount: number;
  feeTypes: FeeType[];
}

const FeeStructureSetup: React.FC = () => {
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([
    { id: '1', name: 'Tuition', amount: 5000, mandatory: true },
    { id: '2', name: 'Library', amount: 500, mandatory: false },
    { id: '3', name: 'Bus', amount: 1000, mandatory: false },
  ]);

  const [feePackages, setFeePackages] = useState<FeePackage[]>([
    {
      id: '1',
      name: 'Grade 5 Annual Package',
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
  ]);

  const [newFeeType, setNewFeeType] = useState({ name: '', amount: 0, mandatory: false });
  const [newPackage, setNewPackage] = useState({
    name: '',
    class: '',
    section: '',
    paymentPlan: 'Monthly',
    selectedFeeTypes: [] as string[],
  });

  const addFeeType = () => {
    if (newFeeType.name && newFeeType.amount > 0) {
      setFeeTypes([...feeTypes, { id: Date.now().toString(), ...newFeeType }]);
      setNewFeeType({ name: '', amount: 0, mandatory: false });
    }
  };

  const deleteFeeType = (id: string) => {
    setFeeTypes(feeTypes.filter(fee => fee.id !== id));
  };

  const addFeePackage = () => {
    if (newPackage.name && newPackage.class && newPackage.section) {
      const selectedFees = feeTypes.filter(fee => newPackage.selectedFeeTypes.includes(fee.id));
      const totalAmount = selectedFees.reduce((sum, fee) => sum + fee.amount, 0);
      setFeePackages([
        ...feePackages,
        {
          id: Date.now().toString(),
          name: newPackage.name,
          class: newPackage.class,
          section: newPackage.section,
          paymentPlan: newPackage.paymentPlan,
          totalAmount,
          feeTypes: selectedFees,
        },
      ]);
      setNewPackage({ name: '', class: '', section: '', paymentPlan: 'Monthly', selectedFeeTypes: [] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Fee Structure Setup</h1>
        <Button variant="primary" size="sm" icon={<Save size={16} />} className="w-full sm:w-auto">
          Save Changes
        </Button>
      </div>

      {/* Fee Types Section */}
      <Card title="Fee Types">
        <div className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Fee Type Name"
              value={newFeeType.name}
              onChange={e => setNewFeeType({ ...newFeeType, name: e.target.value })}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Amount (₹)"
              value={newFeeType.amount || ''}
              onChange={e => setNewFeeType({ ...newFeeType, amount: parseFloat(e.target.value) || 0 })}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newFeeType.mandatory}
                onChange={e => setNewFeeType({ ...newFeeType, mandatory: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700">Mandatory</label>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle size={16} />}
            className="mt-3"
            onClick={addFeeType}
          >
            Add Fee Type
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mandatory</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feeTypes.map(fee => (
                <tr key={fee.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fee.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fee.mandatory ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteFeeType(fee.id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Fee Packages Section */}
      <Card title="Fee Packages">
        <div className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Package Name"
              value={newPackage.name}
              onChange={e => setNewPackage({ ...newPackage, name: e.target.value })}
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
            className="mt-3"
            onClick={addFeePackage}
          >
            Add Fee Package
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.section}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.paymentPlan}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.totalAmount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {pkg.feeTypes.map(fee => fee.name).join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      <Edit2 size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
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
      <div className="flex justify-end">
        <Link to="/accountant/fee-packages" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          View Package Plans →
        </Link>
      </div>
    </div>
  );
};

export default FeeStructureSetup;