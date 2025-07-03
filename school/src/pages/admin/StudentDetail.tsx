import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Book, Award, FileText, Phone, Mail, MapPin, School, Clock, Download, Edit, Trash2, Eye } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../api';
import { format } from 'date-fns';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Define backend URL
const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:8000";

interface Student {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  phone: string;
  profile_image: string | null;
  class_id: number;
  class_name: string;
  section_id: number | null;
  section_name: string | null;
  academic_session_id: number;
  academic_session_name: string;
  admission_date: string;
  status: string;
  alumni_type: string | null;
  dob?: string;
  gender?: string;
  address?: string;
  previous_school?: string;
  admission_number?: string;
  created_at: string;
  updated_at: string;
  documents?: Document[];
}

interface Document {
  id: number;
  file: string;
  description?: string;
  document_type_id?: number;
  uploaded_at: string;
}

interface Scholarship {
  id: number;
  name: string;
  description: string;
  scholarship_type: string;
  amount: number | null;
  percentage_waiver: number | null;
  is_full_waiver: boolean;
  duration_months: number | null;
  academic_session_name: string;
  status: string;
  assigned_at: string;
  is_active: boolean;
}

interface EventAssignment {
  id: number;
  event: {
    id: number;
    name: string;
    event_type: string;
    start_date: string;
    end_date: string | null;
  };
  assigned_at: string;
  is_active: boolean;
}

