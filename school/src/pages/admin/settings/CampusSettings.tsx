import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Building, Plus, Edit, Trash2, Save } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../api';
import { AxiosError } from 'axios';

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
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CampusFormData>({
    defaultValues: {
      campus_name: '',
      campus_address: '',
      contact_person: '',
      building_name: '',
      room_name: '',
      room_capacity: 0,
      room_type: 'classroom',
      resource_name: '',
      total_count: 0,
    }
  });
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingCampusId, setEditingCampusId] = useState<number | null>(null);
  const [editingBuildingId, setEditingBuildingId] = useState<number | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      toast.error('Unauthorized access. Please log in as admin.');
      return;
    }
    fetchCampusData();
  }, [user, navigate]);

  const fetchCampusData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [campusResponse, resourceResponse] = await Promise.all([
        api.get('/school/settings/campuses/'),
        api.get('/school/settings/resources/'),
      ]);
      setCampuses(campusResponse.data);
      setResources(resourceResponse.data);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = 'Failed to load campus data. Please try again.';
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'No school associated with your account.';
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Fetch campus data error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBuildings = async (campusId: number) => {
    try {
      const response = await api.get(`/school/settings/campuses/${campusId}/buildings/`);
      setBuildings(response.data);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string }>;
      const errorMessage = error.response?.data?.error || 'Failed to load buildings';
      toast.error(errorMessage);
      console.error('Fetch buildings error:', error.response?.data);
    }
  };

  const fetchRooms = async (buildingId: number) => {
    try {
      const response = await api.get(`/school/settings/buildings/${buildingId}/rooms/`);
      setRooms(response.data);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string }>;
      const errorMessage = error.response?.data?.error || 'Failed to load rooms';
      toast.error(errorMessage);
      console.error('Fetch rooms error:', error.response?.data);
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
    setError(null);
    try {
      const payload = {
        name: data.campus_name,
        address: data.campus_address,
        contact_person: data.contact_person,
      };
      let response: any;
      if (editingCampusId) {
        response = await api.put(`/school/settings/campuses/${editingCampusId}/`, payload);
        setCampuses(campuses.map(c => c.id === editingCampusId ? response.data : c));
        toast.success('Campus updated successfully');
      } else {
        response = await api.post('/school/settings/campuses/', payload);
        setCampuses([...campuses, response.data]);
        toast.success('Campus added successfully');
      }
      setShowCampusModal(false);
      setEditingCampusId(null);
      reset({ campus_name: '', campus_address: '', contact_person: '' });
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = `Failed to ${editingCampusId ? 'update' : 'add'} campus.`;
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Campus not found.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Campus error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitBuilding = async (data: CampusFormData) => {
    if (!selectedCampusId) {
      toast.error('Please select a campus first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = { name: data.building_name };
      let response: any;
      if (editingBuildingId) {
        response = await api.put(`/school/settings/campuses/${selectedCampusId}/buildings/${editingBuildingId}/`, payload);
        setBuildings(buildings.map(b => b.id === editingBuildingId ? response.data : b));
        toast.success('Building updated successfully');
      } else {
        response = await api.post(`/school/settings/campuses/${selectedCampusId}/buildings/`, payload);
        setBuildings([...buildings, response.data]);
        toast.success('Building added successfully');
      }
      setShowBuildingModal(false);
      setEditingBuildingId(null);
      reset({ building_name: '' });
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = `Failed to ${editingBuildingId ? 'update' : 'add'} building.`;
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Campus or building not found.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Building error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitRoom = async (data: CampusFormData) => {
    if (!selectedBuildingId) {
      toast.error('Please select a building first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        name: data.room_name,
        capacity: data.room_capacity,
        room_type: data.room_type,
      };
      let response: any;
      if (editingRoomId) {
        response = await api.put(`/school/settings/buildings/${selectedBuildingId}/rooms/${editingRoomId}/`, payload);
        setRooms(rooms.map(r => r.id === editingRoomId ? response.data : r));
        toast.success('Room updated successfully');
      } else {
        response = await api.post(`/school/settings/buildings/${selectedBuildingId}/rooms/`, payload);
        setRooms([...rooms, response.data]);
        toast.success('Room added successfully');
      }
      setShowRoomModal(false);
      setEditingRoomId(null);
      reset({ room_name: '', room_capacity: 0, room_type: 'classroom' });
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = `Failed to ${editingRoomId ? 'update' : 'add'} room.`;
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Building or room not found.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Room error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitResource = async (data: CampusFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        name: data.resource_name,
        total_count: data.total_count,
        available_count: data.total_count,
      };
      let response: any;
      if (editingResourceId) {
        response = await api.put(`/school/settings/resources/${editingResourceId}/`, payload);
        setResources(resources.map(r => r.id === editingResourceId ? response.data : r));
        toast.success('Resource updated successfully');
      } else {
        response = await api.post('/school/settings/resources/', payload);
        setResources([...resources, response.data]);
        toast.success('Resource added successfully');
      }
      setShowResourceModal(false);
      setEditingResourceId(null);
      reset({ resource_name: '', total_count: 0 });
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: string | string[] }>;
      let errorMessage = `Failed to ${editingResourceId ? 'update' : 'add'} resource.`;
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Resource not found.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Resource error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCampus = (campus: Campus) => {
    setEditingCampusId(campus.id);
    setValue('campus_name', campus.name);
    setValue('campus_address', campus.address);
    setValue('contact_person', campus.contact_person);
    setShowCampusModal(true);
  };

  const handleEditBuilding = (building: Building) => {
    setEditingBuildingId(building.id);
    setValue('building_name', building.name);
    setShowBuildingModal(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setValue('room_name', room.name);
    setValue('room_capacity', room.capacity);
    setValue('room_type', room.room_type);
    setShowRoomModal(true);
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResourceId(resource.id);
    setValue('resource_name', resource.name);
    setValue('total_count', resource.total_count);
    setShowResourceModal(true);
  };

  const handleDelete = async (type: string, id: number, parentId?: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)}?`)) return;
    setIsLoading(true);
    setError(null);
    try {
      if (type === 'campuses') {
        await api.delete(`/school/settings/campuses/${id}/`);
        setCampuses(campuses.filter(c => c.id !== id));
        if (selectedCampusId === id) {
          setSelectedCampusId(null);
          setBuildings([]);
          setRooms([]);
        }
      } else if (type === 'buildings' && parentId) {
        await api.delete(`/school/settings/campuses/${parentId}/buildings/${id}/`);
        setBuildings(buildings.filter(b => b.id !== id));
        if (selectedBuildingId === id) {
          setSelectedBuildingId(null);
          setRooms([]);
        }
      } else if (type === 'rooms' && parentId) {
        await api.delete(`/school/settings/buildings/${parentId}/rooms/${id}/`);
        setRooms(rooms.filter(r => r.id !== id));
      } else if (type === 'resources') {
        await api.delete(`/school/settings/resources/${id}/`);
        setResources(resources.filter(r => r.id !== id));
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1).slice(0, -1)} deleted successfully`);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error?: string; [key: string]: any }>;
      let errorMessage = `Failed to delete ${type.slice(0, -1)}.`;
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || Object.entries(error.response?.data || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(', ');
      } else if (error.response?.status === 401) {
        navigate('/login');
        errorMessage = 'Session expired.';
      } else if (error.response?.status === 404) {
        errorMessage = `${type.slice(0, -1)} not found.`;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(`Delete ${type} error:`, error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-semibold text-gray-900">Campus Settings</h1>

      {error && (
        <div className="text-center py-4 text-red-600">
          {error}
          <Button
            variant="outline"
            className="ml-4"
            onClick={fetchCampusData}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      )}

      <Card title="Campuses">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingCampusId(null);
              reset({ campus_name: '', campus_address: '', contact_person: '' });
              setShowCampusModal(true);
            }}
            disabled={isLoading}
          >
            Add Campus
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {campuses.length === 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                No campuses available. Please add a campus to proceed.
              </div>
            )}
            {campuses.map((campus) => (
              <div
                key={campus.id}
                className={`p-4 border rounded-md ${selectedCampusId === campus.id ? 'border-blue-500 bg-blue-100' : 'border-gray-200'}`}
              >
                <h3 className="text-lg font-medium text-gray-900">{campus.name}</h3>
                <p className="text-sm text-gray-600">{campus.address}</p>
                <p className="text-sm text-gray-600">{campus.contact_person}</p>
                <div className="mt-2 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Edit size={16} />}
                    onClick={() => handleEditCampus(campus)}
                    disabled={isLoading}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Trash2 size={16} />}
                    onClick={() => handleDelete('campuses', campus.id)}
                    disabled={isLoading}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleCampusSelect(campus.id)}
                    disabled={isLoading}
                  >
                    View Buildings
                  </Button>
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
              onClick={() => {
                setEditingBuildingId(null);
                reset({ building_name: '' });
                setShowBuildingModal(true);
              }}
              disabled={isLoading}
            >
              Add Building
            </Button>
          </div>
          {isLoading && <div className="text-center py-4">Loading...</div>}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {buildings.length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500">
                  No buildings available. Please add a building to proceed.
                </div>
              )}
              {buildings.map((building) => (
                <div
                  key={building.id}
                  className={`p-4 border rounded-md ${selectedBuildingId === building.id ? 'border-blue-500 bg-blue-100' : 'border-gray-200'}`}
                >
                  <h3 className="text-lg font-medium text-gray-900">{building.name}</h3>
                  <div className="mt-2 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit size={16} />}
                      onClick={() => handleEditBuilding(building)}
                      disabled={isLoading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      onClick={() => handleDelete('buildings', building.id, selectedCampusId)}
                      disabled={isLoading}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleBuildingSelect(building.id)}
                      disabled={isLoading}
                    >
                      View Rooms
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {selectedBuildingId && (
        <Card title="Rooms">
          <div className="flex justify-end mb-4">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => {
                setEditingRoomId(null);
                reset({ room_name: '', room_capacity: 0, room_type: 'classroom' });
                setShowRoomModal(true);
              }}
              disabled={isLoading}
            >
              Add Room
            </Button>
          </div>
          {isLoading && <div className="text-center py-4">Loading...</div>}
          {!isLoading && !error && (
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
                  {rooms.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No rooms available.
                      </td>
                    </tr>
                  )}
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.capacity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.room_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit size={16} />}
                          className="mr-2"
                          onClick={() => handleEditRoom(room)}
                          disabled={isLoading}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => handleDelete('rooms', room.id, selectedBuildingId)}
                          disabled={isLoading}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Card title="Resources">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingResourceId(null);
              reset({ resource_name: '', total_count: 0 });
              setShowResourceModal(true);
            }}
            disabled={isLoading}
          >
            Add Resource
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && (
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
                {resources.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No resources available.
                    </td>
                  </tr>
                )}
                {resources.map((resource) => (
                  <tr key={resource.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{resource.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resource.total_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{resource.available_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={16} />}
                        className="mr-2"
                        onClick={() => handleEditResource(resource)}
                        disabled={isLoading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDelete('resources', resource.id)}
                        disabled={isLoading}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCampusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingCampusId ? 'Edit Campus' : 'Add Campus'}</h3>
            <form onSubmit={handleSubmit(onSubmitCampus)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Campus Name</label>
                <input
                  type="text"
                  {...register('campus_name', { required: 'Campus name is required', maxLength: { value: 100, message: 'Name cannot exceed 100 characters' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.campus_name && <p className="mt-1 text-sm text-red-600">{errors.campus_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  {...register('campus_address', { required: 'Address is required', maxLength: { value: 500, message: 'Address cannot exceed 500 characters' } })}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.campus_address && <p className="mt-1 text-sm text-red-600">{errors.campus_address.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                <input
                  type="text"
                  {...register('contact_person', { required: 'Contact person is required', maxLength: { value: 100, message: 'Name cannot exceed 100 characters' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.contact_person && <p className="mt-1 text-sm text-red-600">{errors.contact_person.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCampusModal(false);
                    setEditingCampusId(null);
                    reset({ campus_name: '', campus_address: '', contact_person: '' });
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
                  {isLoading ? 'Saving...' : editingCampusId ? 'Update Campus' : 'Add Campus'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBuildingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingBuildingId ? 'Edit Building' : 'Add Building'}</h3>
            <form onSubmit={handleSubmit(onSubmitBuilding)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Building Name</label>
                <input
                  type="text"
                  {...register('building_name', { required: 'Building name is required', maxLength: { value: 100, message: 'Name cannot exceed 100 characters' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.building_name && <p className="mt-1 text-sm text-red-600">{errors.building_name.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBuildingModal(false);
                    setEditingBuildingId(null);
                    reset({ building_name: '' });
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
                  {isLoading ? 'Saving...' : editingBuildingId ? 'Update Building' : 'Add Building'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingRoomId ? 'Edit Room' : 'Add Room'}</h3>
            <form onSubmit={handleSubmit(onSubmitRoom)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Name</label>
                <input
                  type="text"
                  {...register('room_name', { required: 'Room name is required', maxLength: { value: 100, message: 'Name cannot exceed 100 characters' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.room_name && <p className="mt-1 text-sm text-red-600">{errors.room_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <input
                  type="number"
                  {...register('room_capacity', { required: 'Capacity is required', min: { value: 0, message: 'Capacity cannot be negative' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.room_capacity && <p className="mt-1 text-sm text-red-600">{errors.room_capacity.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Room Type</label>
                <select
                  {...register('room_type', { required: 'Room type is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="classroom">Classroom</option>
                  <option value="lab">Lab</option>
                  <option value="other">Other</option>
                </select>
                {errors.room_type && <p className="mt-1 text-sm text-red-600">{errors.room_type.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRoomModal(false);
                    setEditingRoomId(null);
                    reset({ room_name: '', room_capacity: 0, room_type: 'classroom' });
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
                  {isLoading ? 'Saving...' : editingRoomId ? 'Update Room' : 'Add Room'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResourceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingResourceId ? 'Edit Resource' : 'Add Resource'}</h3>
            <form onSubmit={handleSubmit(onSubmitResource)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Resource Name</label>
                <input
                  type="text"
                  {...register('resource_name', { required: 'Resource name is required', maxLength: { value: 100, message: 'Name cannot exceed 100 characters' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.resource_name && <p className="mt-1 text-sm text-red-600">{errors.resource_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Count</label>
                <input
                  type="number"
                  {...register('total_count', { required: 'Total count is required', min: { value: 1, message: 'Count must be at least 1' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.total_count && <p className="mt-1 text-sm text-red-600">{errors.total_count.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResourceModal(false);
                    setEditingResourceId(null);
                    reset({ resource_name: '', total_count: 0 });
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
                  {isLoading ? 'Saving...' : editingResourceId ? 'Update Resource' : 'Add Resource'}
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