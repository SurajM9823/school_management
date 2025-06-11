import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  BookOpen,
  DollarSign,
  Award,
  Calendar,
  PlusCircle,
  TrendingUp
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatsCard from '../../components/common/StatsCard';
import Button from '../../components/common/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data
const attendanceData = [
  { name: 'Jan', value: 85 },
  { name: 'Feb', value: 88 },
  { name: 'Mar', value: 92 },
  { name: 'Apr', value: 90 },
  { name: 'May', value: 85 },
  { name: 'Jun', value: 89 }
];

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-3">
          <Link to="/admin/admissions">
            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle size={16} />}
            >
              New Admission
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Students"
          value="1,253"
          change={{ value: '3.2%', trend: 'up' }}
          icon={<Users size={24} />}
          color="blue"
        />
        <StatsCard
          title="Teachers"
          value="42"
          change={{ value: '1', trend: 'up' }}
          icon={<UserCheck size={24} />}
          color="purple"
        />
        <StatsCard
          title="Active Classes"
          value="24"
          change={{ value: '2', trend: 'up' }}
          icon={<BookOpen size={24} />}
          color="teal"
        />
        <StatsCard
          title="Fee Collection"
          value="₹3.2L"
          change={{ value: '12%', trend: 'up' }}
          icon={<DollarSign size={24} />}
          color="green"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Attendance Chart */}
        <Card title="Attendance Overview">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={attendanceData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563EB"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Activities */}
        <Card title="Recent Activities">
          <div className="flow-root">
            <ul className="-mb-8">
              {[1, 2, 3, 4, 5].map((activity, activityIdx) => (
                <li key={activity}>
                  <div className="relative pb-8">
                    {activityIdx !== 4 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-blue-500">
                          {activityIdx % 2 === 0 ? (
                            <Users className="h-5 w-5 text-white" />
                          ) : (
                            <Award className="h-5 w-5 text-white" />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-800">
                            {activityIdx % 2 === 0
                              ? 'New student admission completed'
                              : 'Exam results published for Class 10'}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime="2020-09-20">
                            {activityIdx * 2 + 1} hours ago
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-2">
            <button
              type="button"
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all activities
              <TrendingUp className="ml-1 h-4 w-4" />
            </button>
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
              <p className="text-sm text-gray-500">Annual Sports Day on 15th June</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Exam Schedule</h3>
              <p className="text-sm text-gray-500">Final exams start on 20th June</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Scholarship Program</h3>
              <p className="text-sm text-gray-500">8 new scholarships available</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;