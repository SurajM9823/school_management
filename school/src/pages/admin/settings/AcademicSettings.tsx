import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BookOpen, Plus, Edit, Trash2 } from 'lucide-react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import api from '../../../api';
import { AxiosResponse } from 'axios';

interface Class {
  id: number;
  name: string;
  max_capacity: number;
  is_active: boolean;
}

interface Section {
  id: number;
  name: string;
  class_id: number;
  class_name: string;
  max_capacity: number | null;
  is_active: boolean;
}

interface Subject {
  id: number;
  name: string;
  code: string;
  subject_type: string;
  class_ids: number[];
  is_active: boolean;
}

interface GradingScale {
  scale_id: number;
  grade: string;
  min_score: number;
  max_score: number;
  gpa: string;
  description: string;
  is_active: boolean;
}

interface PromotionRules {
  min_overall_percentage: number;
  max_failed_subjects: number;
  consider_attendance: boolean;
}

interface ClassCapacity {
  max_students: number;
  min_students: number;
}

interface AcademicFormData {
  class_name: string;
  class_max_capacity: number;
  section_name: string;
  section_max_capacity: number | null;
  subject_name: string;
  subject_code: string;
  subject_type: string;
  subject_class_ids: number[];
  grading_scale_grade: string;
  grading_scale_min_score: number;
  grading_scale_max_score: number;
  grading_scale_gpa: string;
  grading_scale_description: string;
  promotion_rules_min_overall_percentage: number;
  promotion_rules_max_failed_subjects: number;
  promotion_rules_consider_attendance: boolean;
  class_capacity_max_students: number;
  class_capacity_min_students: number;
}

const AcademicSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AcademicFormData>({
    defaultValues: {
      class_name: '',
      class_max_capacity: 0,
      section_name: '',
      section_max_capacity: null,
      subject_name: '',
      subject_code: '',
      subject_type: 'core',
      subject_class_ids: [],
      grading_scale_grade: '',
      grading_scale_min_score: 0,
      grading_scale_max_score: 0,
      grading_scale_gpa: '',
      grading_scale_description: '',
      promotion_rules_min_overall_percentage: 0,
      promotion_rules_max_failed_subjects: 0,
      promotion_rules_consider_attendance: false,
      class_capacity_max_students: 0,
      class_capacity_min_students: 0,
    }
  });
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<{ [key: number]: Section[] }>({});
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [gradingScales, setGradingScales] = useState<GradingScale[]>([]);
  const [promotionRules, setPromotionRules] = useState<PromotionRules | null>(null);
  const [classCapacity, setClassCapacity] = useState<ClassCapacity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showGradingScaleModal, setShowGradingScaleModal] = useState(false);
  const [showPromotionRulesModal, setShowPromotionRulesModal] = useState(false);
  const [showClassCapacityModal, setShowClassCapacityModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [editingScaleId, setEditingScaleId] = useState<number | null>(null);
  const [currentClassId, setCurrentClassId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      toast.error('Unauthorized access. Please log in as admin.');
      return;
    }
    fetchAcademicData();
  }, [user, navigate]);

  const fetchAcademicData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [classesResponse, subjectsResponse, gradingScalesResponse, promotionRulesResponse, classCapacityResponse] = await Promise.all([
        api.get('/school/settings/classes/'),
        api.get('/school/settings/subjects/'),
        api.get('/school/settings/grading-scales/'),
        api.get('/school/settings/promotion-rules/'),
        api.get('/school/settings/class-capacity/'),
      ]);
      setClasses(classesResponse.data);
      setSubjects(subjectsResponse.data);
      setGradingScales(gradingScalesResponse.data);
      setPromotionRules(promotionRulesResponse.data);
      setClassCapacity(classCapacityResponse.data);
      reset({
        promotion_rules_min_overall_percentage: promotionRulesResponse.data.min_overall_percentage || 0,
        promotion_rules_max_failed_subjects: promotionRulesResponse.data.max_failed_subjects || 0,
        promotion_rules_consider_attendance: promotionRulesResponse.data.consider_attendance || false,
        class_capacity_max_students: classCapacityResponse.data.max_students || 0,
        class_capacity_min_students: classCapacityResponse.data.min_students || 0,
      });
      const sectionsData: { [key: number]: Section[] } = {};
      for (const cls of classesResponse.data) {
        const sectionsResponse = await api.get(`/school/settings/classes/${cls.id}/sections/`);
        sectionsData[cls.id] = sectionsResponse.data;
      }
      setSections(sectionsData);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load academic settings.');
      toast.error('Failed to load academic settings');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitClass = async (data: AcademicFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = { name: data.class_name, max_capacity: data.class_max_capacity };
      let response: AxiosResponse<any, any>;
      if (editingClassId) {
        response = await api.put(`/school/settings/classes/${editingClassId}/`, payload);
        setClasses(classes.map(c => c.id === editingClassId ? response.data : c));
        toast.success('Class updated successfully');
      } else {
        response = await api.post('/school/settings/classes/', payload);
        setClasses([...classes, response.data]);
        toast.success('Class added successfully');
      }
      setShowClassModal(false);
      setEditingClassId(null);
      reset({ class_name: '', class_max_capacity: 0 });
    } catch (err: any) {
      console.error('Class error:', err);
      setError(err.response?.data?.message || `Failed to ${editingClassId ? 'update' : 'add'} class.`);
      toast.error(`Failed to ${editingClassId ? 'update' : 'add'} class`);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitSection = async (data: AcademicFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = { name: data.section_name, max_capacity: data.section_max_capacity || null };
      let response: AxiosResponse<any, any>;
      if (editingSectionId) {
        response = await api.put(`/school/settings/classes/${currentClassId}/sections/${editingSectionId}/`, payload);
        setSections({
          ...sections,
          [currentClassId!]: sections[currentClassId!].map(s => s.id === editingSectionId ? response.data : s)
        });
        toast.success('Section updated successfully');
      } else {
        response = await api.post(`/school/settings/classes/${currentClassId}/sections/`, payload);
        setSections({
          ...sections,
          [currentClassId!]: [...(sections[currentClassId!] || []), response.data]
        });
        toast.success('Section added successfully');
      }
      setShowSectionModal(false);
      setEditingSectionId(null);
      reset({ section_name: '', section_max_capacity: null });
    } catch (err: any) {
      console.error('Section error:', err);
      setError(err.response?.data?.message || `Failed to ${editingSectionId ? 'update' : 'add'} section.`);
      toast.error(`Failed to ${editingSectionId ? 'update' : 'add'} section`);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitSubject = async (data: AcademicFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        name: data.subject_name,
        code: data.subject_code,
        subject_type: data.subject_type,
        class_ids: data.subject_class_ids,
      };
      let response: AxiosResponse<any, any>;
      if (editingSubjectId) {
        response = await api.put(`/school/settings/subjects/${editingSubjectId}/`, payload);
        setSubjects(subjects.map(s => s.id === editingSubjectId ? response.data : s));
        toast.success('Subject updated successfully');
      } else {
        response = await api.post('/school/settings/subjects/', payload);
        setSubjects([...subjects, response.data]);
        toast.success('Subject added successfully');
      }
      setShowSubjectModal(false);
      setEditingSubjectId(null);
      reset({ subject_name: '', subject_code: '', subject_type: 'core', subject_class_ids: [] });
    } catch (err: any) {
      console.error('Subject error:', err);
      setError(err.response?.data?.message || `Failed to ${editingSubjectId ? 'update' : 'add'} subject.`);
      toast.error(`Failed to ${editingSubjectId ? 'update' : 'add'} subject`);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitGradingScale = async (data: AcademicFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        grade: data.grading_scale_grade,
        min_score: data.grading_scale_min_score,
        max_score: data.grading_scale_max_score,
        gpa: data.grading_scale_gpa,
        description: data.grading_scale_description,
      };
      let response: AxiosResponse<any, any>;
      if (editingScaleId) {
        response = await api.put(`/school/settings/grading-scales/${editingScaleId}/`, payload);
        setGradingScales(gradingScales.map(gs => gs.scale_id === editingScaleId ? response.data : gs));
        toast.success('Grading scale updated successfully');
      } else {
        response = await api.post('/school/settings/grading-scales/', payload);
        setGradingScales([...gradingScales, response.data]);
        toast.success('Grading scale added successfully');
      }
      setShowGradingScaleModal(false);
      setEditingScaleId(null);
      reset({ grading_scale_grade: '', grading_scale_min_score: 0, grading_scale_max_score: 0, grading_scale_gpa: '', grading_scale_description: '' });
    } catch (err: any) {
      console.error('Grading scale error:', err);
      setError(err.response?.data?.message || `Failed to ${editingScaleId ? 'update' : 'add'} grading scale.`);
      toast.error(`Failed to ${editingScaleId ? 'update' : 'add'} grading scale`);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPromotionRules = async (data: AcademicFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.put('/school/settings/promotion-rules/', {
        min_overall_percentage: data.promotion_rules_min_overall_percentage,
        max_failed_subjects: data.promotion_rules_max_failed_subjects,
        consider_attendance: data.promotion_rules_consider_attendance,
      });
      setPromotionRules(response.data);
      setShowPromotionRulesModal(false);
      reset({
        promotion_rules_min_overall_percentage: response.data.min_overall_percentage,
        promotion_rules_max_failed_subjects: response.data.max_failed_subjects,
        promotion_rules_consider_attendance: response.data.consider_attendance,
      });
      toast.success('Promotion rules updated successfully');
    } catch (err: any) {
      console.error('Promotion rules error:', err);
      setError(err.response?.data?.message || 'Failed to update promotion rules.');
      toast.error('Failed to update promotion rules');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitClassCapacity = async (data: AcademicFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.put('/school/settings/class-capacity/', {
        max_students: data.class_capacity_max_students,
        min_students: data.class_capacity_min_students,
      });
      setClassCapacity(response.data);
      setShowClassCapacityModal(false);
      reset({
        class_capacity_max_students: response.data.max_students,
        class_capacity_min_students: response.data.min_students,
      });
      toast.success('Class capacity updated successfully');
    } catch (err: any) {
      console.error('Class capacity error:', err);
      setError(err.response?.data?.message || 'Failed to update class capacity.');
      toast.error('Failed to update class capacity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClass = (cls: Class) => {
    setEditingClassId(cls.id);
    setValue('class_name', cls.name);
    setValue('class_max_capacity', cls.max_capacity);
    setShowClassModal(true);
  };

  const handleEditSection = (section: Section, classId: number) => {
    setEditingSectionId(section.id);
    setCurrentClassId(classId);
    setValue('section_name', section.name);
    setValue('section_max_capacity', section.max_capacity);
    setShowSectionModal(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setValue('subject_name', subject.name);
    setValue('subject_code', subject.code);
    setValue('subject_type', subject.subject_type);
    setValue('subject_class_ids', subject.class_ids);
    setShowSubjectModal(true);
  };

  const handleEditGradingScale = (scale: GradingScale) => {
    setEditingScaleId(scale.scale_id);
    setValue('grading_scale_grade', scale.grade);
    setValue('grading_scale_min_score', scale.min_score);
    setValue('grading_scale_max_score', scale.max_score);
    setValue('grading_scale_gpa', scale.gpa);
    setValue('grading_scale_description', scale.description);
    setShowGradingScaleModal(true);
  };

  const handleDelete = async (type: string, id: number, classId?: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.replace('-', ' ')}?`)) return;
    setIsLoading(true);
    setError(null);
    try {
      if (type === 'classes') {
        await api.delete(`/school/settings/classes/${id}/`);
        setClasses(classes.filter(c => c.id !== id));
        setSections(prev => {
          const newSections = { ...prev };
          delete newSections[id];
          return newSections;
        });
      } else if (type === 'sections' && classId) {
        await api.delete(`/school/settings/classes/${classId}/sections/${id}/`);
        setSections({
          ...sections,
          [classId]: sections[classId].filter(s => s.id !== id)
        });
      } else if (type === 'subjects') {
        await api.delete(`/school/settings/subjects/${id}/`);
        setSubjects(subjects.filter(s => s.id !== id));
      } else if (type === 'grading-scales') {
        await api.delete(`/school/settings/grading-scales/${id}/`);
        setGradingScales(gradingScales.filter(gs => gs.scale_id !== id));
      }
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')} deleted successfully`);
    } catch (err: any) {
      console.error(`Delete ${type} error:`, err);
      setError(err.response?.data?.message || `Failed to delete ${type.replace('-', ' ')}.`);
      toast.error(`Failed to delete ${type.replace('-', ' ')}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-semibold text-gray-900">Academic Settings</h1>

      {error && (
        <div className="text-center py-4 text-red-600">
          {error}
          <Button
            variant="outline"
            className="ml-4"
            onClick={fetchAcademicData}
            disabled={isLoading}
          >
            Retry
          </Button>
        </div>
      )}

      <Card title="Classes">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingClassId(null);
              reset({ class_name: '', class_max_capacity: 0 });
              setShowClassModal(true);
            }}
            disabled={isLoading}
          >
            Add Class
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && (
          <div className="space-y-4">
            {classes.length === 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                No classes available. Please add a class to proceed.
              </div>
            )}
            {classes.map((cls) => (
              <div key={cls.id} className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900">{cls.name} (Max: {cls.max_capacity} students)</h3>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit size={16} />}
                      onClick={() => handleEditClass(cls)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      onClick={() => handleDelete('classes', cls.id)}
                      disabled={isLoading || (sections[cls.id] && sections[cls.id].length > 0)}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus size={16} />}
                      onClick={() => {
                        setCurrentClassId(cls.id);
                        setEditingSectionId(null);
                        reset({ section_name: '', section_max_capacity: null });
                        setShowSectionModal(true);
                      }}
                      disabled={isLoading}
                    >
                      Add Section
                    </Button>
                  </div>
                </div>
                <div className="pl-4">
                  <h4 className="text-sm font-medium text-gray-700">Sections</h4>
                  {sections[cls.id]?.length === 0 && (
                    <p className="text-sm text-gray-500">No sections available.</p>
                  )}
                  {sections[cls.id]?.map((section) => (
                    <div key={section.id} className="flex justify-between items-center py-2">
                      <span>{section.name} {section.max_capacity ? `(Max: ${section.max_capacity})` : ''}</span>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit size={16} />}
                          onClick={() => handleEditSection(section, cls.id)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => handleDelete('sections', section.id, cls.id)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Subjects">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              if (classes.length === 0) {
                toast.error('Please create at least one class before adding subjects.');
                return;
              }
              setEditingSubjectId(null);
              reset({ subject_name: '', subject_code: '', subject_type: 'core', subject_class_ids: [] });
              setShowSubjectModal(true);
            }}
            disabled={isLoading}
          >
            Add Subject
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subject.subject_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {subject.class_ids.length > 0 ? subject.class_ids.map(id => classes.find(c => c.id === id)?.name).join(', ') : 'None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={16} />}
                        className="mr-2"
                        onClick={() => handleEditSubject(subject)}
                        disabled={isLoading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDelete('subjects', subject.id)}
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

      <Card title="Grading Scales">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingScaleId(null);
              reset({ grading_scale_grade: '', grading_scale_min_score: 0, grading_scale_max_score: 0, grading_scale_gpa: '', grading_scale_description: '' });
              setShowGradingScaleModal(true);
            }}
            disabled={isLoading}
          >
            Add Grading Scale
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPA</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {gradingScales.map((scale) => (
                  <tr key={scale.scale_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{scale.grade}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scale.min_score}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scale.max_score}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{scale.gpa}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={16} />}
                        className="mr-2"
                        onClick={() => handleEditGradingScale(scale)}
                        disabled={isLoading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDelete('grading-scales', scale.scale_id)}
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

      <Card title="Promotion Rules">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Edit size={16} />}
            onClick={() => setShowPromotionRulesModal(true)}
            disabled={isLoading}
          >
            Edit Rules
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && promotionRules && (
          <div className="space-y-4">
            <p>Minimum Overall Percentage: {promotionRules.min_overall_percentage}%</p>
            <p>Maximum Failed Subjects: {promotionRules.max_failed_subjects}</p>
            <p>Consider Attendance: {promotionRules.consider_attendance ? 'Yes' : 'No'}</p>
          </div>
        )}
        {!isLoading && !error && !promotionRules && (
          <div className="text-center py-4">No promotion rules configured.</div>
        )}
      </Card>

      <Card title="Class Capacity">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            icon={<Edit size={16} />}
            onClick={() => setShowClassCapacityModal(true)}
            disabled={isLoading}
          >
            Edit Capacity
          </Button>
        </div>
        {isLoading && <div className="text-center py-4">Loading...</div>}
        {!isLoading && !error && classCapacity && (
          <div className="space-y-4">
            <p>Maximum Students: {classCapacity.max_students}</p>
            <p>Minimum Students: {classCapacity.min_students}</p>
          </div>
        )}
        {!isLoading && !error && !classCapacity && (
          <div className="text-center py-4">No class capacity configured.</div>
        )}
      </Card>

      {showClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingClassId ? 'Edit Class' : 'Add Class'}</h3>
            <form onSubmit={handleSubmit(onSubmitClass)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Class Name</label>
                <input
                  type="text"
                  {...register('class_name', { required: 'Class name is required', maxLength: { value: 100, message: 'Name cannot exceed 100 characters' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.class_name && <p className="mt-1 text-sm text-red-600">{errors.class_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Capacity</label>
                <input
                  type="number"
                  {...register('class_max_capacity', { required: 'Max capacity is required', min: { value: 1, message: 'Capacity must be at least 1' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.class_max_capacity && <p className="mt-1 text-sm text-red-600">{errors.class_max_capacity.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowClassModal(false);
                    setEditingClassId(null);
                    reset({ class_name: '', class_max_capacity: 0 });
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingClassId ? 'Update Class' : 'Add Class'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingSectionId ? 'Edit Section' : 'Add Section'}</h3>
            <form onSubmit={handleSubmit(onSubmitSection)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Section Name</label>
                <input
                  type="text"
                  {...register('section_name', { required: 'Section name is required', maxLength: { value: 100, message: 'Name cannot exceed 100 characters' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.section_name && <p className="mt-1 text-sm text-red-600">{errors.section_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Capacity (Optional)</label>
                <input
                  type="number"
                  {...register('section_max_capacity', { min: { value: 1, message: 'Capacity must be at least 1' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.section_max_capacity && <p className="mt-1 text-sm text-red-600">{errors.section_max_capacity.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSectionModal(false);
                    setEditingSectionId(null);
                    setCurrentClassId(null);
                    reset({ section_name: '', section_max_capacity: null });
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingSectionId ? 'Update Section' : 'Add Section'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingSubjectId ? 'Edit Subject' : 'Add Subject'}</h3>
            <form onSubmit={handleSubmit(onSubmitSubject)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject Name</label>
                <input
                  type="text"
                  {...register('subject_name', { required: 'Subject name is required', maxLength: { value: 100, message: 'Name cannot exceed 100 characters' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.subject_name && <p className="mt-1 text-sm text-red-600">{errors.subject_name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject Code</label>
                <input
                  type="text"
                  {...register('subject_code', { required: 'Subject code is required', maxLength: { value: 20, message: 'Code cannot exceed 20 characters' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.subject_code && <p className="mt-1 text-sm text-red-600">{errors.subject_code.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject Type</label>
                <select
                  {...register('subject_type', { required: 'Subject type is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  <option value="core">Core</option>
                  <option value="elective">Elective</option>
                </select>
                {errors.subject_type && <p className="mt-1 text-sm text-red-600">{errors.subject_type.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Classes</label>
                <select
                  multiple
                  {...register('subject_class_ids')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
                {errors.subject_class_ids && <p className="mt-1 text-sm text-red-600">{errors.subject_class_ids.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSubjectModal(false);
                    setEditingSubjectId(null);
                    reset({ subject_name: '', subject_code: '', subject_type: 'core', subject_class_ids: [] });
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingSubjectId ? 'Update Subject' : 'Add Subject'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGradingScaleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editingScaleId ? 'Edit Grading Scale' : 'Add Grading Scale'}</h3>
            <form onSubmit={handleSubmit(onSubmitGradingScale)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Grade</label>
                <input
                  type="text"
                  {...register('grading_scale_grade', { required: 'Grade is required', maxLength: { value: 10, message: 'Grade cannot exceed 10 characters' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.grading_scale_grade && <p className="mt-1 text-sm text-red-600">{errors.grading_scale_grade.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Score</label>
                <input
                  type="number"
                  {...register('grading_scale_min_score', { required: 'Min score is required', min: { value: 0, message: 'Min score cannot be negative' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.grading_scale_min_score && <p className="mt-1 text-sm text-red-600">{errors.grading_scale_min_score.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Score</label>
                <input
                  type="number"
                  {...register('grading_scale_max_score', { required: 'Max score is required', min: { value: 0, message: 'Max score cannot be negative' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.grading_scale_max_score && <p className="mt-1 text-sm text-red-600">{errors.grading_scale_max_score.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">GPA</label>
                <input
                  type="text"
                  {...register('grading_scale_gpa', { required: 'GPA is required', maxLength: { value: 10, message: 'GPA cannot exceed 10 characters' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.grading_scale_gpa && <p className="mt-1 text-sm text-red-600">{errors.grading_scale_gpa.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  {...register('grading_scale_description', { required: 'Description is required', maxLength: { value: 100, message: 'Description cannot exceed 100 characters' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.grading_scale_description && <p className="mt-1 text-sm text-red-600">{errors.grading_scale_description.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGradingScaleModal(false);
                    setEditingScaleId(null);
                    reset({ grading_scale_grade: '', grading_scale_min_score: 0, grading_scale_max_score: 0, grading_scale_gpa: '', grading_scale_description: '' });
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : editingScaleId ? 'Update Grading Scale' : 'Add Grading Scale'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPromotionRulesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Promotion Rules</h3>
            <form onSubmit={handleSubmit(onSubmitPromotionRules)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Overall Percentage (%)</label>
                <input
                  type="number"
                  {...register('promotion_rules_min_overall_percentage', { required: 'Required', min: { value: 0, message: 'Percentage cannot be negative' }, max: { value: 100, message: 'Percentage cannot exceed 100' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.promotion_rules_min_overall_percentage && <p className="mt-1 text-sm text-red-600">{errors.promotion_rules_min_overall_percentage.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Maximum Failed Subjects</label>
                <input
                  type="number"
                  {...register('promotion_rules_max_failed_subjects', { required: 'Required', min: { value: 0, message: 'Cannot be negative' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.promotion_rules_max_failed_subjects && <p className="mt-1 text-sm text-red-600">{errors.promotion_rules_max_failed_subjects.message}</p>}
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('promotion_rules_consider_attendance')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Consider Attendance</span>
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowPromotionRulesModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClassCapacityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Class Capacity</h3>
            <form onSubmit={handleSubmit(onSubmitClassCapacity)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Maximum Students</label>
                <input
                  type="number"
                  {...register('class_capacity_max_students', { required: 'Required', min: { value: 1, message: 'Must be at least 1' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.class_capacity_max_students && <p className="mt-1 text-sm text-red-600">{errors.class_capacity_max_students.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Minimum Students</label>
                <input
                  type="number"
                  {...register('class_capacity_min_students', { required: 'Required', min: { value: 0, message: 'Cannot be negative' } })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
                {errors.class_capacity_min_students && <p className="mt-1 text-sm text-red-600">{errors.class_capacity_min_students.message}</p>}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowClassCapacityModal(false);
                    reset({ class_capacity_max_students: 0, class_capacity_min_students: 0 });
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicSettings;