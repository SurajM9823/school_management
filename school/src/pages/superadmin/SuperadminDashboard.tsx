import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Building2, CreditCard, PlusCircle, Activity } from 'lucide-react';
import Card from '../../components/common/Card';
import StatsCard from '../../components/common/StatsCard';
import Button from '../../components/common/Button';
import api from '../../api';

interface School {
  school_id: string;
  name: string;
  is_active: boolean;
  subscription_status: string;
  subscription?: {
    id: string;
    start_date: string;
    end_date: string;
    status: string;
    fulfillment_status: string;
  };
}

interface Stats {
  total_schools: { current: number; previous: number };
  active_subscriptions: { current: number; previous: number };
  pending_actions: { current: number; previous: number };
}

const calculateChange = (current: number, previous: number): { value: string; trend: 'up' | 'down' | 'neutral' } => {
  if (current === previous) {
    return { value: '0%', trend: 'neutral' };
  }
  if (previous === 0) {
    return { value: current > 0 ? '100%' : '0%', trend: current > 0 ? 'up' : 'neutral' };
  }
  const change = ((current - previous) / previous) * 100;
  return {
    value: `${Math.abs(change).toFixed(1)}%`,
    trend: change > 0 ? 'up' : 'down'
  };
};

const SuperadminDashboard: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_schools: { current: 0, previous: 0 },
    active_subscriptions: { current: 0, previous: 0 },
    pending_actions: { current: 0, previous: 0 }
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/superadmin/schools/');
        setSchools(response.data.schools);
        setStats(response.data.stats);
      } catch (error) {
        console.error('Error fetching schools:', error);
        setError('Failed to load dashboard data');
      }
    };
    fetchData();
  }, []);

  const totalSchoolsChange = calculateChange(stats.total_schools.current, stats.total_schools.previous);
  const activeSubscriptionsChange = calculateChange(stats.active_subscriptions.current, stats.active_subscriptions.previous);
  const pendingActionsChange = calculateChange(stats.pending_actions.current, stats.pending_actions.previous);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Superadmin Dashboard</h1>
        <div className="flex space-x-3">
          <Link to="/superadmin/add-school">
            <Button variant="primary" size="sm" icon={<PlusCircle size={16} />}>
              Add School
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title="Total Schools"
          value={stats.total_schools.current}
          change={totalSchoolsChange}
          icon={<Building2 size={24} />}
          color="blue"
        />
        <StatsCard
          title="Active Subscriptions"
          value={stats.active_subscriptions.current}
          change={activeSubscriptionsChange}
          icon={<CreditCard size={24} />}
          color="green"
        />
        <StatsCard
          title="Pending Actions"
          value={stats.pending_actions.current}
          change={pendingActionsChange}
          icon={<Activity size={24} />}
          color="yellow"
        />
      </div>

      <Card title="School Management">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schools.map((school) => (
                <tr key={school.school_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{school.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={school.is_active ? 'text/green-600' : 'text-red-600'}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{school.subscription_status}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/superadmin/subscriptions/${school.school_id}`}>
                      <Button variant="outline" size="sm">Manage</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Outlet />
    </div>
  );
};

export default SuperadminDashboard;