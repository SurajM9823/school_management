import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import StatsCard from '../../components/common/StatsCard';
import Button from '../../components/common/Button';
import { DollarSign, Users, FileText, Settings, PlusCircle, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const AccountantDashboard: React.FC = () => {
  // Mock data - replace with actual API data
  const summaryStatsData = {
    totalRevenue: { value: '₹1,250,000', change: '+5.2% this month', trend: 'up' as 'up' | 'down' | 'neutral' },
    totalExpenses: { value: '₹450,000', change: '+2.1% this month', trend: 'up' as 'up' | 'down' | 'neutral' },
    pendingFees: { value: '₹85,000', count: 15, trend: 'neutral' as 'up' | 'down' | 'neutral' }, // Added trend
    upcomingPayroll: { value: '₹320,000', date: 'June 30th', trend: 'neutral' as 'up' | 'down' | 'neutral' }, // Added trend
  };

  const recentActivities = [
    { id: 1, type: 'payment' as const, description: 'Fee payment received from Student ID #1023 for Class 8A.', time: '2 hours ago', amount: '₹12,000', status: 'success' as const },
    { id: 2, type: 'expense' as const, description: 'Vendor payment for IT services.', time: '1 day ago', amount: '₹25,000', status: 'processed' as const },
    { id: 3, type: 'payroll' as const, description: 'Monthly payroll processed for teaching staff.', time: '3 days ago', amount: '₹280,000', status: 'processed' as const },
    { id: 4, type: 'alert' as const, description: '3 Overdue fee payments require attention.', time: '4 days ago', status: 'warning' as const },
  ];

  const quickLinks = [
    { to: '/accountant/fees', label: 'Manage Fee Payments', icon: DollarSign },
    { to: '/accountant/fee-structures', label: 'Define Fee Structures', icon: FileText },
    { to: '/accountant/payroll', label: 'Process Payroll', icon: Users },
    { to: '/accountant/expenses', label: 'Track Expenses', icon: DollarSign },
    { to: '/accountant/reports', label: 'Generate Financial Reports', icon: FileText },
    { to: '/accountant/settings', label: 'Accounting Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Accountant Dashboard</h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Link to="/accountant/fees" className="w-full sm:w-auto">
            <Button variant="primary" size="sm" icon={<PlusCircle size={16} />} className="w-full">
              Record Payment
            </Button>
          </Link>
          <Link to="/accountant/expenses" className="w-full sm:w-auto">
            <Button variant="secondary" size="sm" icon={<PlusCircle size={16} />} className="w-full">
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue (Month)"
          value={summaryStatsData.totalRevenue.value}
          icon={<TrendingUp size={24} />}
          color="green"
          change={{ value: summaryStatsData.totalRevenue.change, trend: summaryStatsData.totalRevenue.trend }}
        />
        <StatsCard
          title="Total Expenses (Month)"
          value={summaryStatsData.totalExpenses.value}
          icon={<TrendingDown size={24} />}
          color="red"
          change={{ value: summaryStatsData.totalExpenses.change, trend: summaryStatsData.totalExpenses.trend }}
        />
        <StatsCard
          title="Pending Fees"
          value={summaryStatsData.pendingFees.value}
          icon={<AlertCircle size={24} />}
          color="yellow"
          change={{ value: `${summaryStatsData.pendingFees.count} students`, trend: summaryStatsData.pendingFees.trend }}
        />
        <StatsCard
          title="Upcoming Payroll"
          value={summaryStatsData.upcomingPayroll.value}
          icon={<Users size={24} />}
          color="blue"
          change={{ value: `Due: ${summaryStatsData.upcomingPayroll.date}`, trend: summaryStatsData.upcomingPayroll.trend }}
        />
      </div>

      {/* Quick Links & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Links */}
        <Card title="Quick Links" className="lg:col-span-1">
          <nav className="space-y-1">
            {quickLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="group flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <link.icon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                {link.label}
              </Link>
            ))}
          </nav>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Financial Activities" className="lg:col-span-2">
          {recentActivities.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recentActivities.map(activity => (
                <li key={activity.id} className="py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {activity.type === 'payment' && <DollarSign className={`h-6 w-6 p-0.5 rounded-full ${activity.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`} />}
                      {activity.type === 'expense' && <TrendingDown className={`h-6 w-6 p-0.5 rounded-full ${activity.status === 'processed' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`} />}
                      {activity.type === 'payroll' && <Users className={`h-6 w-6 p-0.5 rounded-full ${activity.status === 'processed' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`} />}
                      {activity.type === 'alert' && <AlertCircle className="h-6 w-6 p-0.5 rounded-full bg-yellow-100 text-yellow-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {activity.time}
                        {activity.amount && ` - Amount: ${activity.amount}`}
                      </p>
                    </div>
                    {activity.status && (
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        activity.status === 'success' ? 'bg-green-100 text-green-800' :
                        activity.status === 'processed' ? 'bg-blue-100 text-blue-800' :
                        activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                       }`}>
                         {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                       </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No recent activities to display.</p>
          )}
          {recentActivities.length > 0 && (
            <div className="mt-4">
              <Link to="/accountant/reports" /* Or a dedicated activity log page */ className="text-sm font-medium text-blue-600 hover:text-blue-500">
                View all activities →
              </Link>
            </div>
          )}
        </Card>
      </div>
      {/* TODO: Add more accountant-specific components and data, integrate with API */}
    </div>
  );
};

export default AccountantDashboard;