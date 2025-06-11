import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Bus, UserPlus, Search, Filter, Edit, Trash2, MapPin, Users, Phone, Route } from 'lucide-react';
import { format } from 'date-fns'; // If any date fields are needed

interface BusDetails {
  id: string;
  busNumber: string; // e.g., UK07-AB1234
  registrationNumber: string;
  model?: string;
  capacity: number;
  driverName?: string;
  driverContact?: string;
  assignedRoute?: string; // Route name or ID
  status: 'active' | 'maintenance' | 'inactive';
  lastServiced?: string; // YYYY-MM-DD
}

interface RouteDetails {
    id: string;
    routeName: string;
    stops: string[]; // List of stop names
    numberOfStudents?: number;
}


// Mock data
const mockBuses: BusDetails[] = [
  { id: 'bus001', busNumber: 'SCH-001', registrationNumber: 'UK07-AB1234', model: 'Tata Starbus', capacity: 40, driverName: 'Ramesh Kumar', driverContact: '9800011111', assignedRoute: 'Route A - City Center', status: 'active', lastServiced: '2024-05-15' },
  { id: 'bus002', busNumber: 'SCH-002', registrationNumber: 'UK07-CD5678', model: 'Ashok Leyland Sunshine', capacity: 35, driverName: 'Suresh Singh', driverContact: '9800022222', assignedRoute: 'Route B - Suburbs East', status: 'active', lastServiced: '2024-04-20' },
  { id: 'bus003', busNumber: 'SCH-003', registrationNumber: 'UK07-EF9012', model: 'Eicher Skyline', capacity: 40, driverName: 'Mohan Lal', driverContact: '9800033333', assignedRoute: 'Route C - North Residential', status: 'maintenance', lastServiced: '2024-06-01' },
  { id: 'bus004', busNumber: 'SCH-004', registrationNumber: 'UK07-GH3456', model: 'Tata Marcopolo', capacity: 30, status: 'inactive', lastServiced: '2023-12-10' },
];

const mockRoutes: RouteDetails[] = [
    { id: 'routeA', routeName: 'Route A - City Center', stops: ['Main Square', 'Library Chowk', 'City Hospital', 'School'], numberOfStudents: 35 },
    { id: 'routeB', routeName: 'Route B - Suburbs East', stops: ['East Avenue', 'Green Park', 'Sunrise Colony', 'School'], numberOfStudents: 30 },
    { id: 'routeC', routeName: 'Route C - North Residential', stops: ['North Point', 'Valley View Apts', 'Hilltop Society', 'School'], numberOfStudents: 38 },
];


const busStatuses: BusDetails['status'][] = ['active', 'maintenance', 'inactive'];

