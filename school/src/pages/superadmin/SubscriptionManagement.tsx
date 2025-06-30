import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Calendar, Check, X, Mail, Lock } from 'lucide-react';
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

interface Admin {
  email: string;
  plaintext_password: string;
}

const SubscriptionManagement: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    status: 'active',
    fulfillment_status: 'pending',
  });
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
  });
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/superadmin/subscriptions/${schoolId}/`);
        setSubscription(response.data.subscription);
        setAdmin(response.data.admin);
        setFormData({
          start_date: response.data.subscription.start_date,
          end_date: response.data.subscription.end_date,
          status: response.data.subscription.status,
          fulfillment_status: response.data.subscription.fulfillment_status,
        });
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError('Failed to load subscription');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubscription();
  }, [schoolId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.patch(`/superadmin/subscriptions/${schoolId}/`, formData);
      setSubscription(response.data);
      setShowForm(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPasswordError('');
    try {
      await api.post(`/superadmin/subscriptions/${schoolId}/`, passwordForm);
      setShowPasswordForm(false);
      setPasswordForm({ new_password: '' });
      // Refresh admin data
      const response = await api.get(`/superadmin/subscriptions/${schoolId}/`);
      setAdmin(response.data.admin);
    } catch (err: any) {
      const errorMsg = err.response?.data?.new_password?.[0] || err.response?.data?.error || 'Failed to change password';
      setPasswordError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubscriptionStatus = async () => {
    if (!subscription) return;
    
    setIsLoading(true);
    const newStatus = subscription.status === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await api.patch(`/superadmin/subscriptions/${schoolId}/`, {
        status: newStatus
      });
      setSubscription({
        ...subscription,
        status: newStatus
      });
      setFormData({
        ...formData,
        status: newStatus
      });
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${newStatus === 'active' ? 'activate' : 'deactivate'} subscription`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Subscription</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/superadmin/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
      
      <div className="mt-6 bg-white p-6 rounded-lg shadow-lg">
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : subscription ? (
          <>
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Subscription Details</h2>
                <p className="text-sm text-gray-500">Manage the subscription for this school</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="mr-2 text-sm font-medium text-gray-700">Status:</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {subscription.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <Button
                  variant={subscription.status === 'active' ? 'danger' : 'success'}
                  size="sm"
                  onClick={toggleSubscriptionStatus}
                  disabled={isLoading}
                  icon={subscription.status === 'active' ? <X size={16} /> : <Check size={16} />}
                >
                  {subscription.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <p className="mt-1 text-sm text-gray-900">{new Date(subscription.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">End Date</p>
                  <p className="mt-1 text-sm text-gray-900">{new Date(subscription.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fulfillment Status</p>
                  <p className="mt-1 text-sm text-gray-900">{subscription.fulfillment_status}</p>
                </div>
                {admin && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Admin Email</p>
                      <p className="mt-1 text-sm text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 mr-2" /> {admin.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Admin Password</p>
                      <p className="mt-1 text-sm text-gray-900 flex items-center">
                        <Lock className="h-4 w-4 mr-2" /> {admin.plaintext_password}
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-6 space-y-4">
                {!showForm ? (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowForm(true)}
                  >
                    Edit Subscription Details
                  </Button>
                ) : (
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
                      <Button type="submit" variant="primary" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Update Subscription'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowForm(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
                
                {!showPasswordForm ? (
                  <Button 
                    variant="primary" 
                    onClick={() => setShowPasswordForm(true)}
                    disabled={!admin}
                  >
                    Change Admin Password
                  </Button>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">New Password</label>
                      <input
                        type="password"
                        name="new_password"
                        value={passwordForm.new_password}
                        onChange={handlePasswordChange}
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Enter new password (min 8 chars, 1 digit, 1 uppercase)"
                      />
                    </div>
                    {passwordError && (
                      <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{passwordError}</h3>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex space-x-3">
                      <Button type="submit" variant="primary" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Change Password'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowPasswordForm(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            {error || 'No subscription found for this school.'}
            <div className="mt-4">
              <Button 
                variant="primary" 
                onClick={() => setShowForm(true)}
              >
                Create Subscription
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManagement;