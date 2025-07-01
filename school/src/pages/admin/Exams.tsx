import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';
import { 
  FileText, 
  Search, 
  Filter, 
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  CalendarCheck,
  ListChecks,
  Percent,
  UploadCloud,
  DownloadCloud,
  Clock,
  ClipboardEdit,
  X,
  Printer,
  Award as AwardIcon
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { format } from 'date-fns';
import { AxiosError } from 'axios';

interface ExamSubjectDetail {
  subject_id: number;
  date: string;
  time: string;
  max_marks: number;
  passing_marks: number;
  class_id?: number;
}

interface Exam {
  id: number;
  name: string;
  classes: { id: number; name: string }[];
  subjects: ExamSubjectDetail[];
  session_id: number;
  term_id: number;
  exam_type: 'test' | 'exam';
  start_date: string;
  end_date: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'results_published' | 'cancelled';
  total_marks?: number;
  passing_marks?: number;
}

interface Student {
  id: string;
  name: string;
  class_id: number;
  roll_number?: string;
}

interface StudentScore {
  student_id: string;
  student_name: string;
  subject_id: number;
  marks_obtained?: number;
  max_marks: number;
  passing_marks: number;
}

interface AcademicSession {
  id: number;
  name: string;
  status: string;
}

interface Term {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
}

interface Subject {
  id: number;
  name: string;
}

interface FormData {
  name: string;
  session_id: number | null;
  term_id: number | null;
  class_ids: number[];
  exam_type: 'test' | 'exam';
  start_date: string;
  end_date: string;
  status: Exam['status'];
  subjects: ExamSubjectDetail[];
}

interface ApiErrorResponse {
  error?: string;
  [key: string]: any;
}

interface ClassSubjects {
  class_id: number;
  subjects: Subject[];
}

const Exams: React.FC = () => {
  const { user } = useAuth() as { user: { id: number; role: string; school?: number } | null };
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classSubjectsMap, setClassSubjectsMap] = useState<ClassSubjects[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedExamForScores, setSelectedExamForScores] = useState<Exam | null>(null);
  const [selectedSubjectForScores, setSelectedSubjectForScores] = useState<ExamSubjectDetail | null>(null);
  const [currentStudentScores, setCurrentStudentScores] = useState<StudentScore[]>([]);
  const [showMarksheetModal, setShowMarksheetModal] = useState(false);
  const [selectedStudentForMarksheet, setSelectedStudentForMarksheet] = useState<Student | null>(null);
  const [selectedExamForMarksheet, setSelectedExamForMarksheet] = useState<Exam | null>(null);
  const [showRankingsModal, setShowRankingsModal] = useState(false);
  const [selectedExamForRankings, setSelectedExamForRankings] = useState<Exam | null>(null);
  const [rankedStudents, setRankedStudents] = useState<Array<Student & { totalMarksObtained: number; totalMaxMarks: number; percentage: number; rank: number }>>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedExamForStatus, setSelectedExamForStatus] = useState<Exam | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  const { register, handleSubmit, control, reset, formState: { errors }, setValue, watch, clearErrors } = useForm<FormData>({
    defaultValues: {
      name: '',
      session_id: null,
      term_id: null,
      class_ids: [],
      exam_type: 'exam',
      start_date: '',
      end_date: '',
      status: 'scheduled',
      subjects: [],
    },
  });

  const selectedClassIds = watch('class_ids');
  const selectedSubjects = watch('subjects');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      toast.error('Unauthorized access. Please log in as admin.');
      return;
    }
    fetchInitialData();
  }, [user, navigate]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [examResponse, sessionResponse, classResponse, subjectResponse] = await Promise.all([
        api.get<Exam[]>('/school/exams/'),
        api.get<AcademicSession[]>('/school/settings/sessions/', { params: { status: 'active' } }),
        api.get<Class[]>('/school/settings/classes/', { params: { is_active: true } }),
        api.get<Subject[]>('/school/settings/subjects/', { params: { is_active: true } }),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const updatedExams = Array.isArray(examResponse.data) ? examResponse.data.map(exam => {
        if (exam.status !== 'results_published' && exam.status !== 'cancelled' && today > exam.end_date) {
          return { ...exam, status: 'completed' };
        }
        return exam;
      }) : [];
      setExams(updatedExams);
      setSessions(Array.isArray(sessionResponse.data) ? sessionResponse.data : []);
      setClasses(Array.isArray(classResponse.data) ? classResponse.data : []);
      setSubjects(Array.isArray(subjectResponse.data) ? subjectResponse.data : []);

      const activeSession = sessionResponse.data.find(s => s.status === 'active');
      if (activeSession) {
        const termResponse = await api.get<Term[]>(`/school/settings/sessions/${activeSession.id}/terms/`, { params: { is_active: true } });
        setTerms(Array.isArray(termResponse.data) ? termResponse.data : []);
      } else {
        setTerms([]);
      }
    } catch (err: unknown) {
      handleError(err, 'Failed to fetch initial data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchClassSubjects = async () => {
      if (selectedClassIds.length === 0) {
        setClassSubjectsMap([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const subjectPromises = selectedClassIds.map(async (classId) => {
          const response = await api.get<Subject[]>(`/school/settings/classes/${classId}/subjects/`);
          return { class_id: classId, subjects: Array.isArray(response.data) ? response.data : [] };
        });
        const subjectsByClass = await Promise.all(subjectPromises);
        setClassSubjectsMap(subjectsByClass);
      } catch (err: unknown) {
        handleError(err, 'Failed to fetch subjects for selected classes.');
      } finally {
        setLoading(false);
      }
    };
    fetchClassSubjects();
  }, [selectedClassIds]);

  const handleError = (err: unknown, defaultMessage: string) => {
    const error = err as AxiosError<ApiErrorResponse>;
    let errorMessage = defaultMessage;
    if (error.response?.status === 400) {
      const errors = error.response?.data;
      if (typeof errors === 'object' && errors) {
        const detailedErrors = Object.entries(errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        errorMessage = detailedErrors || 'Invalid data provided.';
      } else {
        errorMessage = 'Invalid data.';
      }
    } else if (error.response?.status === 401) {
      navigate('/login');
      errorMessage = 'Session expired. Please log in again.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Resource not found.';
    } else {
      errorMessage = error.response?.data?.error || defaultMessage;
    }
    setError(errorMessage);
    toast.error(errorMessage);
    console.error(`${defaultMessage}:`, error.response?.data);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const subjectMap = new Map<number, ExamSubjectDetail>();
      data.subjects.forEach(s => {
        if (!subjectMap.has(s.subject_id)) {
          subjectMap.set(s.subject_id, {
            subject_id: s.subject_id,
            date: s.date || data.start_date,
            time: s.time || '09:00:00',
            max_marks: s.max_marks || 100,
            passing_marks: s.passing_marks || 40,
          });
        }
      });
      const uniqueSubjects = Array.from(subjectMap.values());

      const totalMarksByClass = selectedClassIds.map(classId => {
        const classSubjects = data.subjects.filter(s => s.class_id === classId);
        return classSubjects.reduce((sum, s) => sum + (s.max_marks || 0), 0);
      });
      const total_marks = Math.max(...totalMarksByClass, 0);
      const passing_marks = Math.round(total_marks * 0.4);

      const payload = {
        ...data,
        total_marks,
        passing_marks,
        subjects: uniqueSubjects,
      };

      if (editingExam) {
        const response = await api.put<Exam>(`/school/exams/${editingExam.id}/`, payload);
        setExams(exams.map(ex => ex.id === editingExam.id ? response.data : ex));
        toast.success('Exam updated successfully');
      } else {
        const response = await api.post<Exam>('/school/exams/', payload);
        setExams([...exams, response.data]);
        toast.success('Exam created successfully');
      }
      setShowForm(false);
      reset();
      setEditingExam(null);
      clearErrors();
    } catch (err: unknown) {
      handleError(err, `Failed to ${editingExam ? 'update' : 'create'} exam.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) return;
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/school/exams/${id}/`);
      setExams(exams.filter(ex => ex.id !== id));
      toast.success('Exam deleted successfully');
    } catch (err: unknown) {
      handleError(err, 'Failed to delete exam.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (exam: Exam) => {
    setSelectedExamForStatus(exam);
    setNewStatus(exam.status);
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedExamForStatus || !newStatus) return;
    
    setLoading(true);
    try {
      const response = await api.put(`/school/exams/${selectedExamForStatus.id}/`, {
        ...selectedExamForStatus,
        status: newStatus
      });
      
      setExams(exams.map(ex => ex.id === selectedExamForStatus.id ? { ...ex, status: newStatus } : ex));
      toast.success(`Exam status updated to ${newStatus}`);
      setShowStatusModal(false);
    } catch (err: unknown) {
      handleError(err, 'Failed to update exam status.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (exam: Exam) => {
    const statuses: Exam['status'][] = ['scheduled', 'ongoing', 'completed', 'cancelled'];
    const currentIndex = statuses.indexOf(exam.status);
    const nextStatus = statuses[currentIndex + 1] || statuses[0];
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch<Exam>(`/school/exams/${exam.id}/`, { status: nextStatus });
      setExams(exams.map(ex => ex.id === exam.id ? response.data : ex));
      toast.success(`Exam status updated to ${nextStatus.replace('_', ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}`);
    } catch (err: unknown) {
      handleError(err, 'Failed to update exam status.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditExam = async (exam: Exam) => {
    setLoading(true);
    setError(null);
    try {
      const subjectPromises = exam.classes.map(async (cls) => {
        const response = await api.get<Subject[]>(`/school/settings/classes/${cls.id}/subjects/`);
        return { class_id: cls.id, subjects: Array.isArray(response.data) ? response.data : [] };
      });
      const classSubjects = await Promise.all(subjectPromises);
      setClassSubjectsMap(classSubjects);

      const examSubjects: ExamSubjectDetail[] = [];
      const subjectClassMap = new Map<number, number[]>();
      for (const cls of classSubjects) {
        for (const subject of cls.subjects) {
          if (!subjectClassMap.has(subject.id)) {
            subjectClassMap.set(subject.id, []);
          }
          subjectClassMap.get(subject.id)!.push(cls.class_id);
        }
      }

      for (const subject of exam.subjects) {
        const assignedClasses = subjectClassMap.get(subject.subject_id) || exam.classes.map(c => c.id);
        assignedClasses.forEach(classId => {
          examSubjects.push({
            ...subject,
            class_id: classId,
            date: subject.date || exam.start_date,
            time: subject.time || '09:00:00',
            max_marks: subject.max_marks || 100,
            passing_marks: subject.passing_marks || 40,
          });
        });
      }

      setEditingExam(exam);
      setValue('name', exam.name);
      setValue('session_id', exam.session_id);
      setValue('term_id', exam.term_id);
      setValue('class_ids', exam.classes.map(c => c.id));
      setValue('exam_type', exam.exam_type);
      setValue('start_date', exam.start_date);
      setValue('end_date', exam.end_date);
      setValue('status', exam.status);
      setValue('subjects', examSubjects);
      setShowForm(true);
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch (err: unknown) {
      handleError(err, 'Failed to load exam data for editing.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllSubjectsForClass = (classId: number) => {
    const classSubjects = classSubjectsMap.find(cs => cs.class_id === classId)?.subjects || [];
    const existingSubjects = selectedSubjects.filter(s => s.class_id !== classId);
    const startDate = watch('start_date');
    const newSubjects = classSubjects.map(subject => ({
      subject_id: subject.id,
      date: startDate || new Date().toISOString().split('T')[0],
      time: '09:00:00',
      max_marks: 100,
      passing_marks: 40,
      class_id: classId,
    }));
    setValue('subjects', [...existingSubjects, ...newSubjects]);
  };

  const handleOpenScoreModal = (exam: Exam, subjectDetail: ExamSubjectDetail) => {
    setSelectedExamForScores(exam);
    setSelectedSubjectForScores(subjectDetail);
    setShowScoreModal(true);
    toast.info('Score entry not yet implemented');
  };

  const handleOpenMarksheetModal = (exam: Exam, studentId?: string) => {
    setSelectedExamForMarksheet(exam);
    setSelectedStudentForMarksheet({ id: studentId || '', name: '', class_id: exam.classes[0]?.id || 0 });
    setShowMarksheetModal(true);
    toast.info('Marksheet view not yet implemented');
  };

  const handleOpenRankingsModal = (exam: Exam | null) => {
    setSelectedExamForRankings(exam);
    setShowRankingsModal(true);
    toast.info('Rankings view not yet implemented');
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
    const matchesClass = classFilter === 'all' || exam.classes.some(cls => cls.name === classFilter);
    return matchesSearch && matchesStatus && matchesClass;
  });

  const uniqueClassNames = Array.from(new Set(classes.map(cls => cls.name))).sort();

  const renderExamForm = () => (
    <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Exam Name</label>
        <input
          id="name"
          type="text"
          className={`mt-1 block w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500`}
          {...register('name', { 
            required: 'Exam name is required',
            minLength: { value: 2, message: 'Exam name must be at least 2 characters' },
            maxLength: { value: 100, message: 'Exam name cannot exceed 100 characters' },
          })}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="session_id" className="block text-sm font-medium text-gray-700">Academic Session</label>
          <Controller
            name="session_id"
            control={control}
            rules={{ required: 'Session is required' }}
            render={({ field }) => (
              <select
                id="session_id"
                className={`mt-1 block w-full border ${errors.session_id ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500`}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select Session</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            )}
          />
          {errors.session_id && <p className="mt-1 text-sm text-red-600">{errors.session_id.message}</p>}
        </div>
        <div>
          <label htmlFor="term_id" className="block text-sm font-medium text-gray-700">Term</label>
          <Controller
            name="term_id"
            control={control}
            rules={{ required: 'Term is required' }}
            render={({ field }) => (
              <select
                id="term_id"
                className={`mt-1 block w-full border ${errors.term_id ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500`}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Select Term</option>
                {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          />
          {errors.term_id && <p className="mt-1 text-sm text-red-600">{errors.term_id.message}</p>}
        </div>
        <div>
          <label htmlFor="exam_type" className="block text-sm font-medium text-gray-700">Exam Type</label>
          <Controller
            name="exam_type"
            control={control}
            rules={{ required: 'Exam type is required' }}
            render={({ field }) => (
              <select
                id="exam_type"
                className={`mt-1 block w-full border ${errors.exam_type ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500`}
                value={field.value}
                onChange={field.onChange}
              >
                <option value="exam">Exam</option>
                <option value="test">Test</option>
              </select>
            )}
          />
          {errors.exam_type && <p className="mt-1 text-sm text-red-600">{errors.exam_type.message}</p>}
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <Controller
            name="status"
            control={control}
            rules={{ required: 'Status is required' }}
            render={({ field }) => (
              <select
                id="status"
                className={`mt-1 block w-full border ${errors.status ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500`}
                value={field.value}
                onChange={field.onChange}
              >
                <option value="scheduled">Scheduled</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}
          />
          {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
        </div>
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            id="start_date"
            type="date"
            className={`mt-1 block w-full border ${errors.start_date ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500`}
            {...register('start_date', { required: 'Start date is required' })}
          />
          {errors.start_date && <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>}
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            id="end_date"
            type="date"
            className={`mt-1 block w-full border ${errors.end_date ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500`}
            {...register('end_date', { required: 'End date is required' })}
          />
          {errors.end_date && <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Select Classes for this Exam</label>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
          {classes.map(cls => (
            <div key={cls.id} className="flex items-center">
              <Controller
                name="class_ids"
                control={control}
                rules={{ required: 'At least one class must be selected' }}
                render={({ field }) => (
                  <input
                    id={`class-${cls.id}`}
                    type="checkbox"
                    checked={field.value.includes(cls.id)}
                    onChange={(e) => {
                      const newValue = e.target.checked
                        ? [...field.value, cls.id]
                        : field.value.filter(id => id !== cls.id);
                      field.onChange(newValue);
                      if (!e.target.checked) {
                        setValue('subjects', selectedSubjects.filter(s => s.class_id !== cls.id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                )}
              />
              <label htmlFor={`class-${cls.id}`} className="ml-2 block text-sm text-gray-900">{cls.name}</label>
            </div>
          ))}
        </div>
        {errors.class_ids && <p className="mt-1 text-sm text-red-600">{errors.class_ids.message}</p>}
      </div>

      {selectedClassIds.length > 0 && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Select Subjects for Each Class</label>
          {selectedClassIds.map(classId => {
            const classSubjects = classSubjectsMap.find(cs => cs.class_id === classId)?.subjects || [];
            const className = classes.find(cls => cls.id === classId)?.name || 'Unknown';
            return (
              <Card key={classId} title={`Class ${className}`} className="bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-800">Select Subjects</h4>
                  {classSubjects.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAllSubjectsForClass(classId)}
                      disabled={loading}
                    >
                      Select All Assigned Subjects
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
                  {classSubjects.length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-full">No subjects assigned to this class</p>
                  ) : (
                    classSubjects.map(subject => (
                      <div key={subject.id} className="flex items-center">
                        <Controller
                          name="subjects"
                          control={control}
                          rules={{ validate: value => value.length > 0 || 'At least one subject must be selected for each class' }}
                          render={({ field }) => (
                            <input
                              id={`subject-${classId}-${subject.id}`}
                              type="checkbox"
                              checked={field.value.some(s => s.subject_id === subject.id && s.class_id === classId)}
                              onChange={(e) => {
                                const newSubjects = e.target.checked
                                  ? [...field.value, {
                                      subject_id: subject.id,
                                      date: watch('start_date') || new Date().toISOString().split('T')[0],
                                      time: '09:00:00',
                                      max_marks: 100,
                                      passing_marks: 40,
                                      class_id: classId,
                                    }]
                                  : field.value.filter(s => !(s.subject_id === subject.id && s.class_id === classId));
                                field.onChange(newSubjects);
                              }}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                        />
                        <label htmlFor={`subject-${classId}-${subject.id}`} className="ml-2 block text-sm text-gray-900">{subject.name}</label>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
          {errors.subjects && <p className="mt-1 text-sm text-red-600">{errors.subjects.message}</p>}
        </div>
      )}

      {selectedSubjects.length > 0 && (
        <div className="space-y-4 mt-4">
          <h4 className="text-md font-medium text-gray-800">Subject Details & Schedule</h4>
          {selectedClassIds.map(classId => {
            const classSubjects = selectedSubjects.filter(s => s.class_id === classId);
            const className = classes.find(cls => cls.id === classId)?.name || 'Unknown';
            if (classSubjects.length === 0) return null;
            return (
              <Card key={classId} title={`Class ${className}`} className="bg-gray-50">
                {classSubjects.map((ds, index) => {
                  const globalIndex = selectedSubjects.findIndex(s => s.subject_id === ds.subject_id && s.class_id === ds.class_id);
                  return (
                    <div key={`${ds.class_id}-${ds.subject_id}`} className="mb-4 last:mb-0">
                      <h5 className="text-sm font-medium text-gray-700">{subjects.find(s => s.id === ds.subject_id)?.name || 'Unknown'}</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <div>
                          <label htmlFor={`ds-date-${globalIndex}`} className="block text-xs font-medium text-gray-600">Date</label>
                          <input
                            type="date"
                            id={`ds-date-${globalIndex}`}
                            className={`mt-1 block w-full border ${errors.subjects?.[globalIndex]?.date ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-1 px-2 sm:text-sm`}
                            {...register(`subjects.${globalIndex}.date`, { 
                              required: 'Date is required',
                              validate: value => {
                                const startDate = watch('start_date');
                                const endDate = watch('end_date');
                                if (startDate && endDate && (value < startDate || value > endDate)) {
                                  return 'Date must be within exam start and end dates';
                                }
                                return true;
                              }
                            })}
                          />
                          {errors.subjects?.[globalIndex]?.date && <p className="mt-1 text-sm text-red-600">{errors.subjects[globalIndex].date?.message}</p>}
                        </div>
                        <div>
                          <label htmlFor={`ds-time-${globalIndex}`} className="block text-xs font-medium text-gray-600">Time</label>
                          <input
                            type="time"
                            id={`ds-time-${globalIndex}`}
                            className={`mt-1 block w-full border ${errors.subjects?.[globalIndex]?.time ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-1 px-2 sm:text-sm`}
                            {...register(`subjects.${globalIndex}.time`, { required: 'Time is required' })}
                          />
                          {errors.subjects?.[globalIndex]?.time && <p className="mt-1 text-sm text-red-600">{errors.subjects[globalIndex].time?.message}</p>}
                        </div>
                        <div>
                          <label htmlFor={`ds-maxMarks-${globalIndex}`} className="block text-xs font-medium text-gray-600">Max Marks</label>
                          <input
                            type="number"
                            id={`ds-maxMarks-${globalIndex}`}
                            className={`mt-1 block w-full border ${errors.subjects?.[globalIndex]?.max_marks ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-1 px-2 sm:text-sm`}
                            {...register(`subjects.${globalIndex}.max_marks`, { 
                              required: 'Max marks is required',
                              min: { value: 1, message: 'Max marks must be at least 1' },
                              valueAsNumber: true,
                            })}
                          />
                          {errors.subjects?.[globalIndex]?.max_marks && <p className="mt-1 text-sm text-red-600">{errors.subjects[globalIndex].max_marks?.message}</p>}
                        </div>
                        <div>
                          <label htmlFor={`ds-passingMarks-${globalIndex}`} className="block text-xs font-medium text-gray-600">Passing Marks</label>
                          <input
                            type="number"
                            id={`ds-passingMarks-${globalIndex}`}
                            className={`mt-1 block w-full border ${errors.subjects?.[globalIndex]?.passing_marks ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-1 px-2 sm:text-sm`}
                            {...register(`subjects.${globalIndex}.passing_marks`, { 
                              required: 'Passing marks is required',
                              min: { value: 0, message: 'Passing marks cannot be negative' },
                              validate: value => {
                                const maxMarks = watch(`subjects.${globalIndex}.max_marks`);
                                if (maxMarks !== undefined && value > maxMarks) {
                                  return 'Passing marks cannot exceed max marks';
                                }
                                return true;
                              },
                              valueAsNumber: true,
                            })}
                          />
                          {errors.subjects?.[globalIndex]?.passing_marks && <p className="mt-1 text-sm text-red-600">{errors.subjects[globalIndex].passing_marks?.message}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex justify-end space-x-3 mt-6">
        <Button
          variant="outline"
          onClick={() => { setShowForm(false); setEditingExam(null); reset(); clearErrors(); }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : (editingExam ? 'Update Exam' : 'Create Exam')}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manage Examinations</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            icon={<AwardIcon size={16} />}
            onClick={() => handleOpenRankingsModal(null)}
            disabled={!exams.some(e => e.status === 'results_published')}
          >
            View Rankings
          </Button>
          <Button
            variant="outline"
            icon={<ClipboardEdit size={16} />}
            onClick={() => navigate('/admin/exam/managescore')}
          >
            Manage Scores
          </Button>
          <Button
            variant="primary"
            icon={<PlusCircle size={16} />}
            onClick={() => { setEditingExam(null); reset(); clearErrors(); setShowForm(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
            disabled={loading}
          >
            Schedule New Exam
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => { setError(null); fetchInitialData(); }} className="text-red-500 hover:text-red-700">
            <X size={20} />
          </button>
        </div>
      )}

      {showForm && (
        <Card title={editingExam ? `Edit Exam: ${editingExam.name}` : 'Schedule New Examination'}>
          {renderExamForm()}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-cyan-500 rounded-md p-3"><ListChecks className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><p className="text-sm font-medium text-gray-500">Total Exams</p><p className="text-2xl font-semibold text-gray-900">{exams.length}</p></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3"><CalendarCheck className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><p className="text-sm font-medium text-gray-500">Scheduled</p><p className="text-2xl font-semibold text-gray-900">{exams.filter(e => e.status === 'scheduled').length}</p></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3"><Percent className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><p className="text-sm font-medium text-gray-500">Results Published</p><p className="text-2xl font-semibold text-gray-900">{exams.filter(e => e.status === 'results_published').length}</p></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3"><Clock className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><p className="text-sm font-medium text-gray-500">Ongoing</p><p className="text-2xl font-semibold text-gray-900">{exams.filter(e => e.status === 'ongoing').length}</p></div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by exam name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Filter className="h-5 w-5 text-gray-400" /></div>
            <select
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="all">All Classes</option>
              {uniqueClassNames.map(name => <option key={name} value={name}>Class {name}</option>)}
            </select>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Filter className="h-5 w-5 text-gray-400" /></div>
            <select
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="results_published">Results Published</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Exam Schedule</h3>
          <p className="mt-1 text-sm text-gray-500">Total {filteredExams.length} exams found</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates (Start - End)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExams.map((exam) => (
                <tr key={exam.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{exam.name}</div>
                    <div className="text-xs text-gray-500">Total Marks: {exam.total_marks || 'N/A'} | Passing: {exam.passing_marks || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {exam.classes.map(cls => (
                      <span key={cls.id} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 mr-1">
                        {cls.name}
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {format(new Date(exam.start_date), 'MMM dd, yyyy')} - {format(new Date(exam.end_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {exam.subjects.map(s => subjects.find(sub => sub.id === s.subject_id)?.name || 'Unknown').join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        exam.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        exam.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
                        exam.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        exam.status === 'results_published' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {exam.status.replace('_', ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-1">
                    <Button variant="icon" size="sm" onClick={() => toast.info(`Viewing details for ${exam.name}`)} title="View Details"><Eye size={16} /></Button>
                    <Button variant="icon" size="sm" onClick={() => handleEditExam(exam)} title="Edit Exam"><Edit size={16} className="text-yellow-600 hover:text-yellow-700" /></Button>
                    <Button variant="icon" size="sm" onClick={() => handleStatusUpdate(exam)} title="Update Status"><CalendarCheck size={16} className="text-blue-600 hover:text-blue-700" /></Button>
                    {exam.status === 'results_published' && (
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => handleOpenMarksheetModal(exam)}
                        title="View Marksheet(s)"
                      >
                        <Printer size={16} className="text-teal-600 hover:text-teal-700"/>
                      </Button>
                    )}
                    <Button variant="icon" size="sm" onClick={() => toast.info(`Manage papers for ${exam.name}`)} title="Manage Papers/Upload"><UploadCloud size={16} className="text-indigo-600 hover:text-indigo-700"/></Button>
                    <Button variant="icon" size="sm" onClick={() => toast.info(`Download results for ${exam.name}`)} title="Download Results"><DownloadCloud size={16} className="text-green-600 hover:text-green-700"/></Button>
                    <Button variant="icon" size="sm" onClick={() => handleDeleteExam(exam.id)} title="Delete Exam"><Trash2 size={16} className="text-red-600 hover:text-red-700" /></Button>
                  </div>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExams.length === 0 && (
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No exams found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter, or schedule a new exam.</p>
          </div>
        )}
      </div>

      {showScoreModal && selectedExamForScores && selectedSubjectForScores && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <Card title={`Enter Scores for ${selectedExamForScores.name} - ${subjects.find(s => s.id === selectedSubjectForScores.subject_id)?.name || 'Unknown'} (Classes ${selectedExamForScores.classes.map(c => c.name).join(', ')})`} className="w-full max-w-2xl bg-white shadow-xl rounded-lg">
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <p className="text-center text-gray-500 py-4">Score entry not yet implemented.</p>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
              <Button variant="outline" onClick={() => setShowScoreModal(false)} icon={<X size={16}/>}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {showMarksheetModal && selectedExamForMarksheet && selectedStudentForMarksheet && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <Card
            title={`Marksheet: ${selectedStudentForMarksheet.name} (Roll: ${selectedStudentForMarksheet.roll_number || 'N/A'}) - ${selectedExamForMarksheet.name}`}
            className="w-full max-w-3xl bg-white shadow-xl rounded-lg"
          >
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <p className="text-center text-gray-500 py-4">Marksheet view not yet implemented.</p>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
              <Button variant="outline" onClick={() => setShowMarksheetModal(false)} icon={<X size={16}/>}>Close</Button>
            </div>
          </Card>
        </div>
      )}

      {showRankingsModal && selectedExamForRankings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <Card
            title={`Rankings: ${selectedExamForRankings.name} (Classes ${selectedExamForRankings.classes.map(c => c.name).join(', ')})`}
            className="w-full max-w-3xl bg-white shadow-xl rounded-lg"
          >
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <p className="text-center text-gray-500 py-4">Rankings view not yet implemented.</p>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
              <Button variant="outline" onClick={() => setShowRankingsModal(false)} icon={<X size={16}/>}>Close</Button>
            </div>
          </Card>
        </div>
      )}

      {showStatusModal && selectedExamForStatus && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <Card
            title={`Update Status: ${selectedExamForStatus.name}`}
            className="w-full max-w-md bg-white shadow-xl rounded-lg"
          >
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                  <p className="text-sm text-gray-600 capitalize">{selectedExamForStatus.status.replace('_', ' ')}</p>
                </div>
                <div>
                  <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                  <select
                    id="status-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="results_published">Results Published</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
              <Button variant="outline" onClick={() => setShowStatusModal(false)} disabled={loading}>Cancel</Button>
              <Button variant="primary" onClick={handleStatusSubmit} disabled={loading || newStatus === selectedExamForStatus.status}>
                {loading ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Exams;
