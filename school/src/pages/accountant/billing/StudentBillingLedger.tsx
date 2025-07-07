import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { FileText, Download, Search, Eye, Calendar } from 'lucide-react';

interface FeeType {
  id: string;
  name: string;
  amount: number;
  mandatory: boolean;
}

interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
}

interface Payment {
  id: string;
  studentId: string;
  invoiceNo: string;
  amount: number;
  date: string;
  method: 'Cash' | 'Bank' | 'QR' | 'Nagad' | 'eSewa';
  status: 'Paid' | 'Partial';
}

interface Bill {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  invoiceNo: string;
  feeDetails: FeeType[];
  totalAmount: number;
  dueAmount: number;
  dueDate: string;
  status: 'Paid' | 'Due' | 'Partial';
  billingPeriod: string;
  paymentHistory: Payment[];
}

const StudentBillingLedger: React.FC = () => {
  const [students] = useState<Student[]>([
    { id: 'STU001', name: 'John Doe', class: 'Grade 5', section: 'A' },
    { id: 'STU002', name: 'Jane Smith', class: 'Grade 5', section: 'B' },
    { id: 'STU003', name: 'Alice Johnson', class: 'Grade 6', section: 'A' },
  ]);

  const [bills] = useState<Bill[]>([
    {
      id: 'BILL001',
      studentId: 'STU001',
      studentName: 'John Doe',
      class: 'Grade 5',
      section: 'A',
      invoiceNo: 'INV-2025-001',
      feeDetails: [
        { id: '1', name: 'Tuition', amount: 5000, mandatory: true },
        { id: '2', name: 'Library', amount: 500, mandatory: false },
      ],
      totalAmount: 5500,
      dueAmount: 4500,
      dueDate: '2025-07-15',
      status: 'Partial',
      billingPeriod: 'July 2025',
      paymentHistory: [
        { id: 'PAY001', studentId: 'STU001', invoiceNo: 'INV-2025-001', amount: 1000, date: '2025-06-10', method: 'Cash', status: 'Partial' },
      ],
    },
    {
      id: 'BILL002',
      studentId: 'STU002',
      studentName: 'Jane Smith',
      class: 'Grade 5',
      section: 'B',
      invoiceNo: 'INV-2025-002',
      feeDetails: [
        { id: '1', name: 'Tuition', amount: 5000, mandatory: true },
        { id: '2', name: 'Library', amount: 500, mandatory: false },
        { id: '3', name: 'Bus', amount: 1000, mandatory: false },
      ],
      totalAmount: 6500,
      dueAmount: 6500,
      dueDate: '2025-07-15',
      status: 'Due',
      billingPeriod: 'July 2025',
      paymentHistory: [],
    },
    {
      id: 'BILL003',
      studentId: 'STU001',
      studentName: 'John Doe',
      class: 'Grade 5',
      section: 'A',
      invoiceNo: 'INV-2025-003',
      feeDetails: [
        { id: '1', name: 'Tuition', amount: 5000, mandatory: true },
        { id: '2', name: 'Library', amount: 500, mandatory: false },
      ],
      totalAmount: 5500,
      dueAmount: 0,
      dueDate: '2025-06-15',
      status: 'Paid',
      billingPeriod: 'June 2025',
      paymentHistory: [
        { id: 'PAY002', studentId: 'STU001', invoiceNo: 'INV-2025-003', amount: 5500, date: '2025-06-05', method: 'Bank', status: 'Paid' },
      ],
    },
  ]);

  const [filters, setFilters] = useState({
    studentId: '',
    class: '',
    section: '',
    billingPeriod: '',
    searchQuery: '',
  });

  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const generatePDF = (bill: Bill) => {
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <head>
          <title>Ledger for ${bill.studentName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .ledger-container { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { margin: 0; }
            .details { margin-bottom: 20px; }
            .details p { margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; }
            .footer { text-align: center; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="ledger-container">
            <div class="header">
              <h1>Student Billing Ledger</h1>
              <p>School Name: XYZ International School</p>
              <p>PAN: 123456789</p>
            </div>
            <div class="details">
              <p><strong>Student Name:</strong> ${bill.studentName}</p>
              <p><strong>Student ID:</strong> ${bill.studentId}</p>
              <p><strong>Class:</strong> ${bill.class}</p>
              <p><strong>Section:</strong> ${bill.section}</p>
              <p><strong>Billing Period:</strong> ${bill.billingPeriod}</p>
            </div>
            <h3>Fee Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Fee Type</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${bill.feeDetails.map(fee => `
                  <tr>
                    <td>${fee.name}</td>
                    <td>₹${fee.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr class="total">
                  <td>Total Amount</td>
                  <td>₹${bill.totalAmount.toFixed(2)}</td>
                </tr>
                <tr class="total">
                  <td>Paid Amount</td>
                  <td>₹${(bill.totalAmount - bill.dueAmount).toFixed(2)}</td>
                </tr>
                <tr class="total">
                  <td>Due Amount</td>
                  <td>₹${bill.dueAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <h3>Payment History</h3>
            <table>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Invoice No</th>
                  <th>Amount (₹)</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${bill.paymentHistory.length > 0
                  ? bill.paymentHistory.map(payment => `
                      <tr>
                        <td>${payment.id}</td>
                        <td>${payment.invoiceNo}</td>
                        <td>₹${payment.amount.toFixed(2)}</td>
                        <td>${payment.date}</td>
                        <td>${payment.method}</td>
                        <td>${payment.status}</td>
                      </tr>
                    `).join('')
                  : '<tr><td colspan="6">No payments made</td></tr>'}
              </tbody>
            </table>
            <div class="footer">
              <p>IRD Compliant Ledger | Generated on ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

  const printAllLedgers = () => {
    filteredBills.forEach(generatePDF);
  };

  const filteredBills = bills.filter(bill => {
    return (
      (!filters.studentId || bill.studentId === filters.studentId) &&
      (!filters.class || bill.class === filters.class) &&
      (!filters.section || bill.section === filters.section) &&
      (!filters.billingPeriod || bill.billingPeriod === filters.billingPeriod) &&
      (bill.studentName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        bill.studentId.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        bill.invoiceNo.toLowerCase().includes(filters.searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Student Billing Ledger</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button
            variant="primary"
            size="sm"
            icon={<Download size={16} />}
            className="w-full sm:w-auto"
            onClick={printAllLedgers}
          >
            Print All Ledgers
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card title="Filter Ledger">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Student Name, ID, Invoice No"
              value={filters.searchQuery}
              onChange={e => setFilters({ ...filters, searchQuery: e.target.value })}
              className="border rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <select
            value={filters.studentId}
            onChange={e => setFilters({ ...filters, studentId: e.target.value })}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Students</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.id})
              </option>
            ))}
          </select>
          <select
            value={filters.class}
            onChange={e => setFilters({ ...filters, class: e.target.value })}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Classes</option>
            {[...new Set(students.map(s => s.class))].map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <select
            value={filters.section}
            onChange={e => setFilters({ ...filters, section: e.target.value })}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sections</option>
            {[...new Set(students.map(s => s.section))].map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>
          <div className="relative">
            <input
              type="month"
              value={filters.billingPeriod}
              onChange={e => setFilters({ ...filters, billingPeriod: e.target.value })}
              className="border rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
            <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </Card>

      {/* Ledger List */}
      <Card title="Student Billing Ledger">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Amount (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Billing Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBills.map(bill => (
                <tr key={bill.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.invoiceNo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.studentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.studentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.section}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.dueAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        bill.status === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : bill.status === 'Due'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.billingPeriod}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedBill(bill)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => generatePDF(bill)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Bill Details - {selectedBill.studentName}</h2>
            <div className="space-y-4">
              <div>
                <p><strong>Invoice No:</strong> {selectedBill.invoiceNo}</p>
                <p><strong>Student ID:</strong> {selectedBill.studentId}</p>
                <p><strong>Class:</strong> {selectedBill.class}</p>
                <p><strong>Section:</strong> {selectedBill.section}</p>
                <p><strong>Billing Period:</strong> {selectedBill.billingPeriod}</p>
                <p><strong>Due Date:</strong> {selectedBill.dueDate}</p>
                <p><strong>Status:</strong> {selectedBill.status}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Fee Details</h3>
                <table className="min-w-full divide-y divide-gray-200 mt-2">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedBill.feeDetails.map(fee => (
                      <tr key={fee.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{fee.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{fee.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="px-4 py-2 text-sm text-gray-900">Total</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{selectedBill.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Payment History</h3>
                <table className="min-w-full divide-y divide-gray-200 mt-2">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount (₹)</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedBill.paymentHistory.length > 0 ? (
                      selectedBill.paymentHistory.map(payment => (
                        <tr key={payment.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{payment.id}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{payment.amount.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{payment.date}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{payment.method}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{payment.status}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-sm text-gray-900 text-center">No payments made</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedBill(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Download size={16} />}
                onClick={() => generatePDF(selectedBill)}
              >
                Print Ledger
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex justify-end space-x-4">
        <Link to="/accountant/generate-bills" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          Generate Bills →
        </Link>
        <Link to="/accountant/due-fees" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          View Due Fees →
        </Link>
        <Link to="/accountant/payment-receipts" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          View Payment Receipts →
        </Link>
      </div>
    </div>
  );
};

export default StudentBillingLedger;