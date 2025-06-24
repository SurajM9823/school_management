import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import Card from '../../components/common/Card';
import api from '../../api';

interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

const ActivityTracker: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.get('/superadmin/activities/');
        setActivities(response.data);
      } catch (err) {
        console.error('Error fetching activities:', err);
      }
    };
    fetchActivities();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Activity Tracker</h1>
      <Card title="Recent Activities">
        <div className="flow-root">
          <ul className="-mb-8">
            {activities.map((activity, idx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {idx !== activities.length - 1 ? (
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white bg-blue-500">
                        <Activity className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-800">{activity.action}</p>
                        <p className="text-sm text-gray-500">by {activity.user}</p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={activity.timestamp}>{new Date(activity.timestamp).toLocaleString()}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default ActivityTracker;