const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [events, setEvents] = useState<EventAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch student details
        const studentRes = await api.get(`/students/${id}/`);
        setStudent(studentRes.data);
        
        try {
          // Fetch student documents
          const documentsRes = await api.get(`/students/${id}/documents/`);
          setStudent(prev => prev ? { ...prev, documents: documentsRes.data } : null);
        } catch (err) {
          console.warn("Failed to fetch student documents:", err);
        }
        
        // Use mock data for scholarships since API endpoint doesn't exist
        const mockScholarships: Scholarship[] = [
          {
            id: 1,
            name: "Merit Scholarship",
            description: "Awarded for academic excellence",
            scholarship_type: "merit-based",
            amount: 1000,
            percentage_waiver: null,
            is_full_waiver: false,
            duration_months: 12,
            academic_session_name: studentRes.data.academic_session_name,
            status: "active",
            assigned_at: new Date().toISOString(),
            is_active: true
          }
        ];
        setScholarships(mockScholarships);
        
        // Use mock data for events since API endpoint doesn't exist
        const mockEvents: EventAssignment[] = [
          {
            id: 1,
            event: {
              id: 1,
              name: "Annual Sports Day",
              event_type: "sports",
              start_date: "2025-07-15",
              end_date: "2025-07-16"
            },
            assigned_at: new Date().toISOString(),
            is_active: true
          },
          {
            id: 2,
            event: {
              id: 2,
              name: "Science Exhibition",
              event_type: "academic",
              start_date: "2025-08-10",
              end_date: null
            },
            assigned_at: new Date().toISOString(),
            is_active: true
          }
        ];
        setEvents(mockEvents);
        
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load student data");
        toast.error("Failed to load student data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, [id]);

  const handleDownloadDocument = async (doc: Document) => {
    if (!doc.file) {
      toast.error("Invalid document URL");
      return;
    }
    try {
      // Just show success message without actual download since we're using mock data
      toast.success("Document download simulation successful");
      
      // In a real implementation, we would use this code:
      /*
      const fileUrl = doc.file.startsWith("http") ? doc.file : `${backendUrl}${doc.file}`;
      const response = await api.get(fileUrl, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.file.split('/').pop() || 'document');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      */
    } catch (err) {
      toast.error("Failed to download document");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p className="mb-4">{error || "Student not found"}</p>
          <Button variant="primary" onClick={() => navigate('/admin/admissions')}>
            Back to Admissions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/admissions')}
          className="mr-4"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Admissions
        </Button>
        <h1 className="text-2xl font-semibold">Student Details</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Profile Card */}
        <Card title="Profile Information" className="lg:col-span-1">
          <div className="flex flex-col items-center p-4">
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
              {student.profile_image ? (
                <img
                  src={
                    student.profile_image.startsWith("http") 
                      ? student.profile_image 
                      : `${backendUrl}${student.profile_image}`
                  }
                  alt={student.user_name}
                  className="w-32 h-32 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder-avatar.png";
                  }}
                />
              ) : (
                <User size={48} className="text-gray-400" />
              )}
            </div>
            
            <h2 className="text-xl font-semibold">{student.user_name}</h2>
            <p className="text-gray-500 mb-4">ID: {student.admission_number || student.id}</p>
            
            <div className="w-full space-y-3">
              <div className="flex items-center">
                <Mail size={16} className="text-gray-500 mr-2" />
                <span>{student.user_email}</span>
              </div>
              <div className="flex items-center">
                <Phone size={16} className="text-gray-500 mr-2" />
                <span>{student.phone || "Not provided"}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="text-gray-500 mr-2" />
                <span>DOB: {student.dob ? format(new Date(student.dob), "MMM dd, yyyy") : "Not provided"}</span>
              </div>
              <div className="flex items-center">
                <User size={16} className="text-gray-500 mr-2" />
                <span>Gender: {student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : "Not provided"}</span>
              </div>
              <div className="flex items-start">
                <MapPin size={16} className="text-gray-500 mr-2 mt-1" />
                <span>{student.address || "Address not provided"}</span>
              </div>
            </div>
            
            <div className="mt-6 w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  student.status === "active" 
                    ? "bg-green-100 text-green-800" 
                    : student.status === "alumni" 
                    ? "bg-blue-100 text-blue-800" 
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {student.status === "on_leave"
                    ? "On Leave"
                    : student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                </span>
              </div>
              
              {student.status === "alumni" && student.alumni_type && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">Alumni Type</span>
                  <span className="text-gray-700">
                    {student.alumni_type.charAt(0).toUpperCase() + student.alumni_type.slice(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
        
        {/* Academic Information */}
        <Card title="Academic Information" className="lg:col-span-2">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <School size={18} className="text-blue-600 mr-2" />
                  <h3 className="font-medium">Class Information</h3>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Class:</span>
                    <span className="font-medium">{student.class_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Section:</span>
                    <span className="font-medium">{student.section_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Academic Session:</span>
                    <span className="font-medium">{student.academic_session_name}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center mb-2">
                  <Clock size={18} className="text-blue-600 mr-2" />
                  <h3 className="font-medium">Admission Details</h3>
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admission Date:</span>
                    <span className="font-medium">
                      {student.admission_date ? format(new Date(student.admission_date), "MMM dd, yyyy") : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Previous School:</span>
                    <span className="font-medium">{student.previous_school || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Joined:</span>
                    <span className="font-medium">
                      {student.created_at ? format(new Date(student.created_at), "MMM dd, yyyy") : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Scholarships Section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Scholarships</h3>
              {scholarships.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scholarships.map(scholarship => (
                        <tr key={scholarship.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {scholarship.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {scholarship.scholarship_type.replace('-', ' ')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {scholarship.is_full_waiver 
                              ? "Full Waiver" 
                              : scholarship.percentage_waiver 
                              ? `${scholarship.percentage_waiver}% Waiver` 
                              : scholarship.amount 
                              ? `$${scholarship.amount}` 
                              : "N/A"}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {scholarship.academic_session_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              scholarship.is_active 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {scholarship.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">No scholarships assigned</p>
              )}
            </div>
            
            {/* Events Section */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Event Participation</h3>
              {events.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {events.map(event => (
                        <tr key={event.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {event.event.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {event.event.event_type.charAt(0).toUpperCase() + event.event.event_type.slice(1)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(event.event.start_date), "MMM dd, yyyy")}
                            {event.event.end_date && ` - ${format(new Date(event.event.end_date), "MMM dd, yyyy")}`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              event.is_active 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {event.is_active ? "Active" : "Revoked"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 italic">No event participation</p>
              )}
            </div>
          </div>
        </Card>
        
        {/* Documents Section */}
        <Card title="Documents" className="lg:col-span-3">
          <div className="p-4">
            {student.documents && student.documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {student.documents.map(doc => (
                  <div key={doc.id} className="border rounded-md p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FileText size={18} className="text-blue-600 mr-2" />
                        <h4 className="font-medium truncate">
                          {doc.description || doc.file.split('/').pop() || "Unnamed Document"}
                        </h4>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Uploaded: {format(new Date(doc.uploaded_at), "MMM dd, yyyy")}
                    </p>
                    <div className="mt-auto flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Just show a message instead of opening the file
                          toast.info("Document view simulation");
                        }}
                      >
                        <Eye size={16} className="mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download size={16} className="mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                <p className="mt-1 text-sm text-gray-500">No documents have been uploaded for this student.</p>
              </div>
            )}
          </div>
        </Card>
        
        {/* Action Buttons */}
        <div className="lg:col-span-3 flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/admissions`)}
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Admissions
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(`/admin/students/${student.id}/edit`)}
          >
            <Edit size={16} className="mr-2" /> Edit Student
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;