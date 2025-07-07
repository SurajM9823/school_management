import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import { BookOpen, Users, Edit3, X } from 'lucide-react';
import Button from '../../components/common/Button';
import axios from '../../api';

// Define interfaces based on the API response structure
interface TeacherClass {
  id: number;
  class_obj: number;
  class_name: string;
  subject_name: string;
  student_count: number;
}

interface ClassTeacherAssignment {
  id: number;
  class_id: number;
  class_name: string;
  section_name: string | null;
}

interface AssignedClass {
  id: string;
  name: string;
  section_name: string | null;
  subjects: { id: string; name: string; students: number }[];
}

interface Student {
  id: number;
  name: string;
  admission_number: string | null;
}

const MyClasses: React.FC = () => {
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
  const [isRemarksModalOpen, setIsRemarksModalOpen] = useState<boolean>(false);
  const [remarks, setRemarks] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Function to fetch teacher classes from the API
  const fetchTeacherClasses = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/teacher/myclasses/', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log('Classes Response:', response.data);

      const subjectData: TeacherClass[] = Array.isArray(response.data.subject_assignments)
          ? response.data.subject_assignments
          : [];
      const classTeacherData: ClassTeacherAssignment[] = Array.isArray(response.data.class_teacher_assignments)
          ? response.data.class_teacher_assignments
          : [];

      console.log('Class Teacher Assignments:', classTeacherData);

      const sectionMap = classTeacherData.reduce((acc: { [key: number]: string | null }, item) => {
        acc[item.class_id] = item.section_name;
        return acc;
      }, {});

      console.log('Section Map:', sectionMap);

      const groupedClasses = subjectData.reduce((acc: { [key: string]: AssignedClass }, item: TeacherClass) => {
        if (!acc[item.class_name]) {
          acc[item.class_name] = {
            id: item.class_obj.toString(),
            name: item.class_name,
            section_name: sectionMap[item.class_obj] || 'No Section',
            subjects: [],
          };
        }
        acc[item.class_name].subjects.push({
          id: item.id.toString(),
          name: item.subject_name,
          students: item.student_count,
        });
        return acc;
      }, {});

      const formattedClasses: AssignedClass[] = Object.values(groupedClasses);
      setAssignedClasses(formattedClasses);
    } catch (err: any) {
      setError(
          err.response?.status === 403
              ? 'You are not authorized to view this data.'
              : 'Failed to fetch classes. Please try again later.'
      );
      console.error('Error fetching teacher classes:', err, {
        response: err.response?.data,
        status: err.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch students for a specific class
  const fetchStudents = async (classId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/teacher/classes/${classId}/students/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      console.log('Students Response:', response.data);
      setStudents(Array.isArray(response.data) ? response.data : []);
      setIsModalOpen(true);
    } catch (err: any) {
      setError('Failed to fetch students. Please try again later.');
      console.error('Error fetching students:', err, {
        response: err.response?.data,
        status: err.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle View Students button click
  const handleViewStudents = (classId: string, className: string) => {
    setSelectedClassName(className);
    fetchStudents(classId);
  };

  // Handle Add Remarks button click
  const handleAddRemarks = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setIsRemarksModalOpen(true);
  };

  // Handle posting remarks
  const handlePostRemarks = async () => {
    if (!remarks.trim()) {
      setError('Remarks cannot be empty.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await axios.post(
          '/teacher/remarks/',
          {
            subject_id: selectedSubjectId,
            content: remarks,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
      );
      setRemarks('');
      setIsRemarksModalOpen(false);
    } catch (err: any) {
      setError('Failed to post remarks. Please try again later.');
      console.error('Error posting remarks:', err, {
        response: err.response?.data,
        status: err.response?.status,
      });
    } finally {
      setLoading(false);
    }
  };

  // Close the students modal
  const closeModal = () => {
    setIsModalOpen(false);
    setStudents([]);
    setSelectedClassName(null);
  };

  // Close the remarks modal
  const closeRemarksModal = () => {
    setIsRemarksModalOpen(false);
    setRemarks('');
    setSelectedSubjectId(null);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">My Classes & Subjects</h1>
        </div>

        {loading ? (
            <Card>
              <p className="text-gray-600">Loading...</p>
            </Card>
        ) : error ? (
            <Card>
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchTeacherClasses} variant="primary" size="sm" className="mt-2">
                Retry
              </Button>
            </Card>
        ) : assignedClasses.length === 0 ? (
            <Card>
              <p className="text-gray-600">You are not currently assigned to any classes.</p>
            </Card>
        ) : (
            <div className="space-y-4">
              {assignedClasses.map((assignedClass) => (
                  <Card
                      key={assignedClass.id}
                      title={`Class: ${assignedClass.name}${assignedClass.section_name ? ` - ${assignedClass.section_name}` : ''}`}
                  >
                    <ul className="divide-y divide-gray-200">
                      {assignedClass.subjects.map((subject) => (
                          <li key={subject.id} className="py-4">
                            <div className="flex items-center justify-between space-x-4">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                  <BookOpen size={20} />
                                </div>
                                <div>
                                  <p className="text-md font-medium text-gray-900">{subject.name}</p>
                                  <p className="text-sm text-gray-500 flex items-center">
                                    <Users size={14} className="mr-1" /> {subject.students} Students
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    icon={<Users size={16} />}
                                    onClick={() => handleViewStudents(assignedClass.id, assignedClass.name)}
                                >
                                  View Students
                                </Button>
                                {/*<Button*/}
                                {/*    variant="outline"*/}
                                {/*    size="sm"*/}
                                {/*    icon={<Edit3 size={16} />}*/}
                                {/*    onClick={() => handleAddRemarks(subject.id)}*/}
                                {/*>*/}
                                {/*  Add Remarks*/}
                                {/*</Button>*/}
                              </div>
                            </div>
                          </li>
                      ))}
                    </ul>
                  </Card>
              ))}
            </div>
        )}

        {/* Modal for displaying students */}
        {isModalOpen && (
            <div role="dialog" aria-labelledby="modal-title" className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 id="modal-title" className="text-xl font-semibold">Students in {selectedClassName}</h2>
                  <button onClick={closeModal} className="text-gray-600 hover:text-gray-900">
                    <X size={24} />
                  </button>
                </div>
                {loading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-600"></div>
                    </div>
                ) : students.length === 0 ? (
                    <p className="text-gray-600">No students found for this class.</p>
                ) : (
                    <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {students.map((student) => (
                          <li key={student.id} className="py-2">
                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">
                              Roll Number: {student.admission_number || 'Not Assigned'}
                            </p>
                          </li>
                      ))}
                    </ul>
                )}
                <div className="mt-4">
                  <Button variant="primary" size="sm" onClick={closeModal}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
        )}

        {/* Modal for adding remarks */}
        {isRemarksModalOpen && (
            <div role="dialog" aria-labelledby="remarks-modal-title" className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 id="remarks-modal-title" className="text-xl font-semibold">Add Remarks</h2>
                  <button onClick={closeRemarksModal} className="text-gray-600 hover:text-gray-900">
                    <X size={24} />
                  </button>
                </div>
                <div className="mb-4">
                  <textarea
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                      rows={4}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter your remarks here..."
                  />
                </div>
                {error && <p className="text-red-600 mb-4">{error}</p>}
                <div className="flex justify-end space-x-2">
                  <Button variante="outline" size="sm" onClick={closeRemarksModal}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={handlePostRemarks} disabled={loading}>
                    {loading ? 'Posting...' : 'Post Remarks'}
                  </Button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default MyClasses;