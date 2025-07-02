import React, { useState, useEffect, useMemo } from 'react';
import { Bus, UserPlus, Search, Filter, Edit, Trash2, Users, Route, Eye, Printer } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from '../../api';

interface RouteDetails {
  id: number;
  name: string;
  description: string;
  stops: string[];
  number_of_students: number;
  fee: number | null;
  assignments?: BusAssignmentDetails[];
}

interface BusDetails {
  id: number;
  bus_number: string;
  registration_number: string;
  model: string;
  capacity: number;
  driver_name: string;
  driver_contact: string;
  routes: RouteDetails[];
  route_ids?: number[];
  status: 'active' | 'maintenance' | 'inactive';
  last_serviced: string | null;
}

interface BusFeeDetails {
  id: number;
  route: RouteDetails;
  academic_session: { id: number; name: string };
  default_amount: number | null;
}

interface BusAssignmentDetails {
  id: number;
  student: { id: number; user_name: string };
  route: RouteDetails;
  bus: BusDetails | null;
  stop: string;
  custom_fee: number | null;
  academic_session: { id: number; name: string };
  is_active: boolean;
  assigned_at: string;
  remarks: string;
}

interface Student {
  id: number;
  name: string;
  class_name: string;
  section_name: string;
}

const busStatuses: BusDetails['status'][] = ['active', 'maintenance', 'inactive'];

interface Class {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
}

const TransportManagement: React.FC = () => {
  const [buses, setBuses] = useState<BusDetails[]>([]);
  const [routes, setRoutes] = useState<RouteDetails[]>([]);
  const [busFees, setBusFees] = useState<BusFeeDetails[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [showBusForm, setShowBusForm] = useState(false);
  const [editingBus, setEditingBus] = useState<BusDetails | null>(null);
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteDetails | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteDetails | null>(null);
  const [routeAssignments, setRouteAssignments] = useState<BusAssignmentDetails[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<{ [key: number]: { assigned: boolean; stop: string; fee: number | null } }>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [busFormState, setBusFormState] = useState<Partial<BusDetails>>({ status: 'active', capacity: 30, route_ids: [] });
  const [routeFormState, setRouteFormState] = useState<Partial<RouteDetails>>({ stops: [] });
  const [busFeeFormState, setBusFeeFormState] = useState<{ [routeId: number]: { default_amount: number | null } }>({});
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BusDetails['status'] | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBusDetailModal, setShowBusDetailModal] = useState(false);
  const [showRouteDetailModal, setShowRouteDetailModal] = useState(false);
  const [selectedBus, setSelectedBus] = useState<BusDetails | null>(null);
  const [selectedRouteDetail, setSelectedRouteDetail] = useState<RouteDetails | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [busesRes, routesRes, busFeesRes, sessionsRes, classesRes] = await Promise.all([
          api.get('/buses/'),
          api.get('/routes/'),
          api.get('/bus-fees/'),
          api.get('/school/settings/sessions/', { params: { status: 'active' } }),
          api.get('/school/settings/classes/')
        ]);
        setBuses(busesRes.data || []);
        setRoutes(routesRes.data || []);
        setBusFees(busFeesRes.data || []);
        setSessions(sessionsRes.data || []);
        setClasses(classesRes.data || []);

        const feeState: { [routeId: number]: { default_amount: number | null } } = {};
        routesRes.data.forEach((route: RouteDetails) => {
          const fee = busFeesRes.data.find((f: BusFeeDetails) => f.route.id === route.id && f.academic_session.id === sessionsRes.data[0]?.id);
          feeState[route.id] = {
            default_amount: fee ? fee.default_amount : route.fee,
          };
        });
        setBusFeeFormState(feeState);
      } catch (err: any) {
        setError('Failed to load data: ' + (err.response?.data?.detail || err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchSections = async () => {
      if (selectedClass) {
        try {
          const response = await api.get(`/school/settings/classes/${selectedClass}/sections/`);
          setSections(response.data);
        } catch (error) {
          console.error("Failed to fetch sections", error);
          setSections([]);
        }
      } else {
        setSections([]);
      }
    };
    fetchSections();
  }, [selectedClass]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (showAssignModal) {
        try {
          setLoading(true);
          const params = { class_id: selectedClass, section_id: selectedSection };
          const response = await api.get('/bus-assignments/students/', { params });
          setStudents(response.data);
        } catch (err: any) {
          setError('Failed to load students: ' + (err.response?.data?.detail || err.message));
        } finally {
          setLoading(false);
        }
      }
    };
    fetchStudents();
  }, [showAssignModal, selectedClass, selectedSection]);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (showAssignModal && selectedRoute) {
        try {
          setLoading(true);
          const response = await api.get('/bus-assignments/', { params: { route_id: selectedRoute.id } });
          setRouteAssignments(response.data || []);
        } catch (err: any) {
          setError('Failed to load assignments: ' + (err.response?.data?.detail || err.message));
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAssignments();
  }, [showAssignModal, selectedRoute]);

  useEffect(() => {
    if (selectedRoute && showAssignModal) {
      const assignments: { [key: number]: { assigned: boolean; stop: string; fee: number | null } } = {};
      students.forEach(student => {
        const anyAssignment = routeAssignments.find(a => a.student.id === student.id);
        if (anyAssignment) {
          assignments[student.id] = {
            assigned: anyAssignment.is_active,
            stop: anyAssignment.stop,
            fee: anyAssignment.custom_fee
          };
        } else {
          assignments[student.id] = { assigned: false, stop: '', fee: null };
        }
      });
      setPendingAssignments(assignments);
      setHasChanges(false);
    }
  }, [selectedRoute, showAssignModal, students, routeAssignments]);

  const filteredBuses = useMemo(() => {
    return buses
      .filter(bus =>
        (bus.bus_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (bus.driver_name && bus.driver_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
         (bus.routes && bus.routes.some(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())))) &&
        (statusFilter === 'all' || bus.status === statusFilter)
      )
      .sort((a, b) => a.bus_number.localeCompare(b.bus_number));
  }, [buses, searchTerm, statusFilter]);

  const handleBusInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBusFormState(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value, 10) : name === 'route_ids' ? Array.from((e.target as HTMLSelectElement).options).filter(o => o.selected).map(o => parseInt(o.value)) : value
    }));
  };

  const handleRouteInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRouteFormState(prev => ({
      ...prev,
      [name]: name === 'stops' ? value.split(',').map(s => s.trim()).filter(s => s) : value
    }));
  };

  const handleBusFeeChange = (routeId: number, value: number | null) => {
    setBusFeeFormState(prev => ({
      ...prev,
      [routeId]: { ...prev[routeId], default_amount: value }
    }));
  };

  const handleSaveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busFormState.bus_number || !busFormState.registration_number || !busFormState.capacity) {
      toast.error('Please fill Bus Number, Registration Number, and Capacity.');
      return;
    }
    try {
      setLoading(true);
      const payload = { ...busFormState };
      if (editingBus) {
        const response = await api.put<BusDetails>(`/buses/${editingBus.id}/`, payload);
        setBuses(prev => prev.map(b => b.id === editingBus.id ? response.data : b));
      } else {
        const response = await api.post<BusDetails>('/buses/', payload);
        setBuses(prev => [response.data, ...prev]);
      }
      setShowBusForm(false);
      setEditingBus(null);
      setBusFormState({ status: 'active', capacity: 30, route_ids: [] });
    } catch (err: any) {
      setError('Failed to save bus: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBus = async (busId: number) => {
    if (window.confirm('Are you sure you want to delete this bus record?')) {
      try {
        await api.delete(`/buses/${busId}/`);
        setBuses(prev => prev.filter(b => b.id !== busId));
      } catch (err: any) {
        setError('Failed to delete bus: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeFormState.name || !routeFormState.stops?.length) {
      toast.error('Please fill Route Name and Stops.');
      return;
    }
    try {
      setLoading(true);
      if (editingRoute) {
        const response = await api.put<RouteDetails>(`/routes/${editingRoute.id}/`, routeFormState);
        setRoutes(prev => prev.map(r => r.id === editingRoute.id ? response.data : r));
      } else {
        const response = await api.post<RouteDetails>('/routes/', routeFormState);
        setRoutes(prev => [response.data, ...prev]);
      }
      setShowRouteForm(false);
      setEditingRoute(null);
      setRouteFormState({ stops: [] });
    } catch (err: any) {
      setError('Failed to save route: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (routeId: number) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      try {
        await api.delete(`/routes/${routeId}/`);
        setRoutes(prev => prev.filter(r => r.id !== routeId));
      } catch (err: any) {
        setError('Failed to delete route: ' + (err.response?.data?.detail || err.message));
      }
    }
  };
  
  const handleViewBusDetails = (bus: BusDetails) => {
    setSelectedBus(bus);
    setShowBusDetailModal(true);
  };
  
  const handleViewRouteDetails = (route: RouteDetails) => {
    setSelectedRouteDetail(route);
    setShowRouteDetailModal(true);
  };

  const handleSaveBusFee = async (routeId: number) => {
    try {
      setLoading(true);
      const sessionId = sessions[0]?.id;
      if (!sessionId) throw new Error('No active academic session');
      const feeData = {
        route: routeId,
        academic_session: sessionId,
        default_amount: busFeeFormState[routeId]?.default_amount
      };
      
      const existingFee = busFees.find(f => f.route.id === routeId && f.academic_session.id === sessionId);
      
      let promise;
      if (existingFee) {
        promise = api.put(`/bus-fees/${existingFee.id}/`, feeData);
      } else {
        promise = api.post('/bus-fees/', feeData);
      }
      
      await promise;
      
      const [feesRes, routesRes] = await Promise.all([
        api.get('/bus-fees/'),
        api.get('/routes/')
      ]);
      setBusFees(feesRes.data);
      setRoutes(routesRes.data);
      toast.success('Bus fee saved successfully!');
    } catch (err: any) {
      setError('Failed to save bus fee: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = async () => {
    try {
      setLoading(true);
      const sessionId = sessions[0]?.id;
      if (!sessionId) {
        toast.error('No active academic session found');
        return;
      }
      
      // Get report data
      const response = await api.get('/bus-assignments/transport-report-data/', {
        params: { academic_session_id: sessionId }
      });
      
      // Generate HTML for printing
      const reportData = response.data;
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        const htmlContent = generatePrintHTML(reportData);
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then print
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast.success('Transport report opened for printing!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to generate report';
      setError('Failed to generate transport report: ' + errorMsg);
      toast.error('Failed to generate transport report: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  const generatePrintHTML = (reportData: any) => {
    const { session, summary, routes } = reportData;
    
    let routesHTML = '';
    routes.forEach((route: any) => {
      let studentsHTML = '';
      route.assignments.forEach((assignment: any, index: number) => {
        studentsHTML += `
          <tr>
            <td>${index + 1}</td>
            <td>${assignment.student_name}</td>
            <td>${assignment.class_name || 'N/A'}</td>
            <td>${assignment.section_name || 'N/A'}</td>
            <td>${assignment.stop}</td>
            <td>${assignment.bus_number || 'Not Assigned'}</td>
            <td>${assignment.fee || 'Default'}</td>
          </tr>
        `;
      });
      
      routesHTML += `
        <div class="route-section">
          <h3>Route: ${route.name}</h3>
          <p><strong>Stops:</strong> ${route.stops.join(', ')}</p>
          <p><strong>Total Students:</strong> ${route.assignments.length}</p>
          <table>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Stop</th>
                <th>Bus No.</th>
                <th>Fee (NPR)</th>
              </tr>
            </thead>
            <tbody>
              ${studentsHTML}
            </tbody>
          </table>
        </div>
      `;
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transport Management Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #333; }
          .header h2 { margin: 5px 0; color: #666; font-weight: normal; }
          .summary { background: #f5f5f5; padding: 15px; margin-bottom: 30px; border-radius: 5px; }
          .summary h3 { margin-top: 0; }
          .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .route-section { margin-bottom: 40px; page-break-inside: avoid; }
          .route-section h3 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          @media print {
            body { margin: 0; }
            .route-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Transport Management Report</h1>
          <h2>Academic Session: ${session.name}</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="summary">
          <h3>Summary Statistics</h3>
          <div class="summary-grid">
            <div><strong>Total Students Assigned:</strong> ${summary.total_students}</div>
            <div><strong>Total Routes in Use:</strong> ${summary.total_routes}</div>
            <div><strong>Total Buses in Use:</strong> ${summary.total_buses}</div>
            <div><strong>Report Date:</strong> ${new Date().toLocaleDateString()}</div>
          </div>
        </div>
        
        ${routesHTML}
      </body>
      </html>
    `;
  };

  const handleBatchAssign = async () => {
    if (!selectedRoute) return;
    try {
      setLoading(true);
      const sessionId = sessions[0]?.id;
      if (!sessionId) throw new Error('No active academic session');

      const assignmentPromises: Promise<any>[] = [];

      for (const student of students) {
        const pending = pendingAssignments[student.id];
        const existingAssignment = routeAssignments.find(a => a.student.id === student.id && a.academic_session.id === sessionId);

        if (pending.assigned) {
          if (!pending.stop) {
            toast.error(`Please provide a stop for student: ${student.name}`);
            throw new Error('Validation failed');
          }
          if (existingAssignment) {
            // Update if changed
            if (!existingAssignment.is_active || pending.stop !== existingAssignment.stop || pending.fee !== existingAssignment.custom_fee) {
              assignmentPromises.push(api.patch(`/bus-assignments/${existingAssignment.id}/`, {
                stop: pending.stop,
                custom_fee: pending.fee,
                is_active: true
              }));
            }
          } else {
            // Create new
            assignmentPromises.push(api.post('/bus-assignments/', {
              student: student.id,
              route: selectedRoute.id,
              academic_session: sessionId,
              stop: pending.stop,
              custom_fee: pending.fee
            }));
          }
        } else { // Not assigned in UI
          if (existingAssignment && existingAssignment.is_active) {
            // Revoke if it was active
            assignmentPromises.push(api.post(`/bus-assignments/${existingAssignment.id}/revoke/`));
          }
        }
      }

      if (assignmentPromises.length > 0) {
        await Promise.all(assignmentPromises);
      } else {
        toast.info("No changes to save.");
      }

      const [routesRes, busesRes] = await Promise.all([
        api.get('/routes/'),
        api.get('/buses/')
      ]);
      setRoutes(routesRes.data);
      setBuses(busesRes.data);
      setShowAssignModal(false);
      if (assignmentPromises.length > 0) {
        toast.success('Successfully updated assignments.');
      }
    } catch (err: any) {
      if (err.message !== 'Validation failed') {
        const errorMsg = err.response?.data?.detail || err.response?.data?.stop?.[0] || err.message;
        setError('Failed to update assignments: ' + errorMsg);
        toast.error('Failed to update assignments: ' + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderBusForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card title={editingBus ? 'Edit Bus Details' : 'Add New Bus'} className="w-full max-w-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSaveBus} className="space-y-4 p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bus_number" className="block text-sm font-medium">Bus Number*</label>
              <input type="text" name="bus_number" id="bus_number" value={busFormState.bus_number || ''} onChange={handleBusInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="registration_number" className="block text-sm font-medium">Registration No.*</label>
              <input type="text" name="registration_number" id="registration_number" value={busFormState.registration_number || ''} onChange={handleBusInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium">Model</label>
              <input type="text" name="model" id="model" value={busFormState.model || ''} onChange={handleBusInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium">Capacity*</label>
              <input type="number" name="capacity" id="capacity" value={busFormState.capacity || 0} onChange={handleBusInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required />
            </div>
            <div>
              <label htmlFor="driver_name" className="block text-sm font-medium">Driver Name</label>
              <input type="text" name="driver_name" id="driver_name" value={busFormState.driver_name || ''} onChange={handleBusInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="driver_contact" className="block text-sm font-medium">Driver Contact</label>
              <input type="tel" name="driver_contact" id="driver_contact" value={busFormState.driver_contact || ''} onChange={handleBusInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="route_ids" className="block text-sm font-medium">Assigned Routes</label>
              <select
                name="route_ids"
                id="route_ids"
                multiple
                value={busFormState.route_ids?.map(String) || []}
                onChange={handleBusInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-32"
              >
                {routes.map(route => <option key={route.id} value={route.id}>{route.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium">Status*</label>
              <select name="status" id="status" value={busFormState.status} onChange={handleBusInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required>
                {busStatuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="last_serviced" className="block text-sm font-medium">Last Serviced Date</label>
              <input type="date" name="last_serviced" id="last_serviced" value={busFormState.last_serviced || ''} onChange={handleBusInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setShowBusForm(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{editingBus ? 'Save Changes' : 'Add Bus'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );

  const renderRouteForm = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card title={editingRoute ? 'Edit Route Details' : 'Add New Route'} className="w-full max-w-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSaveRoute} className="space-y-4 p-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Route Name*</label>
            <input type="text" name="name" id="name" value={routeFormState.name || ''} onChange={handleRouteInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium">Description</label>
            <textarea name="description" id="description" value={routeFormState.description || ''} onChange={handleRouteInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="stops" className="block text-sm font-medium">Stops (comma-separated)*</label>
            <textarea name="stops" id="stops" value={routeFormState.stops?.join(', ') || ''} onChange={handleRouteInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" required />
          </div>
          <div className="flex justify-end space-x-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setShowRouteForm(false)}>Cancel</Button>
            <Button type="submit" variant="primary">{editingRoute ? 'Save Changes' : 'Add Route'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );

  const renderBusDetailModal = () => {
    if (!selectedBus) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <Card title={`Bus Details: ${selectedBus.bus_number}`} className="w-full max-w-3xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Bus Number:</span>
                    <p className="text-base">{selectedBus.bus_number}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Registration Number:</span>
                    <p className="text-base">{selectedBus.registration_number}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Model:</span>
                    <p className="text-base">{selectedBus.model || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Capacity:</span>
                    <p className="text-base">{selectedBus.capacity} seats</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">Driver Information</h3>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Driver Name:</span>
                    <p className="text-base">{selectedBus.driver_name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Driver Contact:</span>
                    <p className="text-base">{selectedBus.driver_contact || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <p className="text-base capitalize">{selectedBus.status}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Last Serviced:</span>
                    <p className="text-base">{selectedBus.last_serviced || 'Not recorded'}</p>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900">Assigned Routes</h3>
                {selectedBus.routes && selectedBus.routes.length > 0 ? (
                  <div className="mt-2">
                    <ul className="divide-y divide-gray-200">
                      {selectedBus.routes.map(route => (
                        <li key={route.id} className="py-2">
                          <div className="flex justify-between">
                            <div>
                              <p className="text-base font-medium">{route.name}</p>
                              <p className="text-sm text-gray-500">{route.stops.join(' → ')}</p>
                            </div>
                            <div>
                              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {route.number_of_students} students
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500">No routes assigned to this bus.</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <Button variant="outline" onClick={() => setShowBusDetailModal(false)}>Close</Button>
          </div>
        </Card>
      </div>
    );
  };
  
  const renderRouteDetailModal = () => {
    if (!selectedRouteDetail) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <Card title={`Route Details: ${selectedRouteDetail.name}`} className="w-full max-w-3xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Route Information</h3>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Route Name:</span>
                    <p className="text-base">{selectedRouteDetail.name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Description:</span>
                    <p className="text-base">{selectedRouteDetail.description || 'No description'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Number of Students:</span>
                    <p className="text-base">{selectedRouteDetail.number_of_students}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Default Fee:</span>
                    <p className="text-base">{busFeeFormState[selectedRouteDetail.id]?.default_amount ? `NPR ${busFeeFormState[selectedRouteDetail.id].default_amount}` : 'Not set'}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">Stops</h3>
                <div className="mt-2">
                  <ol className="list-decimal list-inside space-y-1">
                    {selectedRouteDetail.stops.map((stop, index) => (
                      <li key={index} className="text-base">{stop}</li>
                    ))}
                  </ol>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900">Assigned Buses</h3>
                <div className="mt-2">
                  {buses.filter(bus => bus.routes.some(r => r.id === selectedRouteDetail.id)).length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {buses
                        .filter(bus => bus.routes.some(r => r.id === selectedRouteDetail.id))
                        .map(bus => (
                          <li key={bus.id} className="py-2">
                            <div className="flex justify-between">
                              <div>
                                <p className="text-base font-medium">{bus.bus_number}</p>
                                <p className="text-sm text-gray-500">{bus.registration_number}</p>
                              </div>
                              <div>
                                <span className={`text-sm px-2 py-1 rounded-full ${
                                  bus.status === 'active' ? 'bg-green-100 text-green-800' : 
                                  bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {bus.status}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))
                      }
                    </ul>
                  ) : (
                    <p className="text-gray-500">No buses assigned to this route.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <Button variant="outline" onClick={() => setShowRouteDetailModal(false)}>Close</Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderAssignModal = () => {
    if (!selectedRoute) return null;
    const defaultFee = busFeeFormState[selectedRoute.id]?.default_amount;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
        <Card title={`Assign Students to Route: ${selectedRoute.name}`} className="w-full max-w-6xl bg-white shadow-xl max-h-[90vh] flex flex-col">
          <div className="p-6 flex-grow overflow-y-auto">
            {loading && <div className="mb-4 p-2 bg-blue-50 text-blue-700 text-sm rounded-md">Processing...</div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="classFilter" className="block text-sm font-medium">Class</label>
                <select id="classFilter" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sectionFilter" className="block text-sm font-medium">Section</label>
                <select id="sectionFilter" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" disabled={!selectedClass}>
                  <option value="">All Sections</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="defaultFee" className="block text-sm font-medium">Default Route Fee (NPR)</label>
                <input
                  type="number"
                  id="defaultFee"
                  value={defaultFee ?? ''}
                  onChange={(e) => handleBusFeeChange(selectedRoute.id, e.target.value ? parseFloat(e.target.value) : null)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
            </div>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assign</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stop</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fee (NPR)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map(student => {
                    const assignmentInfo = pendingAssignments[student.id] || { assigned: false, stop: '', fee: null };
                    return (
                      <tr key={student.id}>
                        <td className="px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked={assignmentInfo.assigned}
                            onChange={(e) => {
                              setPendingAssignments(prev => ({ ...prev, [student.id]: { ...prev[student.id], assigned: e.target.checked } }));
                              setHasChanges(true);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-3 py-2 text-sm">
                          <input
                            type="text"
                            value={assignmentInfo.stop}
                            onChange={(e) => setPendingAssignments(prev => ({ ...prev, [student.id]: { ...prev[student.id], stop: e.target.value } }))}
                            className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                            placeholder="Enter stop"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <input
                            type="number"
                            value={assignmentInfo.fee ?? ''}
                            placeholder={defaultFee?.toString() || 'Custom'}
                            onChange={(e) => setPendingAssignments(prev => ({ ...prev, [student.id]: { ...prev[student.id], fee: e.target.value ? parseFloat(e.target.value) : null } }))}
                            className="w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${assignmentInfo.assigned ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {assignmentInfo.assigned ? 'Assigned' : 'Not Assigned'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 border-t">
            <Button variant="primary" onClick={handleBatchAssign} disabled={loading || !hasChanges}>
              Update Assignments
            </Button>
            <Button variant="secondary" onClick={() => handleSaveBusFee(selectedRoute.id)} disabled={loading}>
              Save Fee
            </Button>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Close</Button>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <Bus size={28} className="mr-3 text-orange-600" /> Transport Management
        </h1>
        <div className="space-x-2">
          <Button variant="secondary" icon={<Route size={16} />} onClick={() => { setEditingRoute(null); setRouteFormState({ stops: [] }); setShowRouteForm(true); }}>
            Manage Routes
          </Button>
          <Button variant="outline" icon={<Printer size={16} />} onClick={handlePrintReport}>
            Print Report
          </Button>
          <Button variant="primary" icon={<UserPlus size={16} />} onClick={() => { setEditingBus(null); setBusFormState({ status: 'active', capacity: 30, route_ids: [] }); setShowBusForm(true); }}>
            Add New Bus
          </Button>
        </div>
      </div>
      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {showBusForm && renderBusForm()}
      {showRouteForm && renderRouteForm()}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4">
          <div>
            <label htmlFor="searchTermBus" className="block text-sm font-medium">Search Bus</label>
            <input type="text" id="searchTermBus" placeholder="Bus No, Driver, Route..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="statusFilterBus" className="block text-sm font-medium">Filter by Status</label>
            <select id="statusFilterBus" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BusDetails['status'] | 'all')} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              <option value="all">All Statuses</option>
              {busStatuses.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          <Button variant="outline" icon={<Filter size={16} />} onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
            Clear Filters
          </Button>
        </div>
      </Card>
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
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{bus.bus_number}</div>
                    <div className="text-xs text-gray-500">{bus.registration_number}</div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {bus.driver_name || 'N/A'}<br />
                    <span className="text-xs">{bus.driver_contact || ''}</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{bus.routes?.map(r => r.name).join(', ') || 'Not Assigned'}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{bus.capacity}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${bus.status === 'active' ? 'bg-green-100 text-green-800' : bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {bus.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                    <Button variant="icon" size="sm" onClick={() => handleViewBusDetails(bus)} title="View Details"><Eye size={16} className="text-indigo-600" /></Button>
                    <Button variant="icon" size="sm" onClick={() => { setEditingBus(bus); setBusFormState({...bus, route_ids: bus.routes?.map(r => r.id)}); setShowBusForm(true); }} title="Edit Bus"><Edit size={16} className="text-blue-600" /></Button>
                    <Button variant="icon" size="sm" onClick={() => handleDeleteBus(bus.id)} title="Delete Bus"><Trash2 size={16} className="text-red-600" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredBuses.length === 0 && <p className="text-center py-6 text-gray-500">No buses found.</p>}
      </Card>
      <Card title="Routes">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stops</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Default Fee</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.map((route) => (
                <tr key={route.id}>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{route.name}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{route.stops.join(', ')}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">{route.number_of_students}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    <input
                      type="number"
                      value={busFeeFormState[route.id]?.default_amount ?? ''}
                      onChange={(e) => handleBusFeeChange(route.id, e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-24 border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"
                      placeholder="Set fee"
                    />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium space-x-1">
                    <Button variant="icon" size="sm" onClick={() => handleViewRouteDetails(route)} title="View Details"><Eye size={16} className="text-indigo-600" /></Button>
                    <Button variant="icon" size="sm" onClick={() => { setEditingRoute(route); setRouteFormState(route); setShowRouteForm(true); }} title="Edit Route"><Edit size={16} className="text-blue-600" /></Button>
                    <Button variant="icon" size="sm" onClick={() => handleDeleteRoute(route.id)} title="Delete Route"><Trash2 size={16} className="text-red-600" /></Button>
                    <Button variant="icon" size="sm" onClick={() => { setSelectedRoute(route); setShowAssignModal(true); }} title="Assign Students"><Users size={16} className="text-indigo-600" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {routes.length === 0 && <p className="text-center py-6 text-gray-500">No routes found.</p>}
      </Card>
      {showAssignModal && renderAssignModal()}
      {showBusDetailModal && renderBusDetailModal()}
      {showRouteDetailModal && renderRouteDetailModal()}
    </div>
  );
};

export default TransportManagement;