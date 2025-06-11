import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Building, Plus, Edit, Trash2 } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../api';

interface Campus {
  id: number;
  name: string;
  address: string;
  contact_person: string;
  is_active: boolean;
}

interface Building {
  id: number;
  campus_id: number;
  name: string;
  is_active: boolean;
}

interface Room {
  id: number;
  building_id: number;
  name: string;
  capacity: number;
  room_type: string;
  is_active: boolean;
}

interface Resource {
  id: number;
  name: string;
  total_count: number;
  available_count: number;
  is_active: boolean;
}

interface CampusFormData {
  campus_name: string;
  campus_address: string;
  contact_person: string;
  building_name: string;
  room_name: string;
  room_capacity: number;
  room_type: string;
  resource_name: string;
  total_count: number;
}

const CampusSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CampusFormData>();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchCampusData();
  }, [user, navigate]);

  const fetchCampusData = async () => {
    setIsLoading(true);
    try {
      const [campusResponse, resourceResponse] = await Promise.all([
        api.get('/school/settings/campuses/'),
        api.get('/school/settings/resources/'),
      ]);
      setCampuses(campusResponse.data);
      setResources(resourceResponse.data);
    } catch (error) {
      toast.error('Failed to load campus data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBuildings = async (campusId: number) => {
    try {
      const response = await api.get(`/school/settings/campuses/${campusId}/buildings/`);
      setBuildings(response.data);
    } catch (error) {
      toast.error('Failed to load buildings');
    }
  };

  const fetchRooms = async (buildingId: number) => {
    try {
      const response = await api.get(`/school/settings/buildings/${buildingId}/rooms/`);
      setRooms(response.data);
    } catch (error) {
      toast.error('Failed to load rooms');
    }
  };

  const handleCampusSelect = (campusId: number) => {
    setSelectedCampusId(campusId);
    setSelectedBuildingId(null);
    setBuildings([]);
    setRooms([]);
    fetchBuildings(campusId);
  };

  const handleBuildingSelect = (buildingId: number) => {
    setSelectedBuildingId(buildingId);
    setRooms([]);
    fetchRooms(buildingId);
  };

  const onSubmitCampus = async (data: CampusFormData) => {
    setIsLoading(true);
    try {
      const response = await api.post('/school/settings/campuses/', {
        name: data.campus_name,
        address: data.campus_address,
        contact_person: data.contact_person,
      });
      setCampuses([...campuses, response.data]);
      setShowCampusModal(false);
      reset();
      toast.success('Campus added successfully');
    } catch (error) {
      toast.error('Failed to add campus');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitBuilding = async (data: CampusFormData) => {
    if (!selectedCampusId) return;
    setIsLoading(true);
    try {
      const response = await api.post(`/school/settings/campuses/${selectedCampusId}/buildings/`, {
        name: data.building_name,
        campus: selectedCampusId,
      });
      setBuildings([...buildings, response.data]);
      setShowBuildingModal(false);
      reset();
      toast.success('Building added successfully');
    } catch (error) {
      toast.error('Failed to add building');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitRoom = async (data: CampusFormData) => {
    if (!selectedBuildingId) return;
    setIsLoading(true);
    try {
      const response = await api.post(`/school/settings/buildings/${selectedBuildingId}/rooms/`, {
        name: data.room_name,
        capacity: data.room_capacity,
        room_type: data.room_type,
        building: selectedBuildingId,
      });
      setRooms([...rooms, response.data]);
      setShowRoomModal(false);
      reset();
      toast.success('Room added successfully');
    } catch (error) {
      toast.error('Failed to add room');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitResource = async (data: CampusFormData) => {
    setIsLoading(true);
    try {
      const response = await api.post('/school/settings/resources/', {
        name: data.resource_name,
        total_count: data.total_count,
        available_count: data.total_count,
      });
      setResources([...resources, response.data]);
      setShowResourceModal(false);
      reset();
      toast.success('Resource added successfully');
    } catch (error) {
      toast.error('Failed to add resource');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (type: string, id: number, parentId?: number) => {
    setIsLoading(true);
    try {
      if (type === 'campuses') {
        await api.delete(`/school/settings/campuses/${id}/`);
        setCampuses(campuses.filter((c) => c.id !== id));
      } else if (type === 'buildings') {
        await api.delete(`/school/settings/campuses/${parentId}/buildings/${id}/`);
        setBuildings(buildings.filter((b) => b.id !== id));
      } else if (type === 'rooms') {
        await api.delete(`/school/settings/buildings/${parentId}/rooms/${id}/`);
        setRooms(rooms.filter((r) => r.id !== id));
      } else if (type === 'resources') {
        await api.delete(`/school/settings/resources/${id}/`);
        setResources(resources.filter((r) => r.id !== id));
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
    } catch (error) {
      toast.error(`Failed to delete ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-semibold text-gray-900">Campus Settings</h1>

      <Card title="Campuses">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setShowCampusModal(true)}
          >
            Add Campus
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campuses.map((campus) => (
              <div
                key={campus.id}
                className={`p-4 border rounded-md cursor-pointer ${selectedCampusId === campus.id ? 'border-blue-500 bg-blue-100' : 'border-gray-200'}`}
                onClick={() => handleCampusSelect(campus.id)}
              >
                <h3 className="text-lg font-medium text-gray-900">{campus.name}</h3>
                <p className="text-sm text-gray-600">{campus.address}</p>
                <p className="text-sm text-gray-600">{campus.contact_person}</p>
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => handleDelete('campuses', campus.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedCampusId && (
        <Card title="Buildings">
          <div className="flex justify-end mb-4">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowBuildingModal(true)}
            >
              Add Building
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {buildings.map((building) => (
              <div
                key={building.id}
                className={`p-4 border rounded-md cursor-pointer ${selectedBuildingId === building.id ? 'border-blue-500 bg-blue-100' : 'border-gray-200'}`}
                onClick={() => handleBuildingSelect(building.id)}
              >
                <h3 className="text-lg font-medium text-gray-900">{building.name}</h3>
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => handleDelete('buildings', building.id, selectedCampusId)}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedBuildingId && (
        <Card title="Rooms">
          <div className="flex justify-end mb-4">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowRoomModal(true)}
            >
              Add Room
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.capacity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.room_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="outline" size="sm" icon={<Edit size={16} />} className="mr-2" />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDelete('rooms', room.id, selectedBuildingId)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card title="Resources">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setShowResourceModal(true)}
          >
            Add Resource
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Count</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resources.map((resource) => (
                <tr key={resource.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{resource.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resource.total_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resource.available_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="outline" size="sm" icon={<Edit size={16} />} className="mr-2" />
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      onClick={() => handleDelete('resources', resource.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showCampusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Campus</h3>
            <form onSubmit={handleSubmit(onSubmitCampus)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Campus Name</label>
                <input
                  type="text"
                  {...register('campus_name', { required: 'Campus name is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.campus_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.campus_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  {...register('campus_address', { required: 'Address is required' })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.campus_address && (
                  <p className="mt-1 text-sm text-red-600">{errors.campus_address.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <input
                  type="text"
                  {...register('contact_person', { required: 'Contact person is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.contact_person && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact_person.message}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowCampusModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Add Campus'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBuildingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Building</h3>
            <form onSubmit={handleSubmit(onSubmitBuilding)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Building Name</label>
                <input
                  type="text"
                  {...register('building_name', { required: 'Building name is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.building_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.building_name.message}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowBuildingModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Add Building'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Room</h3>
            <form onSubmit={handleSubmit(onSubmitRoom)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Name</label>
                <input
                  type="text"
                  {...register('room_name', { required: 'Room name is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.room_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.room_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <input
                  type="number"
                  {...register('room_capacity', { required: 'Capacity is required', min: 0 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.room_capacity && (
                  <p className="mt-1 text-sm text-red-600">{errors.room_capacity.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Type</label>
                <select
                  {...register('room_type', { required: 'Room type is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select Type</option>
                  <option value="classroom">Classroom</option>
                  <option value="lab">Lab</option>
                  <option value="other">Other</option>
                </select>
                {errors.room_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.room_type.message}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowRoomModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Add Room'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Resource</h3>
            <form onSubmit={handleSubmit(onSubmitResource)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Resource Name</label>
                <input
                  type="text"
                  {...register('resource_name', { required: 'Resource name is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.resource_name && (
                  <p className="mt-1 text-sm text-red-600">{errors.resource_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Count</label>
                <input
                  type="number"
                  {...register('total_count', { required: 'Total count is required', min: 1 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {errors.total_count && (
                  <p className="mt-1 text-sm text-red-600">{errors.total_count.message}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowResourceModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Add Resource'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusSettings;