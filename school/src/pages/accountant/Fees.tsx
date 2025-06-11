import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  DollarSign, 
  Users, 
  TrendingUp, 
  PlusCircle,
  Download,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { format } from 'date-fns';

// Mock data for fee records
const initialFeeRecords = [
  {
    id: 1,
    studentId: 1001,
    studentName: 'John Smith',
    class: '10A',
    feeType: 'Tuition Fee',
    amount: 25000,
    dueDate: '2023-06-15',
    status: 'paid',
    paymentDate: '2023-06-10'
  },
  {
    id: 2,
    studentId: 1002,
    studentName: 'Emily Johnson',
    class: '9B',
    feeType: 'Tuition Fee',
    amount: 25000,
    dueDate: '2023-06-15',
    status: 'unpaid',
    paymentDate: null
  },
  {
    id: 3,
    studentId: 1003,
    studentName: 'Michael Brown',
    class: '11A',
    feeType: 'Tuition Fee',
    amount: 30000,
    dueDate: '2023-06-15',
    status: 'paid',
    paymentDate: '2023-06-05'
  },
  {
    id: 4,
    studentId: 1004,
    studentName: 'Sarah Davis',
    class: '8C',
    feeType: 'Tuition Fee',
    amount: 20000,
    dueDate: '2023-06-15',
    status: 'overdue',
    paymentDate: null
  },
  {
    id: 5,
    studentId: 1005,
    studentName: 'David Wilson',
    class: '10A',
    feeType: 'Tuition Fee',
    amount: 25000,
    dueDate: '2023-06-15',
    status: 'paid',
    paymentDate: '2023-06-12'
  },
  {
    id: 6,
    studentId: 1001,
    studentName: 'John Smith',
    class: '10A',
    feeType: 'Lab Fee',
    amount: 5000,
    dueDate: '2023-06-20',
    status: 'unpaid',
    paymentDate: null
  },
  {
    id: 7,
    studentId: 1002,
    studentName: 'Emily Johnson',
    class: '9B',
    feeType: 'Transportation Fee',
    amount: 8000,
    dueDate: '2023-06-20',
    status: 'unpaid',
    paymentDate: null
  }
];

interface FeeRecord {
  id: number;
  studentId: number;
  studentName: string;
  class: string;
  feeType: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';
  paymentDate: string | null;
}

const Fees: React.FC = () => {
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>(initialFeeRecords);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [feeTypeFilter, setFeeTypeFilter] = useState('all');
  const [showAddFeeForm, setShowAddFeeForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);

  // Filter fee records based on search term and filters
  const filteredFeeRecords = feeRecords.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.studentId.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesClass = classFilter === 'all' || record.class === classFilter;
    const matchesFeeType = feeTypeFilter === 'all' || record.feeType === feeTypeFilter;
    
    return matchesSearch && matchesStatus && matchesClass && matchesFeeType;
  });

  const handlePayment = (id: number) => {
    const feeToUpdate = feeRecords.find(fee => fee.id === id);
    if (feeToUpdate) {
      setSelectedFee(feeToUpdate);
      setShowPaymentForm(true);
    }
  };

  const handleConfirmPayment = () => {
    if (selectedFee) {
      setFeeRecords(prev => 
        prev.map(fee => 
          fee.id === selectedFee.id 
            ? { ...fee, status: 'paid', paymentDate: format(new Date(), 'yyyy-MM-dd') } 
            : fee
        )
      );
      setShowPaymentForm(false);
      setSelectedFee(null);
    }
  };

  // Get unique classes and fee types for filters
  const classes = Array.from(new Set(feeRecords.map(record => record.class)));
  const feeTypes = Array.from(new Set(feeRecords.map(record => record.feeType)));

  // Calculate total amounts
  const totalFees = feeRecords.reduce((sum, record) => sum + record.amount, 0);
  const totalPaid = feeRecords
    .filter(record => record.status === 'paid')
    .reduce((sum, record) => sum + record.amount, 0);
  const totalPending = feeRecords
    .filter(record => record.status === 'unpaid' || record.status === 'overdue')
    .reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Fee Management</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            size="sm"
            icon={<Download size={16} />}
          >
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle size={16} />}
            onClick={() => setShowAddFeeForm(!showAddFeeForm)}
          >
            Add Fee
          </Button>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedFee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Record Fee Payment</h3>
            
            <div className="mb-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Student:</span>
                <span className="text-sm font-medium text-gray-900">{selectedFee.studentName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Fee Type:</span>
                <span className="text-sm font-medium text-gray-900">{selectedFee.feeType}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Amount:</span>
                <span className="text-sm font-medium text-gray-900">₹{selectedFee.amount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Due Date:</span>
                <span className="text-sm font-medium text-gray-900">
                  {format(new Date(selectedFee.dueDate), 'MMM dd, yyyy')}
                </span>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option>Cash</option>
                  <option>Online Transfer</option>
                  <option>Check</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Date
                </label>
                <input
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  defaultValue={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reference Number (Optional)
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Transaction ID or reference"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentForm(false);
                  setSelectedFee(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPayment}
              >
                Record Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Fees
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  ₹{totalFees.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Collected
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  ₹{totalPaid.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Pending
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  ₹{totalPending.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Add Fee Form */}
      {showAddFeeForm && (
        <Card title="Add New Fee">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="student" className="block text-sm font-medium text-gray-700">
                Student
              </label>
              <select
                id="student"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select Student</option>
                {Array.from(new Set(feeRecords.map(record => record.studentId))).map((studentId) => {
                  const student = feeRecords.find(record => record.studentId === studentId);
                  return (
                    <option key={studentId} value={studentId}>
                      {student?.studentName} (ID: {studentId})
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div>
              <label htmlFor="feeType" className="block text-sm font-medium text-gray-700">
                Fee Type
              </label>
              <select
                id="feeType"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {feeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value="new">Add New Fee Type...</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount (₹)
              </label>
              <input
                type="number"
                id="amount"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter amount"
              />
            </div>
            
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Add any additional details"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6 space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowAddFeeForm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
            >
              Add Fee
            </Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search student name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                Class {cls}
              </option>
            ))}
          </select>
        </div>

        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={feeTypeFilter}
            onChange={(e) => setFeeTypeFilter(e.target.value)}
          >
            <option value="all">All Fee Types</option>
            {feeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fee Records Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFeeRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {record.studentName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                        <div className="text-sm text-gray-500">ID: {record.studentId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{record.feeType}</div>
                    <div className="text-sm text-gray-500">Class {record.class}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{record.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(record.dueDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : record.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.paymentDate 
                      ? format(new Date(record.paymentDate), 'MMM dd, yyyy')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {record.status !== 'paid' && (
                        <button
                          onClick={() => handlePayment(record.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <span>Pay</span>
                          <ArrowRight size={16} className="ml-1" />
                        </button>
                      )}
                      {record.status === 'paid' && (
                        <button
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Receipt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredFeeRecords.length === 0 && (
          <div className="text-center py-10">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No fee records found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Fees;