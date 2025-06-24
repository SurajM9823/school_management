import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Calendar } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../api';

interface Subscription {
  id: string;
  school_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'pending';
  fulfillment_status: 'fulfilled' | 'pending' | 'expired';
}

const SubscriptionManagement: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState({ start_date: '', end_date: '', status: 'active', fulfillment_status: 'pending' });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await api.get(`/superadmin/subscriptions/${schoolId}/`);
        setSubscription(response.data);
        setFormData({
          start_date: response.data.start_date,
          end_date: response.data.end_date,
          status: response.data.status,
          fulfillment_status: response.data.fulfillment_status,
        });
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError('Failed to load subscription');
      }
    };
    fetchSubscription();
  }, [schoolId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/superadmin/subscriptions/${schoolId}/`, formData);
      navigate('/superadmin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update subscription');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Manage Subscription</h1>
      <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
        {subscription ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fulfillment Status</label>
              <select
                name="fulfillment_status"
                value={formData.fulfillment_status}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="fulfilled">Fulfilled</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
              </select>
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
            <div className="flex space-x-3">
              <Button type="submit" variant="primary">Update Subscription</Button>
            </div>
          </form>
        ) : (
          <div>Loading subscription...</div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;