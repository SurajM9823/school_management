import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
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

interface DashboardStats {
  total_students: { count: number; growth: number; trend: 'up' | 'down' };
  total_teachers: { count: number; growth: number; trend: 'up' | 'down' };
  active_classes: { count: number; growth: number; trend: 'up' | 'down' };
  recent_activities: Array<{
    type: string;
    message: string;
    time: string;
    timestamp: string;
  }>;
  exam_schedule: {
    name: string;
    start_date: string;
  } | null;
  scholarship_count: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesFilter, setActivitiesFilter] = useState('week');
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/dashboard/stats/');
        setStats(response.data);
      } catch (err: any) {
        setError('Failed to load dashboard statistics');
        console.error('Dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const fetchActivities = async (filter = 'week') => {
    try {
      setActivitiesLoading(true);
      const response = await api.get('/admin/dashboard/activities/', {
        params: { filter }
      });
      setActivities(response.data.activities);
    } catch (err: any) {
      console.error('Activities fetch error:', err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleViewAllActivities = () => {
    console.log('View all activities clicked');
    setShowActivitiesModal(true);
    fetchActivities(activitiesFilter);
  };

  const handleFilterChange = (filter: string) => {
    setActivitiesFilter(filter);
    fetchActivities(filter);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2x1 font-semibold text-gray-900">Admin Dashboard</h1>
        <div className="flex space-x-3">
          <Link to="/admin/admissions">
            <Button
              variant="primary"
              size="sm"
              className='bg-primary hover:bg-darkPrimary text-white'
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
          value={stats?.total_students.count.toString() || '0'}
          icon={<Users size={24} />}
          color="blue"
        />
        <StatsCard
          title="Teachers"
          value={stats?.total_teachers.count.toString() || '0'}
          icon={<UserCheck size={24} />}
          color="purple"
        />
        <StatsCard
          title="Active Classes"
          value={stats?.active_classes.count.toString() || '0'}
          icon={<BookOpen size={24} />}
          color="teal"
        />
        <StatsCard
          title="Fee Collection"
          value="NPR 3.2L"
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
              {(stats?.recent_activities || []).map((activity, activityIdx) => (
                <li key={activityIdx}>
                  <div className="relative pb-8">
                    {activityIdx !== (stats?.recent_activities?.length || 1) - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-blue-500">
                          {activity.type === 'admission' ? (
                            <Users className="h-5 w-5 text-white" />
                          ) : (
                            <Award className="h-5 w-5 text-white" />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-800">
                            {activity.message}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time>
                            {activity.time}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {(!stats?.recent_activities || stats.recent_activities.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">No recent activities</p>
            )}
          </div>
          <div className="mt-2">
            <div
              onClick={handleViewAllActivities}
              className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 cursor-pointer select-none"
              role="button"
              tabIndex={0}
            >
              <TrendingUp className="ml-1 h-4 w-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Exam Schedule</h3>
              <p className="text-sm text-gray-500">
                {stats?.exam_schedule 
                  ? `${stats.exam_schedule.name} starts on ${stats.exam_schedule.start_date}`
                  : 'No upcoming exams scheduled'
                }
              </p>
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
              <p className="text-sm text-gray-500">
                {stats?.scholarship_count || 0} scholarships available
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Activities Modal */}
      {showActivitiesModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">All Activities</h3>
                <button
                  onClick={() => setShowActivitiesModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="mt-4 flex space-x-4">
                {['week', 'month', 'overall'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleFilterChange(filter)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      activitiesFilter === filter
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'Overall'}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {activitiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : activities.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {activities.map((activity, idx) => (
                      <li key={idx}>
                        <div className="relative pb-8">
                          {idx !== activities.length - 1 && (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-blue-500">
                                {activity.type === 'admission' ? (
                                  <Users className="h-5 w-5 text-white" />
                                ) : activity.type === 'staff' ? (
                                  <UserCheck className="h-5 w-5 text-white" />
                                ) : (
                                  <Award className="h-5 w-5 text-white" />
                                )}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-800">{activity.message}</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                <time>{activity.time}</time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No activities found for the selected period</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;