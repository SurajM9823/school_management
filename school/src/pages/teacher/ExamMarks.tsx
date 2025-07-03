import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Save, ChevronDown } from 'lucide-react';
import api from '../../api';

interface Student {
  id: number;
  name: string;
  admission_number: string;
  section?: number | null;
}

interface Subject {
  id: number;
  subject_id: number;
  subject_name: string;
  date: string;
  max_marks: number;
  passing_marks: number;
}

interface Exam {
  exam_id: number;
  exam_name: string;
  subjects: Subject[];
}

interface ClassItem {
  class_id: number;
  class_name: string;
  exams: Exam[];
}

const ExamMarks: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<{ [studentId: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch teacher's assigned classes/exams/subjects
  useEffect(() => {
    api.get('/teacher/exam-marks/classes/').then(res => {
      setClasses(res.data);
      if (res.data.length > 0) {
        setSelectedClassId(res.data[0].class_id);
      }
    });
  }, []);

  // When class changes, update exams
  useEffect(() => {
    const cls = classes.find(c => c.class_id === selectedClassId);
    setExams(cls ? cls.exams : []);
    setSelectedExamId(null);
    setSubjects([]);
    setSelectedSubjectId(null);
    setStudents([]);
    setMarks({});
  }, [selectedClassId, classes]);

  // When exam changes, update subjects
  useEffect(() => {
    const ex = exams.find(e => e.exam_id === selectedExamId);
    setSubjects(ex ? ex.subjects : []);
    setSelectedSubjectId(null);
    setStudents([]);
    setMarks({});
  }, [selectedExamId, exams]);

  // When subject or section changes, fetch students and marks
  useEffect(() => {
    if (selectedClassId && selectedExamId && selectedSubjectId) {
      api.get(`/teacher/exam-marks/classes/${selectedClassId}/students/`).then(res => {
        setStudents(res.data);
        const uniqueSections: { id: number; name: string }[] = [];
        const sectionMap: { [id: number]: string } = {};
        res.data.forEach((student: Student) => {
          if (student.section && !sectionMap[student.section]) {
            sectionMap[student.section] = `Section ${student.section}`;
            uniqueSections.push({ id: student.section, name: `Section ${student.section}` });
          }
        });
        setSections(uniqueSections);
        setSelectedSectionId(uniqueSections.length === 1 ? uniqueSections[0].id : null);

        // Initialize marks as empty first
        const initialMarks: { [studentId: number]: string } = {};
        res.data.forEach((student: Student) => {
          initialMarks[student.id] = '';
        });
        setMarks(initialMarks);

        // If section is auto-selected, fetch marks now
        const sectionToFetch = uniqueSections.length === 1 ? uniqueSections[0].id : selectedSectionId;
        if (sectionToFetch) {
          api.get('/teacher/exam-marks/get-marks/', {
            params: {
              exam_id: selectedExamId,
              subject_id: selectedSubjectId,
              section_id: sectionToFetch,
            }
          }).then(marksRes => {
            const marksMap: { [studentId: number]: string } = { ...initialMarks };
            marksRes.data.forEach((item: { student_id: number, marks_obtained: string }) => {
              marksMap[item.student_id] = item.marks_obtained ?? '';
            });
            setMarks(marksMap);
          });
        }
      });
    } else {
      setStudents([]);
      setMarks({});
      setSections([]);
      setSelectedSectionId(null);
    }
    // eslint-disable-next-line
  }, [selectedClassId, selectedExamId, selectedSubjectId]);

  // When section changes, fetch marks for that section
  useEffect(() => {
    if (
      selectedClassId &&
      selectedExamId &&
      selectedSubjectId &&
      selectedSectionId
    ) {
      api.get('/teacher/exam-marks/get-marks/', {
        params: {
          exam_id: selectedExamId,
          subject_id: selectedSubjectId,
          section_id: selectedSectionId,
        }
      }).then(marksRes => {
        const marksMap: { [studentId: number]: string } = { ...marks };
        marksRes.data.forEach((item: { student_id: number, marks_obtained: string }) => {
          marksMap[item.student_id] = item.marks_obtained ?? '';
        });
        setMarks(marksMap);
      });
    }
    // eslint-disable-next-line
  }, [selectedSectionId]);

  const handleMarkChange = (studentId: number, value: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: value,
    }));
  };

  const handleConfirmSave = () => {
    if (!selectedClassId || !selectedExamId || !selectedSubjectId) return;
    if (sections.length > 1 && !selectedSectionId) {
      alert('Please select a section.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const scores = students
          .filter(s => !sections.length || !selectedSectionId || s.section === selectedSectionId)
          .map(s => ({
            student: { id: s.id },
            marks_obtained: marks[s.id],
          }));

      await api.post('/school/scores/', {
        exam_id: selectedExamId,
        subject_id: selectedSubjectId,
        section_id: selectedSectionId,
        scores,
      });
      setShowSuccessModal(true);
    } catch (e) {
      alert('Failed to save marks');
    }
    setLoading(false);
  };

  return (
      <div className="container mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800">Enter Exam Marks</h1>

        {/* Selectors Card */}
        <Card className="shadow-lg">
          <div className="space-y-6 p-6">
            {/* Class Selector */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <div className="relative">
                <select
                    value={selectedClassId ?? ''}
                    onChange={e => setSelectedClassId(Number(e.target.value))}
                    className="appearance-none w-full p-3 pl-4 pr-10 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 hover:border-gray-400 cursor-pointer"
                >
                  <option value="" disabled>-- Select a Class --</option>
                  {classes.map(c => (
                      <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
              </div>
            </div>

            {/* Exam Selector */}
            {exams.length > 0 && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Exam</label>
                  <div className="relative">
                    <select
                        value={selectedExamId ?? ''}
                        onChange={e => setSelectedExamId(Number(e.target.value))}
                        className="appearance-none w-full p-3 pl-4 pr-10 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 hover:border-gray-400 cursor-pointer"
                    >
                      <option value="" disabled>-- Select an Exam --</option>
                      {exams.map(exam => (
                          <option key={exam.exam_id} value={exam.exam_id}>{exam.exam_name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                  </div>
                </div>
            )}

            {/* Subject Selector */}
            {subjects.length > 0 && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
                  <div className="relative">
                    <select
                        value={selectedSubjectId ?? ''}
                        onChange={e => setSelectedSubjectId(Number(e.target.value))}
                        className="appearance-none w-full p-3 pl-4 pr-10 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 hover:border-gray-400 cursor-pointer"
                    >
                      <option value="" disabled>-- Select a Subject --</option>
                      {subjects.map(subject => (
                          <option key={subject.id} value={subject.subject_id}>{subject.subject_name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                  </div>
                </div>
            )}

            {/* Section Selector */}
            {sections.length > 1 && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Section</label>
                  <div className="relative">
                    <select
                        value={selectedSectionId ?? ''}
                        onChange={e => setSelectedSectionId(Number(e.target.value))}
                        className="appearance-none w-full p-3 pl-4 pr-10 border border-gray-300 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 hover:border-gray-400 cursor-pointer"
                    >
                      <option value="" disabled>-- Select a Section --</option>
                      {sections.map(section => (
                          <option key={section.id} value={section.id}>{section.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                  </div>
                </div>
            )}
          </div>
        </Card>

        {/* Marks Entry Table */}
        {students.length > 0 && selectedSubjectId && (
            <Card title="Enter Marks" className="shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Student Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Marks</th>
                  </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {students
                      .filter(s => !sections.length || !selectedSectionId || s.section === selectedSectionId)
                      .map(student => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.admission_number}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{student.name}</td>
                            <td className="px-6 py-4">
                              <input
                                  type="number"
                                  value={marks[student.id] || ''}
                                  onChange={e => handleMarkChange(student.id, e.target.value)}
                                  className="w-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                  placeholder="Enter marks"
                              />
                            </td>
                          </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                    variant="primary"
                    icon={<Save size={16} />}
                    onClick={handleConfirmSave}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  {loading ? 'Saving...' : 'Save Marks'}
                </Button>
              </div>
            </Card>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all duration-300 scale-95 animate-in">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Save</h2>
                <p className="text-gray-600 mb-6">Are you sure you want to save the entered marks? This action cannot be undone.</p>
                <div className="flex justify-end space-x-3">
                  <Button
                      variant="secondary"
                      onClick={() => setShowConfirmModal(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                      variant="primary"
                      onClick={handleSave}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all duration-300 scale-95 animate-in">
                <h2 className="text-xl font-semibold text-green-600 mb-4">Success!</h2>
                <p className="text-gray-600 mb-6">Marks have been saved successfully.</p>
                <div className="flex justify-end">
                  <Button
                      variant="primary"
                      onClick={() => setShowSuccessModal(false)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default ExamMarks;

