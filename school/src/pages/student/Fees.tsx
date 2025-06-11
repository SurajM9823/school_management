import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { DollarSign, CheckCircle, AlertCircle, Calendar, Download, Eye, Info } from 'lucide-react';
import { format, parseISO, isPast, isSameDay } from 'date-fns';

interface FeeInstallment {
  id: string;
  invoiceNumber: string;
  feeType: string;
  description: string;
  amountDue: number;
  dueDate: string; // YYYY-MM-DD
  status: 'Paid' | 'Unpaid' | 'Overdue';
  paymentDate?: string; // YYYY-MM-DD if paid
  paymentMethod?: string; 
}

// Mock data - In a real app, this would come from an API for the logged-in student
const mockFeeData: FeeInstallment[] = [
  {
    id: 'fee001',
    invoiceNumber: 'INV-2024-S00123',
    feeType: 'Term 1 Fee (2024-25)',
    description: 'Tuition, Library, Lab, and Sports Fee for Term 1.',
    amountDue: 25000,
    dueDate: '2024-04-15',
    status: 'Paid',
    paymentDate: '2024-04-10',
    paymentMethod: 'Online (via Parent Portal)',
  },
  {
    id: 'fee002',
    invoiceNumber: 'INV-2024-S00245',
    feeType: 'Transport Fee (Apr-Jun 2024)',
    description: 'Quarterly bus fee.',
    amountDue: 8000,
    dueDate: '2024-04-20',
    status: 'Paid',
    paymentDate: '2024-04-18',
    paymentMethod: 'Online (via Parent Portal)',
  },
  {
    id: 'fee003',
    invoiceNumber: 'INV-2024-S00350',
    feeType: 'Term 2 Fee (2024-25)',
    description: 'Tuition, Library, Lab, and Sports Fee for Term 2.',
    amountDue: 25000,
    dueDate: '2024-07-15',
    status: 'Unpaid',
  },
  {
    id: 'fee004',
    invoiceNumber: 'INV-2023-S00890',
    feeType: 'Term 4 Fee (2023-24)',
    description: 'Tuition, Library, Lab, and Sports Fee for Term 4.',
    amountDue: 22000,
    dueDate: '2024-01-10',
    status: 'Overdue',
  },
  {
    id: 'fee005',
    invoiceNumber: 'INV-2024-S00410',
    feeType: 'Activity Fee - Science Club',
    description: 'Annual fee for Science Club membership and activities.',
    amountDue: 1500,
    dueDate: '2024-05-10',
    status: 'Paid',
    paymentDate: '2024-05-05',
    paymentMethod: 'Cash (at office)',
  },
];

// Update status for overdue items dynamically
const getUpdatedFeeData = (fees: FeeInstallment[]): FeeInstallment[] => {
    return fees.map(fee => {
        if (fee.status === 'Unpaid' && isPast(parseISO(fee.dueDate)) && !isSameDay(parseISO(fee.dueDate), new Date())) {
            return { ...fee, status: 'Overdue' };
        }
        return fee;
    });
};

const Fees: React.FC = () => {
  const [feeRecords, setFeeRecords] = useState<FeeInstallment[]>(getUpdatedFeeData(mockFeeData));
  // Students typically don't pay, so no payment modal state here.

  const summary = useMemo(() => {
    const totalDue = feeRecords
      .filter(fee => fee.status === 'Unpaid' || fee.status === 'Overdue')
      .reduce((sum, fee) => sum + fee.amountDue, 0);
    const totalPaidThisYear = feeRecords // Example: filter for current academic year if needed
      .filter(fee => fee.status === 'Paid' && parseISO(fee.paymentDate!).getFullYear() === new Date().getFullYear())
      .reduce((sum, fee) => sum + fee.amountDue, 0);
    return { totalDue, totalPaidThisYear };
  }, [feeRecords]);
  
  const handleViewDetails = (fee: FeeInstallment) => {
      let details = `Invoice: ${fee.invoiceNumber}\nFee Type: ${fee.feeType}\nAmount: ₹${fee.amountDue.toLocaleString()}\nDue: ${format(parseISO(fee.dueDate), 'MMM dd, yyyy')}\nStatus: ${fee.status}`;
      if(fee.paymentDate) details += `\nPaid On: ${format(parseISO(fee.paymentDate), 'MMM dd, yyyy')}`;
      if(fee.paymentMethod) details += `\nMethod: ${fee.paymentMethod}`;
      alert(details); // Replace with a modal for better UI
  };

  const getStatusPill = (status: FeeInstallment['status']) => {
    let colorClasses = '';
    let IconComponent = Info; // Default
    switch (status) {
      case 'Paid': colorClasses = 'bg-green-100 text-green-800'; IconComponent = CheckCircle; break;
      case 'Unpaid': colorClasses = 'bg-yellow-100 text-yellow-800'; IconComponent = AlertCircle; break;
      case 'Overdue': colorClasses = 'bg-red-100 text-red-800'; IconComponent = AlertCircle; break;
    }
    return (
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses} items-center`}>
        <IconComponent size={14} className="mr-1.5" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <DollarSign size={28} className="mr-3 text-green-600"/> My Fees & Payments
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4"><AlertCircle size={24} /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Outstanding Fees</p>
              <p className="text-2xl font-semibold text-gray-900">₹{summary.totalDue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4"><CheckCircle size={24} /></div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Fees Paid (This Year)</p>
              <p className="text-2xl font-semibold text-gray-900">₹{summary.totalPaidThisYear.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Fee Records Table/List */}
      <Card title="Fee Payment History & Dues">
        {feeRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feeRecords.map((fee) => (
                  <tr key={fee.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{fee.invoiceNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{fee.feeType}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{fee.description}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-semibold">₹{fee.amountDue.toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{format(parseISO(fee.dueDate), 'MMM dd, yyyy')}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getStatusPill(fee.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button variant="outline" size="sm" icon={<Eye size={14}/>} onClick={() => handleViewDetails(fee)}>
                          Details
                        </Button>
                       <Button variant="icon" size="sm" title="Download Invoice" onClick={() => alert(`Downloading invoice ${fee.invoiceNumber}.pdf (Mock)`)}>
                            <Download size={16} className="text-gray-500 hover:text-gray-700"/>
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Fee Records Found</h3>
            <p className="mt-1 text-sm text-gray-500">Your fee information is not available or all dues are cleared.</p>
          </div>
        )}
      </Card>
      <p className="text-xs text-center text-gray-500 mt-4">For fee payments, please contact your parents/guardians or the school accounts office.</p>
    </div>
  );
};

export default Fees;