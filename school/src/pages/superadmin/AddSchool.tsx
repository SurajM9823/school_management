import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, User, Lock, Globe, Calendar, Phone } from 'lucide-react';
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

const AddSchool: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    academic_year: '',
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    admin_email: '',
    admin_name: '',
    admin_password: '',
  });
  const [error, setError] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Fetch schools for the table
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await api.get('/superadmin/schools/');
        setSchools(response.data.schools); // Extract the schools array
      } catch (err) {
        console.error('Error fetching schools:', err);
        setError('Failed to load existing schools');
      }
    };
    fetchSchools();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'website') {
      const cleanedValue = value.replace(/^https?:\/\//, '');
      setFormData({ ...formData, [name]: cleanedValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        school: {
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website ? `https://${formData.website}` : undefined,
          academic_year: formData.academic_year,
          start_date: formData.start_date,
          end_date: formData.end_date,
        },
        admin: {
          email: formData.admin_email,
          name: formData.admin_name,
          role: 'admin',
          password: formData.admin_password,
        },
      };
      await api.post('/superadmin/schools/create/', payload);
      navigate('/superadmin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create school and admin');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(schools.length / pageSize);
  const paginatedSchools = schools.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Add New School</h1>
        <Link to="/superadmin/dashboard">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* School Details Section */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-medium text-gray-900 mb-4">School Details</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">School Name</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm focus:outline-none"
                placeholder="Enter school name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm focus:outline-none"
                placeholder="Enter school address"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm focus:outline-none"
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm focus:outline-none"
                placeholder="Enter school email"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Website</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-gray-400" />
              </div>
              <div className="absolute inset-y-0 left-10 pl-3 flex items-center text-gray-500 text-sm pointer-events-none">
                https://
              </div>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="block w-full pl-24 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm focus:outline-none"
                placeholder="example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm focus:outline-none"
                placeholder="e.g., 2025-2026"
              />
            </div>
          </div>

          {/* Subscription Details Section */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Subscription Details</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subscription Start Date</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Subscription End Date</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Admin Details Section */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Admin Details</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Admin Email</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="admin_email"
                value={formData.admin_email}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm focus:outline-none"
                placeholder="Enter admin email"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Admin Name</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="admin_name"
                value={formData.admin_name}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm focus:outline-none"
                placeholder="Enter admin name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Admin Password</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                name="admin_password"
                value={formData.admin_password}
                onChange={handleChange}
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm focus:outline-none"
                placeholder="Enter admin password"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => setError('')}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <Button type="submit" variant="primary" className="w-full">
              Create School and Admin
            </Button>
          </div>
        </form>
      </div>

      {/* Schools Table */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Existing Schools</h2>
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
              {paginatedSchools.length > 0 ? (
                paginatedSchools.map((school) => (
                  <tr key={school.school_id}>
                    <td className="px-6 py-4 whitespace-nowrap">{school.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={school.is_active ? 'text-green-600' : 'text-red-600'}>
                        {school.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{school.subscription_status}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/superadmin/subscriptions/${school.school_id}`)}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No schools found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {schools.length > 0 && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, schools.length)} of {schools.length} schools
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddSchool;