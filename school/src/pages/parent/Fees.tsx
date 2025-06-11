import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { DollarSign, CheckCircle, AlertCircle, Calendar, Download, CreditCard, Eye } from 'lucide-react';
import { format, parseISO, isPast, isSameDay } from 'date-fns';

interface FeeInstallment {
  id: string;
  invoiceNumber: string;
  feeType: string; // e.g., Tuition Fee, Term 1 Fee, Transport Fee
  description: string;
  amountDue: number;
  dueDate: string; // YYYY-MM-DD
  status: 'Paid' | 'Unpaid' | 'Overdue';
  paymentDate?: string; // YYYY-MM-DD if paid
  paymentMethod?: string; // e.g., Online, Bank Transfer
  transactionId?: string;
}

// Mock data - In a real app, this would come from an API for the selected child
const mockFeeData: FeeInstallment[] = [
  {
    id: 'fee001',
    invoiceNumber: 'INV-2024-00123',
    feeType: 'Term 1 Fee (2024-25)',
    description: 'Tuition, Library, Lab, and Sports Fee for Term 1.',
    amountDue: 25000,
    dueDate: '2024-04-15',
    status: 'Paid',
    paymentDate: '2024-04-10',
    paymentMethod: 'Online Transfer',
    transactionId: 'TXN123456789',
  },
  {
    id: 'fee002',
    invoiceNumber: 'INV-2024-00245',
    feeType: 'Transport Fee (Apr-Jun 2024)',
    description: 'Quarterly bus fee.',
    amountDue: 8000,
    dueDate: '2024-04-20',
    status: 'Paid',
    paymentDate: '2024-04-18',
    paymentMethod: 'Credit Card',
    transactionId: 'TXN987654321',
  },
  {
    id: 'fee003',
    invoiceNumber: 'INV-2024-00350',
    feeType: 'Term 2 Fee (2024-25)',
    description: 'Tuition, Library, Lab, and Sports Fee for Term 2.',
    amountDue: 25000,
    dueDate: '2024-07-15',
    status: 'Unpaid',
  },
  {
    id: 'fee004',
    invoiceNumber: 'INV-2023-00890', // Previous year example
    feeType: 'Term 4 Fee (2023-24)',
    description: 'Tuition, Library, Lab, and Sports Fee for Term 4.',
    amountDue: 22000,
    dueDate: '2024-01-10', // Past due date
    status: 'Overdue',
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<FeeInstallment | null>(null);

  const summary = useMemo(() => {
    const totalDue = feeRecords
      .filter(fee => fee.status === 'Unpaid' || fee.status === 'Overdue')
      .reduce((sum, fee) => sum + fee.amountDue, 0);
    const totalPaid = feeRecords
      .filter(fee => fee.status === 'Paid')
      .reduce((sum, fee) => sum + fee.amountDue, 0);
    return { totalDue, totalPaid };
  }, [feeRecords]);

  const handlePayNow = (fee: FeeInstallment) => {
    setSelectedFeeForPayment(fee);
    // setShowPaymentModal(true); // In a real app, this would open a payment gateway or modal
    alert(`Redirecting to payment for Invoice ${fee.invoiceNumber} - Amount: ₹${fee.amountDue.toLocaleString()}. (Mock Action)`);
  };
  
  const handleViewReceipt = (fee: FeeInstallment) => {
      alert(`Viewing receipt for Invoice ${fee.invoiceNumber}. Payment Date: ${fee.paymentDate}, Method: ${fee.paymentMethod}, TXN ID: ${fee.transactionId}. (Mock Action)`);
  };

  const getStatusPill = (status: FeeInstallment['status']) => {
    let colorClasses = '';
    let IconComponent = null;

    switch (status) {
      case 'Paid':
        colorClasses = 'bg-green-100 text-green-800';
        IconComponent = <CheckCircle size={14} className="mr-1" />;
        break;
      case 'Unpaid':
        colorClasses = 'bg-yellow-100 text-yellow-800';
        IconComponent = <AlertCircle size={14} className="mr-1" />;
        break;
      case 'Overdue':
        colorClasses = 'bg-red-100 text-red-800';
        IconComponent = <AlertCircle size={14} className="mr-1" />;
        break;
      default:
        colorClasses = 'bg-gray-100 text-gray-800';
    }
    return (
      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses} items-center`}>
        {IconComponent}
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <DollarSign size={28} className="mr-3 text-green-600"/> Child's Fees & Payments
        </h1>
        {/* Child selector would go here if not handled globally */}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Outstanding Fees</p>
              <p className="text-2xl font-semibold text-gray-900">₹{summary.totalDue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Fees Paid (This Year)</p>
              <p className="text-2xl font-semibold text-gray-900">₹{summary.totalPaid.toLocaleString()}</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feeRecords.map((fee) => (
                  <tr key={fee.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{fee.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">{fee.feeType}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{fee.description}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">₹{fee.amountDue.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(parseISO(fee.dueDate), 'MMM dd, yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusPill(fee.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {fee.status === 'Paid' ? (
                        <Button variant="outline" size="sm" icon={<Eye size={14}/>} onClick={() => handleViewReceipt(fee)}>
                          View Receipt
                        </Button>
                      ) : (
                        <Button variant="primary" size="sm" icon={<CreditCard size={14}/>} onClick={() => handlePayNow(fee)}>
                          Pay Now
                        </Button>
                      )}
                       <Button variant="icon" size="sm" title="Download Invoice" onClick={() => alert(`Downloading invoice ${fee.invoiceNumber}`)}>
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
            <p className="mt-1 text-sm text-gray-500">
              Fee information for your child is not available at this time.
            </p>
          </div>
        )}
      </Card>
      {/* TODO: Add payment modal if handling payments within the app */}
    </div>
  );
};

export default Fees;