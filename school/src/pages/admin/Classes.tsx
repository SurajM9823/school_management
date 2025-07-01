import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller, setValue } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';
import { 
  Search, 
  Users,
  BookOpen,
  Edit,
  Trash2,
  PlusCircle,
  UsersRound,
  X,
  Book
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { AxiosError } from 'axios';

interface User {
  id: number;
  role: string;
  school?: number;
}

interface Class {
  id: number;
  name: string;
  max_capacity: number | null;
  current_capacity: number; // New field for current student count
  is_active: boolean;
  teachers: ClassTeacher[];
  subjects?: Subject[];
}

interface ClassTeacher {
  id: number;
  class_id: number;
  section: number | null;
  teacher: number;
  teacher_name: string;
  section_name: string | null;
  assignment_start_date: string | null;
  assignment_end_date: string | null;
}

interface Teacher {
  id: number;
  staff: { first_name: string; last_name: string };
}

interface Section {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  is_assigned?: boolean;
}

interface FormData {
  name: string;
  max_capacity: number | null;
  teacher_id: number | null;
  section_id: number | null;
  assignment_start_date: string | null;
}

interface SubjectFormData {
  subject_ids: number[];
}

interface ApiErrorResponse {
  error?: string;
}

const Classes: React.FC = () => {
  const { user } = useAuth() as { user: User | null };
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      max_capacity: null,
      teacher_id: null,
      section_id: null,
      assignment_start_date: null,
    },
  });

  const { register: registerSubject, handleSubmit: handleSubjectSubmit, setValue: setSubjectValue, reset: resetSubjectForm, formState: { errors: subjectErrors } } = useForm<SubjectFormData>({
    defaultValues: {
      subject_ids: [],
    },
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      toast.error('Unauthorized access. Please log in as admin.');
      return;
    }
    fetchClasses();
    fetchTeachers();
    fetchSubjects();
  }, [user, navigate]);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Class[]>('/school/settings/classes/');
      setClasses(Array.isArray(response.data) ? response.data : []);
    } catch (err: unknown) {
      handleError(err, 'Failed to fetch classes.');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Teacher[]>('/teachers/');
      setTeachers(Array.isArray(response.data) ? response.data : []);
    } catch (err: unknown) {
      handleError(err, 'Failed to fetch teachers.');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<Subject[]>('/school/settings/subjects/');
      setSubjects(Array.isArray(response.data) ? response.data.map(subject => ({ ...subject, is_assigned: false })) : []);
    } catch (err: unknown) {
      handleError(err, 'Failed to fetch subjects.');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSubjects = async (classId: number) => {
    setModalLoading(true);
    setError(null);
    try {
      const classSubjectsResponse = await api.get<Subject[]>(`/school/settings/classes/${classId}/subjects/`);
      const assignedSubjects = Array.isArray(classSubjectsResponse.data) ? classSubjectsResponse.data : [];
      const assignedSubjectIds = assignedSubjects.map(subject => subject.id);
      
      // Update subjects with is_assigned status
      setSubjects(subjects => subjects.map(subject => ({
        ...subject,
        is_assigned: assignedSubjectIds.includes(subject.id),
      })));

      // Set form values for subject_ids
      setSubjectValue('subject_ids', assignedSubjectIds);
    } catch (err: unknown) {
      handleError(err, 'Failed to fetch class subjects.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleError = (err: unknown, defaultMessage: string) => {
    const error = err as AxiosError<ApiErrorResponse>;
    let errorMessage = defaultMessage;
    if (error.response?.status === 400) {
      errorMessage = error.response?.data?.error || 'Invalid data.';
    } else if (error.response?.status === 401) {
      navigate('/login');
      errorMessage = 'Session expired. Please log in again.';
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }
    setError(errorMessage);
    toast.error(errorMessage);
    console.error(`${defaultMessage}:`, error.response?.data);
  };

  useEffect(() => {
    if (editingClass) {
      const fetchSections = async () => {
        try {
          const response = await api.get<Section[]>(`/school/settings/classes/${editingClass.id}/sections/`);
          setSections(Array.isArray(response.data) ? response.data : []);
        } catch (err: unknown) {
          handleError(err, 'Failed to fetch sections');
          setSections([]);
        }
      };
      fetchSections();
    } else {
      setSections([]);
    }
  }, [editingClass]);

  const checkExistingAssignment = async (classId: number, teacherId: number, sectionId: number | null, startDate: string | null) => {
    try {
      const response = await api.get<ClassTeacher[]>(`/school/class-teachers/?class_id=${classId}&teacher=${teacherId}`);
      const assignments = Array.isArray(response.data) ? response.data : [];
      return assignments.find((assignment: ClassTeacher) => 
        (assignment.section === sectionId || (!assignment.section && !sectionId)) &&
        (assignment.assignment_start_date === startDate || (!assignment.assignment_start_date && !startDate))
      ) || null;
    } catch (err: unknown) {
      console.error('Check existing assignment error:', err);
      return null;
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    let success = false;
    try {
      if (editingClass) {
        const classResponse = await api.put<Class>(`/school/settings/classes/${editingClass.id}/`, {
          name: data.name,
          max_capacity: data.max_capacity || null,
        });

        if (data.teacher_id) {
          const existingAssignment = await checkExistingAssignment(
            editingClass.id,
            Number(data.teacher_id),
            data.section_id || null,
            data.assignment_start_date || null
          );
          try {
            if (existingAssignment) {
              await api.put<ClassTeacher>(`/school/class-teachers/${existingAssignment.id}/`, {
                class_id: editingClass.id,
                section: data.section_id || null,
                teacher: Number(data.teacher_id),
                assignment_start_date: data.assignment_start_date || null,
              });
            } else {
              const payload = {
                class_id: editingClass.id,
                section: data.section_id || null,
                teacher: Number(data.teacher_id),
                assignment_start_date: data.assignment_start_date || null,
              };
              await api.post<ClassTeacher>('/school/class-teachers/', payload);
            }
          } catch (teacherErr: unknown) {
            handleError(teacherErr, 'Failed to assign teacher.');
            return;
          }
        }
        setClasses(classes.map(cls => cls.id === editingClass.id ? classResponse.data : cls));
        toast.success('Class updated successfully');
      } else {
        const classResponse = await api.post<Class>('/school/settings/classes/', {
          name: data.name,
          max_capacity: data.max_capacity || null,
        });

        if (data.teacher_id) {
          try {
            const payload = {
              class_id: classResponse.data.id,
              section: data.section_id || null,
              teacher: Number(data.teacher_id),
              assignment_start_date: data.assignment_start_date || null,
            };
            await api.post<ClassTeacher>('/school/class-teachers/', payload);
          } catch (teacherErr: unknown) {
            handleError(teacherErr, 'Failed to assign teacher.');
            return;
          }
        }
        setClasses([...classes, classResponse.data]);
        toast.success('Class added successfully');
      }
      success = true;
    } catch (err: unknown) {
      handleError(err, `Failed to ${editingClass ? 'update' : 'add'} class.`);
    } finally {
      setLoading(false);
      if (success) {
        setShowForm(false);
        reset();
        setEditingClass(null);
      }
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) return;
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/school/settings/classes/${id}/`);
      setClasses(classes.filter(cls => cls.id !== id));
      toast.success('Class deleted successfully');
    } catch (err: unknown) {
      handleError(err, 'Failed to delete class.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    reset({
      name: cls.name,
      max_capacity: cls.max_capacity,
      teacher_id: cls.teachers[0]?.teacher || null,
      section_id: cls.teachers[0]?.section || null,
      assignment_start_date: cls.teachers[0]?.assignment_start_date || null,
    });
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleAssignSubjects = async (classObj: Class) => {
    setSelectedClass(classObj);
    resetSubjectForm({ subject_ids: [] });
    setShowSubjectModal(true);
    await fetchClassSubjects(classObj.id);
  };

  const onSubjectSubmit = async (data: SubjectFormData) => {
    setLoading(true);
    setError(null);
    try {
      if (!selectedClass) throw new Error('No class selected');
      await api.put(`/school/settings/classes/${selectedClass.id}/subjects/`, {
        subject_ids: data.subject_ids,
      });
      toast.success('Subjects updated successfully');
      setShowSubjectModal(false);
      resetSubjectForm();
      await fetchClasses();
    } catch (err: unknown) {
      handleError(err, 'Failed to update subjects.');
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(cls =>
    cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.teachers?.some(t => t.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manage Classes</h1>
        <Button
          variant="primary"
          icon={<PlusCircle size={16} />}
          onClick={() => { 
            setEditingClass(null); 
            reset(); 
            setShowForm(true);
            setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
          }}
          disabled={loading}
        >
          Add New Class
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => { setError(null); fetchClasses(); }} className="text-red-500 hover:text-red-700">
            <X size={20} />
          </button>
        </div>
      )}

      {showForm && (
        <Card title={editingClass ? `Edit Class: ${editingClass.name}` : 'Add New Class'}>
          <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Class Name</label>
                <input
                  id="name"
                  type="text"
                  className={`mt-1 block w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                  {...register('name', { 
                    required: 'Class name is required',
                    minLength: { value: 2, message: 'Class name must be at least 2 characters' },
                    maxLength: { value: 100, message: 'Class name cannot exceed 100 characters' },
                  })}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="max_capacity" className="block text-sm font-medium text-gray-700">Max Capacity</label>
                <input
                  id="max_capacity"
                  type="number"
                  min="1"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  {...register('max_capacity', { 
                    min: { value: 1, message: 'Capacity must be at least 1' },
                    valueAsNumber: true,
                  })}
                />
                {errors.max_capacity && <p className="mt-1 text-sm text-red-600">{errors.max_capacity.message}</p>}
              </div>
              <div>
                <label htmlFor="teacher_id" className="block text-sm font-medium text-gray-700">Assign Teacher</label>
                <Controller
                  name="teacher_id"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="teacher_id"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Select a teacher</option>
                      {teachers.length === 0 ? (
                        <option disabled>No teachers available</option>
                      ) : (
                        teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.staff.first_name} {teacher.staff.last_name}
                          </option>
                        ))
                      )}
                    </select>
                  )}
                />
              </div>
              <div>
                <label htmlFor="section_id" className="block text-sm font-medium text-gray-700">Assign Section</label>
                <Controller
                  name="section_id"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="section_id"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">No Section</option>
                      {sections.map(section => (
                        <option key={section.id} value={section.id}>{section.name}</option>
                      ))}
                    </select>
                  )}
                />
              </div>
              <div>
                <label htmlFor="assignment_start_date" className="block text-sm font-medium text-gray-700">Assignment Start Date</label>
                <input
                  id="assignment_start_date"
                  type="date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  {...register('assignment_start_date')}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => { setShowForm(false); setEditingClass(null); reset(); }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Saving...' : (editingClass ? 'Update Class' : 'Create Class')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {showSubjectModal && selectedClass && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Assign Subjects to {selectedClass.name}</h2>
              <button onClick={() => setShowSubjectModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            {modalLoading ? (
              <p className="text-gray-500">Loading subjects...</p>
            ) : (
              <form key={selectedClass.id} onSubmit={handleSubjectSubmit(onSubjectSubmit)} className="space-y-4">
                {subjects.length === 0 ? (
                  <p className="text-gray-500">No subjects available</p>
                ) : (
                  subjects.map(subject => (
                    <div key={subject.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`subject-${subject.id}`}
                        value={subject.id}
                        {...registerSubject('subject_ids')}
                        defaultChecked={subject.is_assigned}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`subject-${subject.id}`} className="text-sm font-medium text-gray-700">
                        {subject.name} ({subject.code})
                      </label>
                    </div>
                  ))
                )}
                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowSubjectModal(false)}
                    disabled={loading || modalLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading || modalLoading}
                  >
                    {loading ? 'Saving...' : 'Save Subjects'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <UsersRound className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Classes</p>
              <p className="text-2xl font-semibold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Teachers Assigned</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(classes.flatMap(c => c.teachers.map(t => t.teacher))).size}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Classes with Teachers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {classes.filter(c => c.teachers.length > 0).length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <Book className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Classes with Subjects</p>
              <p className="text-2xl font-semibold text-gray-900">
                {classes.filter(c => c.subjects?.length > 0).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search by class name or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Class List</h3>
          <p className="mt-1 text-sm text-gray-500">Total {filteredClasses.length} classes found</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Teacher</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sections Assigned</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClasses.map((cls) => (
                <tr key={cls.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{cls.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {cls.teachers.map(t => `${t.teacher_name} (${t.section_name || 'No Section'})`).join(', ') || 'No Teachers'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {cls.teachers.filter(t => t.section).map(t => t.section_name).join(', ') || 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex flex-col space-y-1">
                      <span>{cls.current_capacity}/{cls.max_capacity ?? 'N/A'}</span>
                      {cls.max_capacity && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${(cls.current_capacity / cls.max_capacity) * 100}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {cls.subjects?.length ?? 0} subject{cls.subjects?.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditClass(cls)} className="text-yellow-600 hover:text-yellow-900" title="Edit Class">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleAssignSubjects(cls)} className="text-blue-600 hover:text-blue-900" title="Assign Subjects">
                        <Book size={16} />
                      </button>
                      <button onClick={() => handleDeleteClass(cls.id)} className="text-red-600 hover:text-red-900" title="Delete Class">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-10">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or add a new class.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classes;