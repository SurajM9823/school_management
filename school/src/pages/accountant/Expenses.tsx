import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { PlusCircle, Edit, Trash2, Filter, Calendar, Tag, CheckCircle, XCircle, AlertTriangle, DollarSign, Download } from 'lucide-react';
import { format } from 'date-fns';

interface Expense {
  id: string;
  date: string;
  category: string; // e.g., Utilities, Supplies, Maintenance, Salaries, Vendor Payments
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  vendor?: string;
  invoiceId?: string;
  paymentDate?: string;
}

const mockExpenses: Expense[] = [
  {
    id: 'exp1',
    date: '2024-05-28',
    category: 'Utilities',
    description: 'Electricity Bill - May 2024',
    amount: 15000,
    status: 'paid',
    vendor: 'City Power Ltd.',
    invoiceId: 'INV-CP-0524-001',
    paymentDate: '2024-05-30',
  },
  {
    id: 'exp2',
    date: '2024-06-01',
    category: 'Supplies',
    description: 'Stationery and Office Supplies',
    amount: 8500,
    status: 'approved',
    vendor: 'Office Needs Inc.',
    invoiceId: 'INV-ON-0624-015',
  },
  {
    id: 'exp3',
    date: '2024-06-03',
    category: 'Maintenance',
    description: 'Plumbing repairs - Block B',
    amount: 12000,
    status: 'pending',
    vendor: 'Quick Fix Services',
  },
  {
    id: 'exp4',
    date: '2024-06-05',
    category: 'Vendor Payments',
    description: 'Payment for IT Support Contract (June)',
    amount: 25000,
    status: 'paid',
    vendor: 'Tech Solutions Co.',
    invoiceId: 'INV-TS-0624-005',
    paymentDate: '2024-06-05',
  },
  {
    id: 'exp5',
    date: '2024-06-06',
    category: 'Salaries',
    description: 'Advance salary for Mr. Alex (Admin)',
    amount: 10000,
    status: 'rejected',
    vendor: 'N/A',
  },
];

const expenseCategories = ['Utilities', 'Supplies', 'Maintenance', 'Salaries', 'Vendor Payments', 'Travel', 'Other'];
const expenseStatuses = ['pending', 'approved', 'paid', 'rejected'];

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formState, setFormState] = useState<Partial<Expense>>({ date: format(new Date(), 'yyyy-MM-dd'), status: 'pending' });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({ from: '', to: '' });

  const handleSave = () => {
    if (!formState.category || !formState.description || !formState.amount || !formState.date) {
      alert('Please fill all required fields: Category, Description, Amount, and Date.');
      return;
    }
    if (editingExpense) {
      setExpenses(expenses.map(exp => exp.id === editingExpense.id ? { ...exp, ...formState } as Expense : exp));
      alert('Expense updated (mock)!');
    } else {
      const newId = `exp${Date.now()}`;
      setExpenses([...expenses, { ...formState, id: newId } as Expense]);
      alert('Expense added (mock)!');
    }
    setShowForm(false);
    setEditingExpense(null);
    setFormState({ date: format(new Date(), 'yyyy-MM-dd'), status: 'pending' });
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormState(expense);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(exp => exp.id !== id));
      alert('Expense deleted (mock)!');
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (exp.vendor && exp.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         exp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || exp.status === statusFilter;
    const matchesDate = (!dateRangeFilter.from || exp.date >= dateRangeFilter.from) &&
                        (!dateRangeFilter.to || exp.date <= dateRangeFilter.to);
    return matchesSearch && matchesCategory && matchesStatus && matchesDate;
  });

  const totalExpensesThisMonth = expenses
    .filter(exp => format(new Date(exp.date), 'yyyy-MM') === format(new Date(), 'yyyy-MM') && (exp.status === 'paid' || exp.status === 'approved'))
    .reduce((sum, exp) => sum + exp.amount, 0);

  const pendingApprovalsCount = expenses.filter(exp => exp.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Expenses Management</h1>
        <div className="flex space-x-3">
            <Button variant="outline" size="sm" icon={<Download size={16}/>}>Export Data</Button>
            <Button variant="primary" icon={<PlusCircle size={16} />} onClick={() => { setShowForm(true); setEditingExpense(null); setFormState({ date: format(new Date(), 'yyyy-MM-dd'), status: 'pending' }); }}>
                Add Expense
            </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <DollarSign size={24} />
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Expenses (This Month)</p>
                    <p className="text-xl font-semibold text-gray-900">₹{totalExpensesThisMonth.toLocaleString()}</p>
                </div>
            </div>
        </Card>
        <Card>
            <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                    <AlertTriangle size={24} />
                </div>
                <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                    <p className="text-xl font-semibold text-gray-900">{pendingApprovalsCount}</p>
                </div>
            </div>
        </Card>
         {/* Add more relevant stats cards if needed */}
      </div>


      {showForm && (
        <Card title={editingExpense ? "Edit Expense" : "Add New Expense"}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="exp-date" className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" id="exp-date" value={formState.date || ''} onChange={e => setFormState({...formState, date: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required/>
            </div>
            <div>
              <label htmlFor="exp-category" className="block text-sm font-medium text-gray-700">Category</label>
              <select id="exp-category" value={formState.category || ''} onChange={e => setFormState({...formState, category: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required>
                <option value="" disabled>Select Category</option>
                {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="exp-description" className="block text-sm font-medium text-gray-700">Description</label>
              <input type="text" id="exp-description" value={formState.description || ''} onChange={e => setFormState({...formState, description: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="Detailed description of the expense" required/>
            </div>
            <div>
              <label htmlFor="exp-amount" className="block text-sm font-medium text-gray-700">Amount (₹)</label>
              <input type="number" id="exp-amount" value={formState.amount || ''} onChange={e => setFormState({...formState, amount: parseFloat(e.target.value) || 0})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="0.00" required/>
            </div>
            <div>
              <label htmlFor="exp-status" className="block text-sm font-medium text-gray-700">Status</label>
              <select id="exp-status" value={formState.status || 'pending'} onChange={e => setFormState({...formState, status: e.target.value as Expense['status']})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                {expenseStatuses.map(stat => <option key={stat} value={stat}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="exp-vendor" className="block text-sm font-medium text-gray-700">Vendor (Optional)</label>
              <input type="text" id="exp-vendor" value={formState.vendor || ''} onChange={e => setFormState({...formState, vendor: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="Vendor name"/>
            </div>
            <div>
              <label htmlFor="exp-invoiceId" className="block text-sm font-medium text-gray-700">Invoice ID (Optional)</label>
              <input type="text" id="exp-invoiceId" value={formState.invoiceId || ''} onChange={e => setFormState({...formState, invoiceId: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="Invoice reference number"/>
            </div>
             {formState.status === 'paid' && (
                <div>
                    <label htmlFor="exp-paymentDate" className="block text-sm font-medium text-gray-700">Payment Date</label>
                    <input type="date" id="exp-paymentDate" value={formState.paymentDate || format(new Date(), 'yyyy-MM-dd')} onChange={e => setFormState({...formState, paymentDate: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                </div>
             )}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingExpense(null); setFormState({ date: format(new Date(), 'yyyy-MM-dd'), status: 'pending' }); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editingExpense ? "Save Changes" : "Add Expense"}</Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
            <div>
                <label htmlFor="search-expense" className="text-sm font-medium text-gray-700">Search</label>
                <input
                    id="search-expense"
                    type="text"
                    placeholder="Description, vendor, category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
            </div>
            <div>
                <label htmlFor="filter-category" className="text-sm font-medium text-gray-700">Category</label>
                <select id="filter-category" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3">
                    <option value="all">All Categories</option>
                    {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="filter-status" className="text-sm font-medium text-gray-700">Status</label>
                <select id="filter-status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3">
                    <option value="all">All Statuses</option>
                    {expenseStatuses.map(stat => <option key={stat} value={stat}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label htmlFor="filter-date-from" className="text-sm font-medium text-gray-700">Date From</label>
                    <input type="date" id="filter-date-from" value={dateRangeFilter.from} onChange={e => setDateRangeFilter(prev => ({...prev, from: e.target.value}))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                </div>
                <div>
                    <label htmlFor="filter-date-to" className="text-sm font-medium text-gray-700">Date To</label>
                    <input type="date" id="filter-date-to" value={dateRangeFilter.to} onChange={e => setDateRangeFilter(prev => ({...prev, to: e.target.value}))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                </div>
            </div>
        </div>
      </Card>

      <Card title="Expense Records">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(expense.date), 'dd MMM, yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{expense.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      expense.status === 'paid' ? 'bg-green-100 text-green-800' :
                      expense.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      expense.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.vendor || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="icon" size="sm" onClick={() => handleEdit(expense)} title="Edit"><Edit size={16} className="text-yellow-600"/></Button>
                    <Button variant="icon" size="sm" onClick={() => handleDelete(expense.id)} title="Delete"><Trash2 size={16} className="text-red-600"/></Button>
                    {/* Add approve/reject buttons if status is pending */}
                    {expense.status === 'pending' && (
                        <>
                            <Button variant="icon" size="sm" onClick={() => alert(`Approving ${expense.description}`)} title="Approve"><CheckCircle size={16} className="text-green-600"/></Button>
                            <Button variant="icon" size="sm" onClick={() => alert(`Rejecting ${expense.description}`)} title="Reject"><XCircle size={16} className="text-red-600"/></Button>
                        </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredExpenses.length === 0 && <p className="text-center py-4 text-gray-500">No expenses found matching your criteria.</p>}
      </Card>
    </div>
  );
};

export default Expenses;