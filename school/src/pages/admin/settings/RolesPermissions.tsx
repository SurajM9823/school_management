import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../api';

interface Role {
  id: number;
  name: string;
  permissions: string[];
}

interface RoleFormInputs {
  name: string;
  permissions: string[];
}

const availablePermissions = [
  'view_dashboard',
  'manage_users',
  'manage_roles',
  'manage_settings',
  'view_reports',
  'manage_academics',
  'manage_fees',
];

const RolesPermissions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<RoleFormInputs>();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchRoles();
  }, [user, navigate]);

  const fetchRoles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/school/settings/roles/');
      setRoles(response.data || []);
    } catch (err) {
      setError('Failed to load roles.');
      toast.error('Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitRole = async (data: RoleFormInputs) => {
    setIsLoading(true);
    setError(null);
    try {
      if (editingRoleId) {
        const response = await api.put(`/school/settings/roles/${editingRoleId}/`, data);
        setRoles(roles.map(r => r.id === editingRoleId ? response.data : r));
        toast.success('Role updated successfully');
      } else {
        const response = await api.post('/school/settings/roles/', data);
        setRoles([...roles, response.data]);
        toast.success('Role added successfully');
      }
      setShowRoleModal(false);
      setEditingRoleId(null);
      reset({ name: '', permissions: [] });
    } catch (err) {
      setError(`Failed to ${editingRoleId ? 'update' : 'add'} role.`);
      toast.error(`Failed to ${editingRoleId ? 'update' : 'add'} role`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRoleId(role.id);
    setValue('name', role.name);
    setValue('permissions', role.permissions);
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.delete(`/school/settings/roles/${id}/`);
      setRoles(roles.filter(r => r.id !== id));
      toast.success('Role deleted successfully');
    } catch (err) {
      setError('Failed to delete role.');
      toast.error('Failed to delete role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-semibold text-gray-900">Roles & Permissions</h1>

      {error && (
        <div className="text-center py-4 text-red-600">
          {error}
          <Button
            variant="outline"
            className="ml-4"
            onClick={fetchRoles}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      )}

      <Card title="Roles & Permissions">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingRoleId(null);
              reset({ name: '', permissions: [] });
              setShowRoleModal(true);
            }}
            disabled={isLoading}
          >
            Add Role
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{role.permissions.join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={16} />}
                        onClick={() => handleEditRole(role)}
                        className="mr-2"
                        disabled={isLoading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={isLoading}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && !error && roles.length === 0 && (
          <div className="text-center py-4">No roles configured.</div>
        )}
      </Card>

      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingRoleId ? 'Edit Role' : 'Add New Role'}
            </h3>
            <form onSubmit={handleSubmit(onSubmitRole)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role Name</label>
                <input
                  type="text"
                  {...register('name', { required: 'Role name is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Permissions</label>
                <div className="mt-2 space-y-2">
                  {availablePermissions.map((perm) => (
                    <div key={perm} className="flex items-center">
                      <input
                        type="checkbox"
                        {...register('permissions')}
                        value={perm}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">{perm}</label>
                    </div>
                  ))}
                </div>
                {errors.permissions && (
                  <p className="mt-1 text-sm text-red-600">{errors.permissions.message}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRoleId(null);
                    reset({ name: '', permissions: [] });
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon={<Save size={16} />}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingRoleId ? 'Update Role' : 'Add Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;