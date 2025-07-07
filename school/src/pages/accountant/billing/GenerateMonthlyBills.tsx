import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { FileText, Download, Search, Calendar, Printer } from 'lucide-react';

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

interface FeeAssignment {
  id: string;
  studentId: string;
  studentName: string;
  packageId?: string;
  packageName?: string;
  customFees: FeeType[];
  totalAmount: number;
  paymentPlan: string;
}

interface Payment {
  id: string;
  studentId: string;
  invoiceNo: string;
  amount: number;
  date: string;
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

const GenerateMonthlyBills: React.FC = () => {
  const [students] = useState<Student[]>([
    { id: 'STU001', name: 'John Doe', class: 'Grade 5', section: 'A' },
    { id: 'STU002', name: 'Jane Smith', class: 'Grade 5', section: 'B' },
    { id: 'STU003', name: 'Alice Johnson', class: 'Grade 6', section: 'A' },
  ]);

  const [feeAssignments] = useState<FeeAssignment[]>([
    {
      id: '1',
      studentId: 'STU001',
      studentName: 'John Doe',
      packageId: '2',
      packageName: 'John Doe Custom Package',
      customFees: [],
      totalAmount: 5500,
      paymentPlan: 'Quarterly',
      feeTypes: [
        { id: '1', name: 'Tuition', amount: 5000, mandatory: true },
        { id: '2', name: 'Library', amount: 500, mandatory: false },
      ],
    },
    {
      id: '2',
      studentId: 'STU002',
      studentName: 'Jane Smith',
      packageId: '1',
      packageName: 'Grade Dele Package',
      customFees: [],
      totalAmount: 6500,
      paymentPlan: 'Monthly',
      feeTypes: [
        { id: '1', name: 'Tuition', amount: 5000, mandatory: true },
        { id: '2', name: 'Library', amount: 500, mandatory: false },
        { id: '3', name: 'Bus', amount: 1000, mandatory: false },
      ],
    },
  ]);

  const [payments] = useState<Payment[]>([
    { id: 'PAY001', studentId: 'STU001', invoiceNo: 'INV-2025-001', amount: 1000, date: '2025-06-10', status: 'Partial' },
  ]);

  const [bills, setBills] = useState<Bill[]>([
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
      paymentHistory: [{ id: 'PAY001', studentId: 'STU001', invoiceNo: 'INV-2025-001', amount: 1000, date: '2025-06-10', status: 'Partial' }],
    },
  ]);

  const [filters, setFilters] = useState({
    class: '',
    section: '',
    billingPeriod: '2025-07',
    searchQuery: '',
  });

  const generateBills = () => {
    const newBills: Bill[] = feeAssignments
      .filter(assignment => {
        const student = students.find(s => s.id === assignment.studentId);
        const existingBill = bills.find(bill => bill.studentId === assignment.studentId && bill.billingPeriod === filters.billingPeriod);
        return (
          (!filters.class || student?.class === filters.class) &&
          (!filters.section || student?.section === filters.section) &&
          !existingBill
        );
      })
      .map(assignment => {
        const student = students.find(s => s.id === assignment.studentId);
        const amount = assignment.paymentPlan === 'Monthly'
          ? assignment.totalAmount
          : assignment.paymentPlan === 'Quarterly'
            ? assignment.totalAmount / 3
            : assignment.paymentPlan === 'Annual'
              ? assignment.totalAmount / 12
              : assignment.totalAmount; // Custom plan
        const dueAmount = payments
          .filter(p => p.studentId === assignment.studentId && p.invoiceNo.startsWith('INV-2025'))
          .reduce((sum, p) => sum - p.amount, amount);
        const status = dueAmount <= 0 ? 'Paid' : dueAmount < amount ? 'Partial' : 'Due';
        return {
          id: `BILL${Date.now()}-${assignment.studentId}`,
          studentId: assignment.studentId,
          studentName: student?.name || '',
          class: student?.class || '',
          section: student?.section || '',
          invoiceNo: `INV-2025-${Math.floor(Math.random() * 10000)}`,
          feeDetails: assignment.customFees.length > 0 ? assignment.customFees : feePackages.find(p => p.id === assignment.packageId)?.feeTypes || [],
          totalAmount: parseFloat(amount.toFixed(2)),
          dueAmount: parseFloat(dueAmount.toFixed(2)),
          dueDate: new Date(new Date(filters.billingPeriod).setDate(15)).toISOString().split('T')[0],
          status,
          billingPeriod: filters.billingPeriod,
          paymentHistory: payments.filter(p => p.studentId === assignment.studentId && p.invoiceNo.startsWith('INV-2025')),
        };
      });

    setBills([...bills, ...newBills]);
  };

  const generatePDF = (bill: Bill) => {
    // Placeholder for PDF generation logic (IRD-compliant)
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <head>
          <title>Bill ${bill.invoiceNo}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .bill-container { max-width: 800px; margin: 0 auto; border: 1px solid #ccc; padding: 20px; }
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
          <div class="bill-container">
            <div class="header">
              <h1>School Fee Bill</h1>
              <p>School Name: XYZ International School</p>
              <p>PAN: 123456789</p>
              <p>Invoice No: ${bill.invoiceNo}</p>
              <ევ
            </div>
            <div class="details">
              <p><strong>Student Name:</strong> ${bill.studentName}</p>
              <p><strong>Student ID:</strong> ${bill.studentId}</p>
              <p><strong>Class:</strong> ${bill.class}</p>
              <p><strong>Section:</strong> ${bill.section}</p>
              <p><strong>Billing Period:</strong> ${bill.billingPeriod}</p>
              <p><strong>Due Date:</strong> ${bill.dueDate}</p>
            </div>
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
            <div class="details">
              <p><strong>Payment History:</strong></p>
              ${bill.paymentHistory.length > 0
                ? bill.paymentHistory.map(payment => `
                    <p>Payment ID: ${payment.id}, Amount: ₹${payment.amount.toFixed(2)}, Date: ${payment.date}, Status: ${payment.status}</p>
                  `).join('')
                : '<p>No payments made</p>'}
            </div>
            <div class="footer">
              <p>IRD Compliant Invoice | Generated on ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

  const printAllBills = () => {
    filteredBills.forEach(generatePDF);
  };

  const filteredBills = bills.filter(bill => {
    const student = students.find(s => s.id === bill.studentId);
    return (
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
        <h1 className="text-2xl font-semibold text-gray-900">Generate Monthly Bills</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button
            variant="primary"
            size="sm"
            icon={<FileText size={16} />}
            className="w-full sm:w-auto"
            onClick={generateBills}
          >
            Generate Bills
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Printer size={16} />}
            className="w-full sm:w-auto"
            onClick={printAllBills}
          >
            Print All Bills
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card title="Filter Bills">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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

      {/* Bills List */}
      <Card title="Generated Bills">
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

      {/* Navigation Links */}
      <div className="flex justify-end space-x-4">
        <Link to="/accountant/assign-fees" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          Assign Fees →
        </Link>
        <Link to="/accountant/billing-ledger" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          View Billing Ledger →
        </Link>
        <Link to="/accountant/due-fees" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          View Due Fees →
        </Link>
      </div>
    </div>
  );
};

export default GenerateMonthlyBills;