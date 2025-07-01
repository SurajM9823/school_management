import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import api from '../../../api';

// Print styles
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .printable-area, .printable-area * {
      visibility: visible;
    }
    .printable-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    .no-print {
      display: none !important;
    }
    .page-break {
      page-break-before: always;
    }
    table {
      font-size: 12px;
      border-collapse: collapse;
      width: 100%;
    }
    th, td {
      padding: 4px 6px !important;
      border: 1px solid #ddd;
    }
    th {
      background-color: #f0f4f8 !important;
      color: #1a365d !important;
    }
    .print-header {
      margin-bottom: 20px;
    }
    .signature-area {
      margin-top: 30px;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120px;
      opacity: 0.05;
      z-index: -1;
      color: #000;
    }
    .student-photo {
      border: 1px solid #ddd;
      padding: 3px;
    }
    .grade-box {
      border: 1px solid #ddd;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: bold;
    }
  }
`;

const ViewMarksheet: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<{ id: number; name: string }[]>([]);
  const [terms, setTerms] = useState<{ id: number; name: string }[]>([]);
  const [exams, setExams] = useState<{ id: number; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: number; name: string }[]>([]);
  const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'marks' | 'grades'>('marks');
  const [marksheetType, setMarksheetType] = useState<'class' | 'individual'>('class');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [examData, setExamData] = useState<any>(null);
  const [marksheetData, setMarksheetData] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [gradingScales, setGradingScales] = useState<any[]>([]);
  const [gradingSettings, setGradingSettings] = useState<any>(null);

  // Set default grading scales on component mount
  useEffect(() => {
    // Set default values based on GradingSettings model
    setGradingSettings({
      grading_type: 'percentage',
      default_passing_grade: '40'
    });
    
    // Set default grading scales
    setGradingScales([
      { grade: 'A+', min_score: 90, max_score: 100, gpa: '4.0' },
      { grade: 'A', min_score: 80, max_score: 89, gpa: '3.7' },
      { grade: 'B+', min_score: 70, max_score: 79, gpa: '3.3' },
      { grade: 'B', min_score: 60, max_score: 69, gpa: '3.0' },
      { grade: 'C+', min_score: 50, max_score: 59, gpa: '2.7' },
      { grade: 'C', min_score: 40, max_score: 49, gpa: '2.0' },
      { grade: 'F', min_score: 0, max_score: 39, gpa: '0.0' }
    ]);
  }, []);
  
  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const sessionResponse = await api.get('/school/settings/sessions/', { params: { status: 'active' } });
        const sessionsData = Array.isArray(sessionResponse.data) ? sessionResponse.data : [];
        setSessions(sessionsData);
        
        // Set active session by default
        const activeSession = sessionsData.find(s => s.status === 'active');
        if (activeSession) {
          setSelectedSession(activeSession.id);
        }
        
        // Fetch school info
        const schoolResponse = await api.get('/school/settings/');
        console.log('School info loaded:', schoolResponse.data);
        setSchoolInfo(schoolResponse.data);
      } catch (err) {
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch terms when session is selected
  useEffect(() => {
    const fetchTerms = async () => {
      if (!selectedSession) {
        setTerms([]);
        setExams([]);
        setSelectedTerm(null);
        setSelectedExam(null);
        return;
      }
      try {
        const termResponse = await api.get(`/school/settings/sessions/${selectedSession}/terms/`, { params: { is_active: true } });
        setTerms(Array.isArray(termResponse.data) ? termResponse.data : []);
      } catch (err) {
        console.error('Failed to fetch terms:', err);
      }
    };
    fetchTerms();
  }, [selectedSession]);

  // Fetch exams when term is selected
  useEffect(() => {
    const fetchExams = async () => {
      if (!selectedTerm) {
        setExams([]);
        setSelectedExam(null);
        return;
      }
      try {
        const examResponse = await api.get('/school/exams/', { params: { term_id: selectedTerm } });
        const filteredExams = Array.isArray(examResponse.data) 
          ? examResponse.data.filter(exam => exam.status === 'results_published' || exam.status === 'completed')
          : [];
        setExams(filteredExams);
      } catch (err) {
        console.error('Failed to fetch exams:', err);
      }
    };
    fetchExams();
  }, [selectedTerm]);

  // Fetch classes when exam is selected
  useEffect(() => {
    if (selectedExam) {
      const fetchExamDetails = async () => {
        try {
          setLoading(true);
          const examResponse = await api.get(`/school/exams/${selectedExam}/`);
          const examDataResponse = examResponse.data;
          
          // Fetch all subjects to get proper names
          const subjectsResponse = await api.get('/school/settings/subjects/', { params: { is_active: true } });
          const subjectsData = Array.isArray(subjectsResponse.data) ? subjectsResponse.data : [];
          setAllSubjects(subjectsData);
          
          // Map exam subjects with proper names
          if (examDataResponse.subjects && Array.isArray(examDataResponse.subjects)) {
            examDataResponse.subjects = examDataResponse.subjects.map((examSubject: any) => {
              const subjectInfo = subjectsData.find(s => s.id === examSubject.subject_id);
              return {
                ...examSubject,
                subject: subjectInfo || { id: examSubject.subject_id, name: `Subject ${examSubject.subject_id}` }
              };
            });
          }
          
          setExamData(examDataResponse);
          
          // Set classes from exam data
          if (examDataResponse.classes && Array.isArray(examDataResponse.classes)) {
            setClasses(examDataResponse.classes);
          } else {
            setClasses([]);
          }
        } catch (err) {
          console.error('Error fetching exam details:', err);
          setError('Failed to load exam details');
        } finally {
          setLoading(false);
        }
      };
      fetchExamDetails();
    }
  }, [selectedExam]);

  // Fetch sections when class is selected
  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedClass) {
        setSections([]);
        setSelectedSection(null);
        return;
      }
      try {
        const sectionResponse = await api.get(`/school/settings/classes/${selectedClass}/sections/`);
        setSections(Array.isArray(sectionResponse.data) ? sectionResponse.data : []);
      } catch (err) {
        console.error('Failed to fetch sections:', err);
      }
    };
    fetchSections();
  }, [selectedClass]);

  // Fetch students and scores when section is selected
  useEffect(() => {
    const fetchMarksheetData = async () => {
      if (!selectedExam || !selectedSection || !examData) {
        setStudents([]);
        setMarksheetData([]);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch students
        const studentsResponse = await api.get(`/students/?section_id=${selectedSection}`);
        const studentsData = Array.isArray(studentsResponse.data) ? studentsResponse.data : [];
        setStudents(studentsData);
        
        // Fetch scores for all subjects
        const marksheetPromises = studentsData.map(async (student: any) => {
          const studentScores: any = { student };
          let totalMarks = 0;
          let totalMaxMarks = 0;
          
          for (const subject of examData.subjects) {
            try {
              const scoresResponse = await api.get('/school/scores/', {
                params: {
                  exam_id: selectedExam,
                  subject_id: subject.subject_id,
                  section_id: selectedSection
                }
              });
              
              const studentScore = scoresResponse.data.find((s: any) => s.student_id === student.id);
              const marks = studentScore?.marks_obtained;
              
              if (marks === null || marks === undefined) {
                studentScores[subject.subject_id] = 'AB'; // Absent
                studentScores[`${subject.subject_id}_isAbsent`] = true;
              } else {
                studentScores[subject.subject_id] = marks;
                totalMarks += marks;
              }
              totalMaxMarks += subject.max_marks;
            } catch (err) {
              studentScores[subject.subject_id] = 'AB'; // Absent
              studentScores[`${subject.subject_id}_isAbsent`] = true;
              totalMaxMarks += subject.max_marks;
            }
          }
          
          studentScores.totalMarks = totalMarks;
          studentScores.totalMaxMarks = totalMaxMarks;
          studentScores.percentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(2) : '0.00';
          
          // Check if student has any absent subjects
          const hasAbsentSubjects = examData.subjects.some((subject: any) => 
            studentScores[`${subject.subject_id}_isAbsent`]
          );
          studentScores.hasAbsentSubjects = hasAbsentSubjects;
          
          return studentScores;
        });
        
        const marksheetResults = await Promise.all(marksheetPromises);
        
        // Sort by total marks for ranking
        const sortedResults = marksheetResults.sort((a, b) => b.totalMarks - a.totalMarks);
        
        // Add ranking
        sortedResults.forEach((student, index) => {
          student.rank = index + 1;
        });
        
        setMarksheetData(sortedResults);
        
      } catch (err) {
        console.error('Failed to fetch marksheet data:', err);
        setError('Failed to load marksheet data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMarksheetData();
  }, [selectedExam, selectedSection, examData]);

  // Helper function to convert marks to grades
  const getGradeFromMarks = (marks: number | string, maxMarks: number): string => {
    if (marks === 'AB') return 'AB';
    if (marks === null || marks === undefined) return 'NG';
    
    const numericMarks = typeof marks === 'string' ? parseFloat(marks) : marks;
    if (isNaN(numericMarks)) return 'NG';
    
    // Calculate percentage
    const percentage = (numericMarks / maxMarks) * 100;
    
    // If percentage is below the passing grade, return NG
    if (percentage < 40) {
      return 'NG';
    }
    
    // Find matching grade scale
    const gradeScale = gradingScales.find(scale => 
      percentage >= scale.min_score && percentage <= scale.max_score
    );
    
    return gradeScale ? gradeScale.grade : 'NG';
  };
  
  // Helper function to calculate CGPA from percentage
  const calculateCGPA = (percentage: number): number => {
    if (percentage >= 90) return 4.0;
    if (percentage >= 80) return 3.7;
    if (percentage >= 70) return 3.3;
    if (percentage >= 60) return 3.0;
    if (percentage >= 50) return 2.7;
    if (percentage >= 40) return 2.0;
    return 0.0;
  };
  
  // Helper function to get grade point from grade
  const getGradePoint = (grade: string): number => {
    const gradeMap: {[key: string]: number} = {
      'A+': 4.0,
      'A': 3.7,
      'B+': 3.3,
      'B': 3.0,
      'C+': 2.7,
      'C': 2.0,
      'F': 0.0,
      'NG': 0.0,
      'AB': 0.0
    };
    return gradeMap[grade] || 0.0;
  };
  
  // Helper function to get remarks based on percentage
  const getRemarks = (percentage: number): string => {
    if (percentage >= 90) return 'Outstanding';
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 70) return 'Very Good';
    if (percentage >= 60) return 'Good';
    if (percentage >= 50) return 'Satisfactory';
    if (percentage >= 40) return 'Pass';
    return 'Needs Improvement';
  };
  
  const handlePrint = () => {
    window.print();
  };

  // Chunk students into pages of 20
  const chunkStudents = (students: any[], chunkSize: number = 20) => {
    const chunks = [];
    for (let i = 0; i < students.length; i += chunkSize) {
      chunks.push(students.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const studentPages = marksheetData.length > 0 ? chunkStudents(marksheetData, 20) : [];

  return (
    <>
      <style>{printStyles}</style>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">View Marksheet</h1>
          <Button
            variant="outline"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate('/admin/exams')}
          >
            Back to Exams
          </Button>
        </div>

        <Card title="Marksheet Filters">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Academic Session</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={selectedSession?.toString() || ''}
                  onChange={(e) => setSelectedSession(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Select Session</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Term</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={selectedTerm?.toString() || ''}
                  onChange={(e) => setSelectedTerm(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={!selectedSession}
                >
                  <option value="">Select Term</option>
                  {terms.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Exam</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={selectedExam?.toString() || ''}
                  onChange={(e) => setSelectedExam(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={!selectedTerm}
                >
                  <option value="">Select Exam</option>
                  {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Class</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={selectedClass?.toString() || ''}
                  onChange={(e) => setSelectedClass(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={!selectedExam}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Section</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={selectedSection?.toString() || ''}
                  onChange={(e) => setSelectedSection(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={!selectedClass}
                >
                  <option value="">Select Section</option>
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">View Mode</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'marks' | 'grades')}
                >
                  <option value="marks">Raw Marks</option>
                  <option value="grades">Grades</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Marksheet Type</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={marksheetType}
                  onChange={(e) => setMarksheetType(e.target.value as 'class' | 'individual')}
                >
                  <option value="class">Class Marksheet</option>
                  <option value="individual">Individual Report Card</option>
                </select>
              </div>
            </div>
            {selectedSection && marksheetData.length > 0 && (
              <div className="mt-4">
                <Button
                  variant="primary"
                  icon={<Printer size={16} />}
                  onClick={handlePrint}
                >
                  Print Marksheet
                </Button>
              </div>
            )}
          </div>
        </Card>

        {loading && <p className="text-center text-gray-500">Loading...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {selectedSection && marksheetData.length > 0 && (
          <div className="printable-area bg-white shadow-xl rounded-lg overflow-hidden">
            {marksheetType === 'class' ? (
              <>
                <div className="watermark">{schoolInfo?.name || 'SCHOOL'}</div>
                {schoolInfo && (
                  <div className="bg-blue-50 p-6 border-b border-blue-200">
                    <div className="flex items-center justify-center space-x-4">
                      {schoolInfo.logo && (
                        <img 
                          src={schoolInfo.logo.startsWith('http') ? schoolInfo.logo : 'http://localhost:8000' + schoolInfo.logo} 
                          alt="School Logo" 
                          className="w-16 h-16 object-contain"
                          onError={(e) => {
                            console.error('Logo failed to load:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-blue-900">{schoolInfo.name || 'School Name'}</h1>
                        <p className="text-blue-700">{schoolInfo.address || 'School Address'}</p>
                        <p className="text-blue-600">
                          {schoolInfo.phone && `Phone: ${schoolInfo.phone}`}
                          {schoolInfo.email && ` | Email: ${schoolInfo.email}`}
                        </p>
                      </div>
                      {schoolInfo.logo && (
                        <div className="w-16 h-16">
                          {/* Empty div for layout balance */}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-300 text-center">
                      <h2 className="text-xl font-semibold text-blue-800">EXAMINATION MARKSHEET</h2>
                    </div>
                  </div>
                )}
                
                <div className="p-6 bg-gray-50 border-b">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Examination: {exams.find(e => e.id === selectedExam)?.name}</h3>
                      <p className="text-gray-600">Class: {classes.find(c => c.id === selectedClass)?.name} | Section: {sections.find(s => s.id === selectedSection)?.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Students: {marksheetData.length}</p>
                      <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                {studentPages.map((pageStudents, pageIndex) => (
                  <div key={pageIndex} className={`${pageIndex > 0 ? 'page-break' : ''} p-6`}>
                    {pageIndex > 0 && (
                      <div className="print-header mb-4">
                        <div className="text-center border-b pb-2">
                          <h3 className="text-lg font-semibold">{schoolInfo?.name} - {exams.find(e => e.id === selectedExam)?.name}</h3>
                          <p className="text-sm text-gray-600">Class {classes.find(c => c.id === selectedClass)?.name} - Section {sections.find(s => s.id === selectedSection)?.name} (Page {pageIndex + 1})</p>
                        </div>
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">S.No.</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Student Name</th>
                            <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Roll No.</th>
                            {examData?.subjects?.map((subject: any) => (
                              <th key={subject.subject_id} className="border border-gray-300 px-3 py-2 text-center font-semibold">
                                {subject.subject?.name || allSubjects.find(s => s.id === subject.subject_id)?.name || 'Subject'}
                                <br />
                                <span className="text-xs text-gray-500">({subject.max_marks})</span>
                              </th>
                            ))}
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                              {viewMode === 'grades' ? 'Overall Grade' : 'Total'}
                            </th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Percentage</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Rank</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageStudents.map((row: any, index: number) => (
                            <tr key={row.student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="border border-gray-300 px-4 py-2">{pageIndex * 20 + index + 1}</td>
                              <td className="border border-gray-300 px-4 py-2 font-medium">{row.student.user_name || 'N/A'}</td>
                              <td className="border border-gray-300 px-4 py-2">{row.student.admission_number || row.student.roll_number || 'N/A'}</td>
                              {examData?.subjects?.map((subject: any) => (
                                <td key={subject.subject_id} className="border border-gray-300 px-3 py-2 text-center">
                                  {row[subject.subject_id] === 'AB' ? (
                                    <span className="text-red-600 font-semibold">AB</span>
                                  ) : viewMode === 'grades' ? (
                                    <span className={`font-semibold ${
                                      row[subject.subject_id] >= (subject.passing_marks || subject.max_marks * 0.4) 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                    }`}>
                                      {getGradeFromMarks(row[subject.subject_id], subject.max_marks)}
                                    </span>
                                  ) : (
                                    row[subject.subject_id] || 0
                                  )}
                                </td>
                              ))}
                              <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                                {viewMode === 'grades' ? 
                                  <span className={parseFloat(row.percentage) >= 40 ? 'text-green-600' : 'text-red-600'}>
                                    {getGradeFromMarks(row.totalMarks, row.totalMaxMarks)}
                                  </span> : 
                                  `${row.totalMarks}/${row.totalMaxMarks}`}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                                {row.percentage}%
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                                {row.rank}
                              </td>
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  row.hasAbsentSubjects
                                    ? 'bg-orange-100 text-orange-800'
                                    : parseFloat(row.percentage) >= 40 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                }`}>
                                  {row.hasAbsentSubjects ? 'ABSENT' : parseFloat(row.percentage) >= 40 ? 'PASS' : 'FAIL'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                
                <div className={`${studentPages.length > 1 ? 'page-break' : ''} p-6`}>
                  <div className="print-header mb-4">
                    <div className="text-center border-b pb-2">
                      <h3 className="text-lg font-semibold">SUMMARY REPORT</h3>
                      <p className="text-sm text-gray-600">{schoolInfo?.name} - {exams.find(e => e.id === selectedExam)?.name}</p>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">SUBJECT-WISE SUMMARY</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-3 py-1 text-xs font-semibold">Subject</th>
                          <th className="border border-gray-300 px-3 py-1 text-xs font-semibold">Total Students</th>
                          <th className="border border-gray-300 px-3 py-1 text-xs font-semibold">Pass</th>
                          <th className="border border-gray-300 px-3 py-1 text-xs font-semibold">Fail</th>
                          <th className="border border-gray-300 px-3 py-1 text-xs font-semibold">Absent</th>
                          <th className="border border-gray-300 px-3 py-1 text-xs font-semibold">Pass %</th>
                          <th className="border border-gray-300 px-3 py-1 text-xs font-semibold">Highest</th>
                          <th className="border border-gray-300 px-3 py-1 text-xs font-semibold">Lowest</th>
                          <th className="border border-gray-300 px-3 py-1 text-xs font-semibold">Average</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examData?.subjects?.map((subject: any) => {
                          const subjectMarks = marksheetData.map(row => row[subject.subject_id]);
                          const absentCount = subjectMarks.filter(mark => mark === 'AB').length;
                          const validMarks = subjectMarks.filter(mark => mark !== 'AB').map(mark => Number(mark) || 0);
                          const passCount = validMarks.filter(mark => mark >= (subject.passing_marks || subject.max_marks * 0.4)).length;
                          const failCount = marksheetData.length - passCount - absentCount;
                          const highest = validMarks.length > 0 ? Math.max(...validMarks) : 0;
                          const lowest = validMarks.length > 0 ? Math.min(...validMarks) : 0;
                          const average = validMarks.length > 0 ? (validMarks.reduce((sum, mark) => sum + mark, 0) / validMarks.length).toFixed(1) : '0.0';
                          const passPercentage = marksheetData.length > 0 ? ((passCount / marksheetData.length) * 100).toFixed(1) : '0.0';
                          
                          return (
                            <tr key={subject.subject_id} className="text-xs">
                              <td className="border border-gray-300 px-3 py-1 font-medium">{subject.subject?.name || allSubjects.find(s => s.id === subject.subject_id)?.name || 'Subject'}</td>
                              <td className="border border-gray-300 px-3 py-1 text-center">{marksheetData.length}</td>
                              <td className="border border-gray-300 px-3 py-1 text-center text-green-600 font-semibold">{passCount}</td>
                              <td className="border border-gray-300 px-3 py-1 text-center text-red-600 font-semibold">{failCount}</td>
                              <td className="border border-gray-300 px-3 py-1 text-center text-orange-600 font-semibold">{absentCount}</td>
                              <td className="border border-gray-300 px-3 py-1 text-center">{passPercentage}%</td>
                              <td className="border border-gray-300 px-3 py-1 text-center font-semibold">{highest}</td>
                              <td className="border border-gray-300 px-3 py-1 text-center">{lowest}</td>
                              <td className="border border-gray-300 px-3 py-1 text-center">{average}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                    <div className="bg-blue-50 p-2 rounded border">
                      <div className="font-semibold text-blue-800">Total Students</div>
                      <div className="text-lg font-bold text-blue-900">{marksheetData.length}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded border">
                      <div className="font-semibold text-green-800">Overall Pass</div>
                      <div className="text-lg font-bold text-green-900">
                        {marksheetData.filter(row => parseFloat(row.percentage) >= 40 && !row.hasAbsentSubjects).length}
                      </div>
                    </div>
                    <div className="bg-red-50 p-2 rounded border">
                      <div className="font-semibold text-red-800">Overall Fail</div>
                      <div className="text-lg font-bold text-red-900">
                        {marksheetData.filter(row => parseFloat(row.percentage) < 40 && !row.hasAbsentSubjects).length}
                      </div>
                    </div>
                    <div className="bg-orange-50 p-2 rounded border">
                      <div className="font-semibold text-orange-800">Absent</div>
                      <div className="text-lg font-bold text-orange-900">
                        {marksheetData.filter(row => row.hasAbsentSubjects).length}
                      </div>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded border">
                      <div className="font-semibold text-yellow-800">Class Average</div>
                      <div className="text-lg font-bold text-yellow-900">
                        {(marksheetData.reduce((sum, row) => sum + parseFloat(row.percentage), 0) / marksheetData.length).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">CLASS PERFORMANCE METRICS</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="bg-indigo-50 p-3 rounded border">
                        <div className="font-semibold text-indigo-800">Class CGPA</div>
                        <div className="text-lg font-bold text-indigo-900">
                          {calculateCGPA(marksheetData.reduce((sum, row) => sum + parseFloat(row.percentage), 0) / marksheetData.length).toFixed(2)}
                        </div>
                        <div className="text-xs text-indigo-600 mt-1">Based on class average percentage</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded border">
                        <div className="font-semibold text-purple-800">Performance Distribution</div>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          <div>
                            <span className="text-xs">Outstanding (90%+):</span>
                            <span className="font-bold ml-1">
                              {marksheetData.filter(row => parseFloat(row.percentage) >= 90 && !row.hasAbsentSubjects).length}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs">Excellent (80%+):</span>
                            <span className="font-bold ml-1">
                              {marksheetData.filter(row => parseFloat(row.percentage) >= 80 && parseFloat(row.percentage) < 90 && !row.hasAbsentSubjects).length}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs">Very Good (70%+):</span>
                            <span className="font-bold ml-1">
                              {marksheetData.filter(row => parseFloat(row.percentage) >= 70 && parseFloat(row.percentage) < 80 && !row.hasAbsentSubjects).length}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs">Good (60%+):</span>
                            <span className="font-bold ml-1">
                              {marksheetData.filter(row => parseFloat(row.percentage) >= 60 && parseFloat(row.percentage) < 70 && !row.hasAbsentSubjects).length}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-teal-50 p-3 rounded border">
                        <div className="font-semibold text-teal-800">Top Performers</div>
                        <div className="mt-1">
                          {marksheetData.slice(0, 3).map((student, idx) => (
                            <div key={student.student.id} className="flex justify-between items-center text-xs py-1">
                              <span>{idx + 1}. {student.student.user_name}</span>
                              <span className="font-bold">{student.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-3 border-t">
                  <div className="text-center text-xs text-gray-600">
                    Generated on: {new Date().toLocaleString()} | This is a computer generated marksheet
                  </div>
                </div>
              </>
            ) : (
              <>
                {marksheetData.map((student, index) => (
                  <div key={student.student.id} className={index > 0 ? 'page-break' : ''} data-student-id={student.student.id}>
                    <div className="watermark">{schoolInfo?.name || 'SCHOOL'}</div>
                    <div className="bg-blue-50 p-6 border-b border-blue-200">
                      <div className="flex items-center justify-center space-x-4">
                        {schoolInfo?.logo && (
                          <img 
                            src={schoolInfo.logo.startsWith('http') ? schoolInfo.logo : 'http://localhost:8000' + schoolInfo.logo} 
                            alt="School Logo" 
                            className="w-16 h-16 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <div className="text-center">
                          <h1 className="text-2xl font-bold text-blue-900">{schoolInfo?.name || 'School Name'}</h1>
                          <p className="text-blue-700">{schoolInfo?.address || 'School Address'}</p>
                          <p className="text-blue-600">
                            {schoolInfo?.phone && `Phone: ${schoolInfo.phone}`}
                            {schoolInfo?.email && ` | Email: ${schoolInfo.email}`}
                          </p>
                        </div>
                        {schoolInfo?.logo && (
                          <div className="w-16 h-16"></div>
                        )}
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-300 text-center">
                        <h2 className="text-xl font-semibold text-blue-800">STUDENT REPORT CARD</h2>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-gray-50 border-b">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Student Information</h3>
                            <p className="text-gray-600">Name: <span className="font-medium">{student.student.user_name}</span></p>
                            <p className="text-gray-600">Roll No: <span className="font-medium">{student.student.roll_number || student.student.admission_number || 'N/A'}</span></p>
                            <p className="text-gray-600">Class: <span className="font-medium">{classes.find(c => c.id === selectedClass)?.name}</span></p>
                            <p className="text-gray-600">Section: <span className="font-medium">{sections.find(s => s.id === selectedSection)?.name}</span></p>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Examination Details</h3>
                            <p className="text-gray-600">Exam: <span className="font-medium">{exams.find(e => e.id === selectedExam)?.name}</span></p>
                            <p className="text-gray-600">Term: <span className="font-medium">{terms.find(t => t.id === selectedTerm)?.name}</span></p>
                            <p className="text-gray-600">Academic Year: <span className="font-medium">{sessions.find(s => s.id === selectedSession)?.name}</span></p>
                            <p className="text-gray-600">Date: <span className="font-medium">{new Date().toLocaleDateString()}</span></p>
                          </div>
                        </div>
                        <div className="flex justify-center items-center">
                          <div className="w-32 h-40 border-2 border-gray-300 student-photo flex items-center justify-center bg-gray-100">
                            <div className="text-gray-400 text-xs text-center">
                              Student Photo
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Academic Performance</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Subject</th>
                              <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Max Marks</th>
                              <th className="border border-gray-300 px-4 py-2 text-center font-semibold">
                                {viewMode === 'grades' ? 'Grade' : 'Marks Obtained'}
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {examData?.subjects?.map((subject: any) => {
                              const marks = student[subject.subject_id];
                              const isAbsent = marks === 'AB';
                              const isPassing = !isAbsent && (marks >= (subject.passing_marks || subject.max_marks * 0.4));
                              
                              return (
                                <tr key={subject.subject_id} className="bg-white">
                                  <td className="border border-gray-300 px-4 py-2 font-medium">
                                    {subject.subject?.name || allSubjects.find(s => s.id === subject.subject_id)?.name || 'Subject'}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-center">{subject.max_marks}</td>
                                  <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                                    {isAbsent ? (
                                      <span className="text-red-600">AB</span>
                                    ) : viewMode === 'grades' ? (
                                      <span className={isPassing ? 'text-green-600' : 'text-red-600'}>
                                        {getGradeFromMarks(marks, subject.max_marks)}
                                      </span>
                                    ) : (
                                      <span className={isPassing ? 'text-green-600' : 'text-red-600'}>
                                        {marks}
                                      </span>
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2 text-center">
                                    {isAbsent ? 'Absent' : isPassing ? 'Pass' : 'Needs Improvement'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-semibold">Total</td>
                              <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{student.totalMaxMarks}</td>
                              <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                                {viewMode === 'grades' ? (
                                  <span className={parseFloat(student.percentage) >= 40 ? 'text-green-600' : 'text-red-600'}>
                                    {getGradeFromMarks(student.totalMarks, student.totalMaxMarks)}
                                  </span>
                                ) : (
                                  <span>{student.totalMarks}</span>
                                )}
                              </td>
                              <td className="border border-gray-300 px-4 py-2"></td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-semibold">Percentage</td>
                              <td className="border border-gray-300 px-4 py-2"></td>
                              <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                                {student.percentage}%
                              </td>
                              <td className="border border-gray-300 px-4 py-2"></td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-semibold">CGPA</td>
                              <td className="border border-gray-300 px-4 py-2"></td>
                              <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                                {calculateCGPA(parseFloat(student.percentage)).toFixed(1)}
                              </td>
                              <td className="border border-gray-300 px-4 py-2"></td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-semibold">Rank</td>
                              <td className="border border-gray-300 px-4 py-2"></td>
                              <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                                {student.rank} out of {marksheetData.length}
                              </td>
                              <td className="border border-gray-300 px-4 py-2"></td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-semibold">Result</td>
                              <td className="border border-gray-300 px-4 py-2"></td>
                              <td className="border border-gray-300 px-4 py-2 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  student.hasAbsentSubjects
                                    ? 'bg-orange-100 text-orange-800'
                                    : parseFloat(student.percentage) >= 40 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                }`}>
                                  {student.hasAbsentSubjects ? 'ABSENT' : parseFloat(student.percentage) >= 40 ? 'PASS' : 'FAIL'}
                                </span>
                              </td>
                              <td className="border border-gray-300 px-4 py-2"></td>
                            </tr>
                            <tr>
                              <td className="border border-gray-300 px-4 py-2 font-semibold">Remarks</td>
                              <td className="border border-gray-300 px-4 py-2" colSpan={3}>
                                <div className="text-center italic">
                                  {student.hasAbsentSubjects ? 'Student was absent in one or more subjects' : 
                                   getRemarks(parseFloat(student.percentage))}
                                </div>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                    
                    <div className="p-6 border-t">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">ATTENDANCE RECORD</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">Total Working Days: <span className="font-medium">90</span></p>
                              <p className="text-gray-600">Present: <span className="font-medium">85</span></p>
                            </div>
                            <div>
                              <p className="text-gray-600">Absent: <span className="font-medium">5</span></p>
                              <p className="text-gray-600">Attendance %: <span className="font-medium">94.4%</span></p>
                            </div>
                          </div>
                        </div>
                        <div className="border rounded-md p-3">
                          <h4 className="text-sm font-semibold text-gray-800 mb-2">CONDUCT & CHARACTER</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">Discipline: <span className="font-medium">Excellent</span></p>
                              <p className="text-gray-600">Punctuality: <span className="font-medium">Very Good</span></p>
                            </div>
                            <div>
                              <p className="text-gray-600">Behavior: <span className="font-medium">Excellent</span></p>
                              <p className="text-gray-600">Participation: <span className="font-medium">Good</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 mt-4">
                      <div className="grid grid-cols-3 gap-4 mt-8">
                        <div className="text-center">
                          <div className="border-t border-gray-400 pt-2">
                            <p className="font-semibold">Class Teacher</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="border-t border-gray-400 pt-2">
                            <p className="font-semibold">Examination Controller</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="border-t border-gray-400 pt-2">
                            <p className="font-semibold">Principal</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 px-6 py-3 border-t">
                      <div className="text-center text-xs text-gray-600">
                        Generated on: {new Date().toLocaleString()} | This is a computer generated report card
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ViewMarksheet;