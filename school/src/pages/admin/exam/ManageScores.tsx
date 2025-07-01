import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../api';
import { ArrowLeft, Save, X } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import { AxiosError } from 'axios';

interface AcademicSession {
  id: number;
  name: string;
  status: string;
}

interface Term {
  id: number;
  name: string;
}

interface Exam {
  id: number;
  name: string;
  classes: { id: number; name: string }[];
  subjects: ExamSubjectDetail[];
  term_id: number;
  session_id: number;
}

interface ExamSubjectDetail {
  subject_id: number;
  max_marks: number;
}

interface Class {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
  class_id: number;
}

interface Subject {
  id: number;
  name: string;
}

interface Student {
  id: string;
  user_name: string;
  user_email: string;
  roll_number?: string;
  student_id?: string;
  admission_number?: string;
}

interface Score {
  student_id: string;
  marks_obtained?: number;
}

interface FormData {
  session_id: number | null;
  term_id: number | null;
  exam_id: number | null;
  class_id: number | null;
  section_id: number | null;
  subject_id: number | null;
  scores: Score[];
}

interface ApiErrorResponse {
  error?: string;
  scores?: any[];
  [key: string]: any;
}

const ManageScores: React.FC = () => {
  const { user } = useAuth() as { user: { id: number; role: string; school?: number } | null };
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      session_id: null,
      term_id: null,
      exam_id: examId ? Number(examId) : null,
      class_id: null,
      section_id: null,
      subject_id: null,
      scores: [],
    },
  });

  const selectedSessionId = watch('session_id');
  const selectedTermId = watch('term_id');
  const selectedExamId = watch('exam_id');
  const selectedClassId = watch('class_id');
  const selectedSectionId = watch('section_id');
  const selectedSubjectId = watch('subject_id');

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
      const [sessionResponse, classResponse] = await Promise.all([
        api.get<AcademicSession[]>('/school/settings/sessions/', { params: { status: 'active' } }),
        api.get<Class[]>('/school/settings/classes/', { params: { is_active: true } }),
      ]);
      setSessions(Array.isArray(sessionResponse.data) ? sessionResponse.data : []);
      setClasses(Array.isArray(classResponse.data) ? classResponse.data : []);

      if (examId) {
        const examResponse = await api.get<Exam>(`/school/exams/${examId}/`);
        if (examResponse.data.status !== 'results_published') {
          setError('Scores can only be managed for exams with Results Published status.');
          return;
        }
        setExams([examResponse.data]);
        setValue('exam_id', examResponse.data.id);
        setValue('term_id', examResponse.data.term_id);
        setValue('session_id', examResponse.data.session_id);
        const termResponse = await api.get<Term[]>(`/school/settings/sessions/${examResponse.data.session_id}/terms/`);
        setTerms(Array.isArray(termResponse.data) ? termResponse.data : []);
        // Fetch subjects with proper names
        const subjectResponse = await api.get<Subject[]>('/school/settings/subjects/', { params: { is_active: true } });
        const allSubjects = Array.isArray(subjectResponse.data) ? subjectResponse.data : [];
        const examSubjects = examResponse.data.subjects.map(es => 
          allSubjects.find(s => s.id === es.subject_id) || { id: es.subject_id, name: `Subject ${es.subject_id}` }
        );
        setSubjects(examSubjects);
      } else {
        const examResponse = await api.get<Exam[]>('/school/exams/', { params: { status: 'results_published' } });
        setExams(Array.isArray(examResponse.data) ? examResponse.data : []);
      }
    } catch (err: unknown) {
      handleError(err, 'Failed to fetch initial data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTerms = async () => {
      if (!selectedSessionId) {
        setTerms([]);
        setExams([]);
        setValue('term_id', null);
        setValue('exam_id', null);
        return;
      }
      setLoading(true);
      try {
        const termResponse = await api.get<Term[]>(`/school/settings/sessions/${selectedSessionId}/terms/`, { params: { is_active: true } });
        setTerms(Array.isArray(termResponse.data) ? termResponse.data : []);
        setValue('term_id', null);
        setValue('exam_id', null);
      } catch (err: unknown) {
        handleError(err, 'Failed to fetch terms.');
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, [selectedSessionId, setValue]);

  useEffect(() => {
    const fetchExams = async () => {
      if (!selectedTermId) {
        setExams([]);
        setValue('exam_id', null);
        return;
      }
      setLoading(true);
      try {
        const examResponse = await api.get<Exam[]>('/school/exams/', { params: { term_id: selectedTermId, status: 'results_published' } });
        setExams(Array.isArray(examResponse.data) ? examResponse.data : []);
        if (!examId) {
          setValue('exam_id', null);
        }
      } catch (err: unknown) {
        handleError(err, 'Failed to fetch exams.');
      } finally {
        setLoading(false);
      }
    };
    if (!examId) fetchExams();
  }, [selectedTermId, setValue, examId]);

  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedClassId) {
        setSections([]);
        setValue('section_id', null);
        return;
      }
      setLoading(true);
      try {
        const sectionResponse = await api.get<Section[]>(`/school/settings/classes/${selectedClassId}/sections/`);
        setSections(Array.isArray(sectionResponse.data) ? sectionResponse.data : []);
        setValue('section_id', null);
      } catch (err: unknown) {
        handleError(err, 'Failed to fetch sections.');
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, [selectedClassId, setValue]);

  useEffect(() => {
    const fetchSubjectsAndStudents = async () => {
      if (!selectedExamId || !selectedClassId || !selectedSectionId) {
        setSubjects([]);
        setStudents([]);
        setValue('subject_id', null);
        setValue('scores', []);
        return;
      }
      setLoading(true);
      try {
        const exam = exams.find(e => e.id === selectedExamId);
        if (exam) {
          const subjectResponse = await api.get<Subject[]>('/school/settings/subjects/', { params: { is_active: true } });
          const allSubjects = Array.isArray(subjectResponse.data) ? subjectResponse.data : [];
          const examSubjects = exam.subjects.map(es => 
            allSubjects.find(s => s.id === es.subject_id) || { id: es.subject_id, name: `Subject ${es.subject_id}` }
          );
          setSubjects(examSubjects);
          setMaxMarks(exam.subjects[0]?.max_marks || 100);
        }
        const studentResponse = await api.get<Student[]>(`/students/`, { params: { section_id: selectedSectionId, is_active: true } });
        const studentsData = Array.isArray(studentResponse.data) ? studentResponse.data : [];
        console.log('Students data:', studentsData);
        setStudents(studentsData);
        setValue('scores', studentsData.map(student => ({ student_id: student.id, marks_obtained: undefined })));
        
        // Fetch existing scores if subject is selected
        if (selectedSubjectId) {
          await fetchExistingScores(selectedExamId, selectedSubjectId, selectedSectionId, studentsData);
        }
      } catch (err: unknown) {
        handleError(err, 'Failed to fetch subjects or students.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubjectsAndStudents();
  }, [selectedExamId, selectedClassId, selectedSectionId, setValue, exams]);

  const fetchExistingScores = async (examId: number, subjectId: number, sectionId: number, studentsData: Student[]) => {
    try {
      const scoresResponse = await api.get('/school/scores/', {
        params: {
          exam_id: examId,
          subject_id: subjectId,
          section_id: sectionId
        }
      });
      
      const existingScores = Array.isArray(scoresResponse.data) ? scoresResponse.data : [];
      const scoresMap = new Map(existingScores.map((score: any) => [score.student_id, score.marks_obtained]));
      
      const updatedScores = studentsData.map(student => ({
        student_id: student.id,
        marks_obtained: scoresMap.get(student.id) || undefined
      }));
      
      setValue('scores', updatedScores);
    } catch (err) {
      console.log('No existing scores found or error fetching scores');
    }
  };

  const handleError = (err: unknown, defaultMessage: string) => {
    const error = err as AxiosError<ApiErrorResponse>;
    let errorMessage = defaultMessage;
    if (error.response?.status === 400) {
      const errors = error.response?.data;
      if (typeof errors === 'object' && errors) {
        if (errors.scores && Array.isArray(errors.scores)) {
          errorMessage = errors.scores.map((scoreError, index) => 
            `Student ${students[index]?.id || index + 1}: ${Object.values(scoreError).join(', ')}`
          ).join('; ');
        } else {
          errorMessage = Object.entries(errors)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
        }
      }
    } else if (error.response?.status === 401) {
      navigate('/login');
      errorMessage = 'Session expired. Please log in again.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Resource not found. Please check your selections.';
    } else {
      errorMessage = error.response?.data?.error || defaultMessage;
    }
    setError(errorMessage);
    toast.error(errorMessage);
  };

  const onSubmit = async (data: FormData) => {
    if (!data.scores.every(score => score.marks_obtained === undefined || (score.marks_obtained >= 0 && score.marks_obtained <= maxMarks))) {
      toast.error('All marks must be between 0 and the maximum marks or left blank for absent students.');
      return;
    }
    if (data.scores.some(score => score.marks_obtained === undefined) && !window.confirm('Some students are marked absent (no marks entered). Proceed with saving?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/school/scores/', {
        exam_id: data.exam_id,
        subject_id: data.subject_id,
        section_id: data.section_id,
        scores: data.scores.filter(score => score.marks_obtained !== undefined).map(score => ({
          student_id: score.student_id,
          marks_obtained: score.marks_obtained,
        })),
      });
      toast.success('Scores saved successfully');
    } catch (err: unknown) {
      handleError(err, 'Failed to save scores.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Manage Scores</h1>
        <Button
          variant="outline"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/admin/exams')}
        >
          Back to Exams
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={20} />
          </button>
        </div>
      )}

      <Card title="Score Entry">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    disabled={!!examId}
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
                    disabled={!!examId}
                  >
                    <option value="">Select Term</option>
                    {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              />
              {errors.term_id && <p className="mt-1 text-sm text-red-600">{errors.term_id.message}</p>}
            </div>
            <div>
              <label htmlFor="exam_id" className="block text-sm font-medium text-gray-700">Exam</label>
              <Controller
                name="exam_id"
                control={control}
                rules={{ required: 'Exam is required' }}
                render={({ field }) => (
                  <select
                    id="exam_id"
                    className={`mt-1 block w-full border ${errors.exam_id ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500`}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    disabled={!!examId}
                  >
                    <option value="">Select Exam</option>
                    {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                )}
              />
              {errors.exam_id && <p className="mt-1 text-sm text-red-600">{errors.exam_id.message}</p>}
            </div>
            <div>
              <label htmlFor="class_id" className="block text-sm font-medium text-gray-700">Class</label>
              <Controller
                name="class_id"
                control={control}
                rules={{ required: 'Class is required' }}
                render={({ field }) => (
                  <select
                    id="class_id"
                    className={`mt-1 block w-full border ${errors.class_id ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500`}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              />
              {errors.class_id && <p className="mt-1 text-sm text-red-600">{errors.class_id.message}</p>}
            </div>
            <div>
              <label htmlFor="section_id" className="block text-sm font-medium text-gray-700">Section</label>
              <Controller
                name="section_id"
                control={control}
                rules={{ required: 'Section is required' }}
                render={({ field }) => (
                  <select
                    id="section_id"
                    className={`mt-1 block w-full border ${errors.section_id ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500`}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Select Section</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              />
              {errors.section_id && <p className="mt-1 text-sm text-red-600">{errors.section_id.message}</p>}
            </div>
            <div>
              <label htmlFor="subject_id" className="block text-sm font-medium text-gray-700">Subject</label>
              <Controller
                name="subject_id"
                control={control}
                rules={{ required: 'Subject is required' }}
                render={({ field }) => (
                  <select
                    id="subject_id"
                    className={`mt-1 block w-full border ${errors.subject_id ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500`}
                    value={field.value ?? ''}
                    onChange={async (e) => {
                      const subjectId = e.target.value ? Number(e.target.value) : null;
                      field.onChange(subjectId);
                      const exam = exams.find(e => e.id === selectedExamId);
                      const subject = exam?.subjects.find(s => s.subject_id === subjectId);
                      setMaxMarks(subject?.max_marks || 100);
                      
                      // Fetch existing scores when subject is selected
                      if (subjectId && selectedExamId && selectedSectionId && students.length > 0) {
                        await fetchExistingScores(selectedExamId, subjectId, selectedSectionId, students);
                      }
                    }}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              />
              {errors.subject_id && <p className="mt-1 text-sm text-red-600">{errors.subject_id.message}</p>}
            </div>
          </div>

          {students.length > 0 && selectedSubjectId && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">Enter Student Scores</h3>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks (Max: {maxMarks})</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student, index) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.admission_number || student.roll_number || student.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{student.user_name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            step="0.1"
                            className={`block w-24 border ${errors.scores?.[index]?.marks_obtained ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-1 px-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            {...register(`scores.${index}.marks_obtained`, {
                              min: { value: 0, message: 'Marks cannot be negative' },
                              max: { value: maxMarks, message: `Marks cannot exceed ${maxMarks}` },
                              valueAsNumber: true,
                            })}
                          />
                          {errors.scores?.[index]?.marks_obtained && (
                            <p className="mt-1 text-sm text-red-600">{errors.scores[index].marks_obtained?.message}</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/exams')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || !selectedSubjectId || students.length === 0}
              icon={<Save size={16} />}
            >
              {loading ? 'Saving...' : 'Save Scores'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ManageScores;