const TransportManagement: React.FC = () => {
  const [buses, setBuses] = useState<BusDetails[]>(mockBuses);
  const [routes, setRoutes] = useState<RouteDetails[]>(mockRoutes);
  const [showBusForm, setShowBusForm] = useState(false);
  const [editingBus, setEditingBus] = useState<BusDetails | null>(null);
  const [busFormState, setBusFormState] = useState<Partial<BusDetails>>({ status: 'active', capacity: 30 });

  // TODO: Add similar state and handlers for Routes if they are to be managed here.

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BusDetails['status'] | 'all'>('all');

  const filteredBuses = useMemo(() => {
    return buses.filter(bus =>
      (bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) || (bus.driverName && bus.driverName.toLowerCase().includes(searchTerm.toLowerCase())) || (bus.assignedRoute && bus.assignedRoute.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (statusFilter === 'all' || bus.status === statusFilter)
    ).sort((a,b) => a.busNumber.localeCompare(b.busNumber));
  }, [buses, searchTerm, statusFilter]);

  const handleBusInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBusFormState(prev => ({ ...prev, [name]: name === 'capacity' ? parseInt(value, 10) : value }));
  };

  const handleSaveBus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busFormState.busNumber || !busFormState.registrationNumber || !busFormState.capacity) {
        alert("Please fill Bus Number, Registration Number, and Capacity.");
        return;
    }
    if (editingBus) {
      setBuses(prevBuses => prevBuses.map(b => b.id === editingBus.id ? { ...b, ...busFormState } as BusDetails : b));
      alert('Bus details updated! (Mock)');
    } else {
      const newBus: BusDetails = {
        id: `bus${Date.now()}`,
        status: 'active',
        ...busFormState,
      } as BusDetails;
      setBuses(prevBuses => [newBus, ...prevBuses]);
      alert('New bus added! (Mock)');
    }
    setShowBusForm(false);
    setEditingBus(null);
    setBusFormState({ status: 'active', capacity: 30 });
  };

  const handleEditBus = (bus: BusDetails) => {
    setEditingBus(bus);
    setBusFormState(bus);
    setShowBusForm(true);
  };
  
  const handleDeleteBus = (busId: string) => {
      if(window.confirm("Are you sure you want to delete this bus record?")){
          setBuses(prev => prev.filter(b => b.id !== busId));
          alert(`Bus ${busId} deleted. (Mock)`);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Bus size={28} className="mr-3 text-orange-600"/> Transport Management
        </h1>
        <div className="space-x-2">
            <Button variant="secondary" icon={<Route size={16}/>} onClick={() => alert("Open 'Manage Routes' modal/page (mock).")}>Manage Routes</Button>
            <Button variant="primary" icon={<UserPlus size={16}/>} onClick={() => { setEditingBus(null); setBusFormState({ status: 'active', capacity: 30 }); setShowBusForm(true); }}>
                Add New Bus
            </Button>
        </div>
      </div>

      {/* Add/Edit Bus Form Modal */}
      {showBusForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <Card title={editingBus ? "Edit Bus Details" : "Add New Bus"} className="w-full max-w-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSaveBus} className="space-y-4 p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label htmlFor="busNumber" className="block text-sm font-medium">Bus Number*</label><input type="text" name="busNumber" id="busNumber" value={busFormState.busNumber || ''} onChange={handleBusInputChange} className="mt-1 common-input-styles" required /></div>
                        <div><label htmlFor="registrationNumber" className="block text-sm font-medium">Registration No.*</label><input type="text" name="registrationNumber" id="registrationNumber" value={busFormState.registrationNumber || ''} onChange={handleBusInputChange} className="mt-1 common-input-styles" required /></div>
                        <div><label htmlFor="model" className="block text-sm font-medium">Model</label><input type="text" name="model" id="model" value={busFormState.model || ''} onChange={handleBusInputChange} className="mt-1 common-input-styles" /></div>
                        <div><label htmlFor="capacity" className="block text-sm font-medium">Capacity*</label><input type="number" name="capacity" id="capacity" value={busFormState.capacity || 0} onChange={handleBusInputChange} className="mt-1 common-input-styles" required /></div>
                        <div><label htmlFor="driverName" className="block text-sm font-medium">Driver Name</label><input type="text" name="driverName" id="driverName" value={busFormState.driverName || ''} onChange={handleBusInputChange} className="mt-1 common-input-styles" /></div>
                        <div><label htmlFor="driverContact" className="block text-sm font-medium">Driver Contact</label><input type="tel" name="driverContact" id="driverContact" value={busFormState.driverContact || ''} onChange={handleBusInputChange} className="mt-1 common-input-styles" /></div>
                        <div>
                            <label htmlFor="assignedRoute" className="block text-sm font-medium">Assigned Route</label>
                            <select name="assignedRoute" id="assignedRoute" value={busFormState.assignedRoute || ''} onChange={handleBusInputChange} className="mt-1 common-input-styles">
                                <option value="">Not Assigned</option>
                                {mockRoutes.map(route => <option key={route.id} value={route.routeName}>{route.routeName}</option>)}
                            </select>
                        </div>
                        <div><label htmlFor="status" className="block text-sm font-medium">Status*</label><select name="status" id="status" value={busFormState.status} onChange={handleBusInputChange} className="mt-1 common-input-styles" required>{busStatuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}</select></div>
                        <div><label htmlFor="lastServiced" className="block text-sm font-medium">Last Serviced Date</label><input type="date" name="lastServiced" id="lastServiced" value={busFormState.lastServiced || ''} onChange={handleBusInputChange} className="mt-1 common-input-styles" /></div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-3">
                        <Button type="button" variant="outline" onClick={() => setShowBusForm(false)}>Cancel</Button>
                        <Button type="submit" variant="primary">{editingBus ? "Save Changes" : "Add Bus"}</Button>
                    </div>
                </form>
            </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4">
          <div><label htmlFor="searchTermBus" className="block text-sm font-medium">Search Bus</label><input type="text" id="searchTermBus" placeholder="Bus No, Driver, Route..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mt-1 common-input-styles"/></div>
          <div><label htmlFor="statusFilterBus" className="block text-sm font-medium">Filter by Status</label><select id="statusFilterBus" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BusDetails['status'] | 'all')} className="mt-1 common-input-styles"><option value="all">All Statuses</option>{busStatuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}</select></div>
          <Button variant="outline" icon={<Filter size={16}/>} onClick={() => {setSearchTerm(''); setStatusFilter('all');}} className="mt-1">Clear Filters</Button>
        </div>
      </Card>

      {/* Bus Table */}
      <Card title="School Bus Fleet">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus No.</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBuses.map((bus) => (
                <tr key={bus.id}>
                  <td className="px-3 py-3 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{bus.busNumber}</div><div className="text-xs text-gray-500">{bus.registrationNumber}</div></td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{bus.driverName || 'N/A'}<br/><span className="text-xs">{bus.driverContact || ''}</span></td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{bus.assignedRoute || 'Not Assigned'}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{bus.capacity}</td>
                  <td className="px-3 py-3 whitespace-nowrap"><span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${bus.status === 'active' ? 'bg-green-100 text-green-800' : (bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')}`}>{bus.status}</span></td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                    <Button variant="icon" size="sm" onClick={() => handleEditBus(bus)} title="Edit Bus"><Edit size={16} className="text-blue-600"/></Button>
                    <Button variant="icon" size="sm" onClick={() => handleDeleteBus(bus.id)} title="Delete Bus"><Trash2 size={16} className="text-red-600"/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBuses.length === 0 && <p className="text-center py-6 text-gray-500">No buses found.</p>}
      </Card>
    </div>
  );
};

export default TransportManagement;