import React, { useState } from 'react';
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
  ClipboardEdit, // For Manage Scores
  Save, // For saving scores
  User, // For student list
  X, // For closing modal
  Printer, // For Marksheet/Print
  Award as AwardIcon // For Rankings (using Award as a placeholder)
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { format } from 'date-fns';

// Mock data for exams
const initialExams = [
  {
    id: 1,
    name: 'Mid-Term Examination - Class 10',
    classLevel: '10',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'English'],
    startDate: '2024-09-15',
    endDate: '2024-09-22',
    status: 'scheduled' as Exam['status'], // scheduled, ongoing, completed, results_published
    totalMarks: 400,
    passingMarks: 160,
  },
  {
    id: 2,
    name: 'Annual Examination - Class 9',
    classLevel: '9',
    subjects: ['English', 'History', 'Geography', 'Science'],
    startDate: '2025-03-01',
    endDate: '2025-03-10',
    status: 'scheduled' as Exam['status'],
    totalMarks: 400,
    passingMarks: 160,
  },
  {
    id: 3,
    name: 'Unit Test 1 - Class 11 (Science)',
    classLevel: '11',
    subjects: ['Physics', 'Chemistry'],
    startDate: '2024-07-20',
    endDate: '2024-07-20',
    status: 'results_published' as Exam['status'],
    totalMarks: 100,
    passingMarks: 40,
  },
];

// Mock data for available subjects (can be fetched or shared)
const availableSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science', 'Physical Education', 'Art', 'Music', 'Drama', 'Science'];
const availableClassLevels = Array.from({ length: 12 }, (_, i) => String(i + 1)).concat(['Kindergarten', 'Nursery']);


interface ExamSubjectDetail {
  subjectName: string;
  date: string;
  time: string;
  maxMarks: number;
  passingMarks: number;
}
interface Exam {
  id: number;
  name: string;
  classLevel: string; // e.g., "10", "11", "All"
  subjects: string[]; // Simplified for list view
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'results_published' | 'cancelled';
  totalMarks?: number; // Optional overall total marks
  passingMarks?: number; // Optional overall passing marks
  detailedSubjects?: ExamSubjectDetail[]; // For form and detailed view
  scores?: StudentScore[]; // To hold scores for this exam
}

interface Student {
  id: string;
  name: string;
  classLevel: string; // To filter students for an exam
  rollNumber?: string;
}

interface StudentScore {
  studentId: string;
  studentName: string; // For display convenience
  subjectName: string;
  marksObtained?: number; // Optional if not yet entered
  maxMarks: number; // From ExamSubjectDetail
  passingMarks: number; // From ExamSubjectDetail
}

// Mock Student Data (ideally fetched or from a shared context)
const mockStudents: Student[] = [
  { id: 'S1001', name: 'Alice Smith', classLevel: '10', rollNumber: '10A-01' },
  { id: 'S1002', name: 'Bob Johnson', classLevel: '10', rollNumber: '10A-02' },
  { id: 'S1003', name: 'Charlie Brown', classLevel: '10', rollNumber: '10A-03' },
  { id: 'S0901', name: 'Diana Prince', classLevel: '9', rollNumber: '9B-01' },
  { id: 'S0902', name: 'Edward Nigma', classLevel: '9', rollNumber: '9B-02' },
  { id: 'S1101', name: 'Fiona Gallagher', classLevel: '11', rollNumber: '11S-01' },
  { id: 'S1102', name: 'George Costanza', classLevel: '11', rollNumber: '11S-02' },
];


const Exams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>(initialExams.map(ex => ({...ex, scores: []}))); // Initialize scores array
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [showNewExamForm, setShowNewExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // State for Score Entry Modal
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedExamForScores, setSelectedExamForScores] = useState<Exam | null>(null);
  const [selectedSubjectForScores, setSelectedSubjectForScores] = useState<ExamSubjectDetail | null>(null); // For single subject score entry
  const [currentStudentScores, setCurrentStudentScores] = useState<StudentScore[]>([]);

  // State for Marksheet View Modal
  const [showMarksheetModal, setShowMarksheetModal] = useState(false);
  const [selectedStudentForMarksheet, setSelectedStudentForMarksheet] = useState<Student | null>(null);
  const [selectedExamForMarksheet, setSelectedExamForMarksheet] = useState<Exam | null>(null);

  // State for Rankings View Modal
  const [showRankingsModal, setShowRankingsModal] = useState(false);
  const [selectedExamForRankings, setSelectedExamForRankings] = useState<Exam | null>(null);
  const [rankedStudents, setRankedStudents] = useState<Array<Student & { totalMarksObtained: number; totalMaxMarks: number; percentage: number; rank: number }>>([]);


  const [newExam, setNewExam] = useState<Omit<Exam, 'id' | 'subjects' | 'scores'> & { subjects: string[], detailedSubjects: ExamSubjectDetail[] }>({
    name: '',
    classLevel: '10',
    startDate: '',
    endDate: '',
    status: 'scheduled',
    totalMarks: 100,
    passingMarks: 40,
    subjects: [], // For multi-select in form
    detailedSubjects: [] // For individual subject details
  });

  // Filter exams
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
    const matchesClass = classFilter === 'all' || exam.classLevel === classFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const handleSubjectSelectionChange = (subjectName: string) => {
    setNewExam(prev => {
      const isSelected = prev.subjects.includes(subjectName);
      const newSubjects = isSelected
        ? prev.subjects.filter(s => s !== subjectName)
        : [...prev.subjects, subjectName];
      
      // Also update detailedSubjects
      const newDetailedSubjects = isSelected
        ? prev.detailedSubjects.filter(ds => ds.subjectName !== subjectName)
        : [...prev.detailedSubjects, { subjectName, date: prev.startDate, time: '09:00', maxMarks: 100, passingMarks: 40 }];
        
      return { ...prev, subjects: newSubjects, detailedSubjects: newDetailedSubjects };
    });
  };

  const handleDetailedSubjectChange = (index: number, field: keyof ExamSubjectDetail, value: string | number) => {
    setNewExam(prev => {
      const updatedDetailedSubjects = [...prev.detailedSubjects];
      if (typeof updatedDetailedSubjects[index][field] === 'number' && typeof value === 'string') {
        updatedDetailedSubjects[index][field] = parseInt(value) as never;
      } else {
        updatedDetailedSubjects[index][field] = value as never;
      }
      return { ...prev, detailedSubjects: updatedDetailedSubjects };
    });
  };


  const handleCreateOrUpdateExam = () => {
    // Calculate overall total and passing marks from detailedSubjects if not manually set
    const autoTotalMarks = newExam.detailedSubjects.reduce((sum, ds) => sum + (Number(ds.maxMarks) || 0), 0);
    const autoPassingMarks = newExam.detailedSubjects.reduce((sum, ds) => sum + (Number(ds.passingMarks) || 0), 0);

    const examDataToSave = {
      ...newExam,
      subjects: newExam.detailedSubjects.map(ds => ds.subjectName), // Ensure subjects list matches detailed ones
      totalMarks: newExam.totalMarks || autoTotalMarks,
      passingMarks: newExam.passingMarks || autoPassingMarks,
    };


    if (editingExam) {
      setExams(exams.map(ex => ex.id === editingExam.id ? { ...editingExam, ...examDataToSave } : ex));
      setEditingExam(null);
    } else {
      const newId = exams.length > 0 ? Math.max(...exams.map(e => e.id)) + 1 : 1;
      setExams([...exams, { ...examDataToSave, id: newId }]);
    }
    setShowNewExamForm(false);
    resetNewExamForm();
  };

  const resetNewExamForm = () => {
    setNewExam({
      name: '',
      classLevel: '10',
      startDate: '',
      endDate: '',
      status: 'scheduled',
      totalMarks: 100,
      passingMarks: 40,
      subjects: [],
      detailedSubjects: []
    });
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setNewExam({
      name: exam.name,
      classLevel: exam.classLevel,
      startDate: exam.startDate,
      endDate: exam.endDate,
      status: exam.status,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      subjects: [...(exam.detailedSubjects?.map(ds => ds.subjectName) || exam.subjects)],
      detailedSubjects: exam.detailedSubjects || exam.subjects.map(s => ({
        subjectName: s,
        date: exam.startDate,
        time: '09:00',
        maxMarks: (exam.totalMarks && exam.subjects.length > 0) ? Math.round(exam.totalMarks / exam.subjects.length) : 100,
        passingMarks: (exam.passingMarks && exam.subjects.length > 0) ? Math.round(exam.passingMarks / exam.subjects.length) : 40,
      }))
    });
    setShowNewExamForm(true);
  };

  const handleDeleteExam = (id: number) => {
    setExams(exams.filter(ex => ex.id !== id));
  };

  const handleOpenScoreModal = (exam: Exam, subjectDetail: ExamSubjectDetail) => {
    setSelectedExamForScores(exam);
    setSelectedSubjectForScores(subjectDetail);
    
    // Filter students for the exam's class level
    const relevantStudents = mockStudents.filter(s => s.classLevel === exam.classLevel);
    
    // Initialize or load existing scores for these students for this subject
    const scoresForSubject: StudentScore[] = relevantStudents.map(student => {
      const existingScore = exam.scores?.find(
        s => s.studentId === student.id && s.subjectName === subjectDetail.subjectName
      );
      return existingScore || {
        studentId: student.id,
        studentName: student.name,
        subjectName: subjectDetail.subjectName,
        maxMarks: subjectDetail.maxMarks,
        passingMarks: subjectDetail.passingMarks,
        marksObtained: undefined, // Default to undefined or null
      };
    });
    setCurrentStudentScores(scoresForSubject);
    setShowScoreModal(true);
  };

  const handleScoreChange = (studentId: string, marks: string) => {
    setCurrentStudentScores(prevScores =>
      prevScores.map(score =>
        score.studentId === studentId
          ? { ...score, marksObtained: marks === '' ? undefined : parseFloat(marks) }
          : score
      )
    );
  };

  const handleSaveScores = () => {
    if (!selectedExamForScores || !selectedSubjectForScores) return;

    // Validate scores (e.g., not greater than maxMarks) - basic validation for now
    for (const score of currentStudentScores) {
        if (score.marksObtained !== undefined && (score.marksObtained < 0 || score.marksObtained > selectedSubjectForScores.maxMarks)) {
            alert(`Marks for ${score.studentName} (${score.marksObtained}) cannot exceed max marks (${selectedSubjectForScores.maxMarks}) or be less than 0.`);
            return;
        }
    }

    setExams(prevExams =>
      prevExams.map(ex => {
        if (ex.id === selectedExamForScores.id) {
          // Update or add scores for the specific subject
          const otherScores = ex.scores?.filter(s => s.subjectName !== selectedSubjectForScores!.subjectName) || [];
          return { ...ex, scores: [...otherScores, ...currentStudentScores.filter(s => s.marksObtained !== undefined)] };
        }
        return ex;
      })
    );
    setShowScoreModal(false);
    setSelectedExamForScores(null);
    setSelectedSubjectForScores(null);
    setCurrentStudentScores([]);
    alert('Scores saved successfully! (mock)');
  };
  
  const handleOpenMarksheetModal = (exam: Exam, studentId?: string) => {
    // If studentId is not provided, we might show a list of students for that exam's class to select from.
    // For simplicity now, let's assume we'd need a way to select a student first if not directly passed.
    // This is a placeholder; a real implementation would involve fetching student list for the exam's class.
    const student = studentId ? mockStudents.find(s => s.id === studentId && s.classLevel === exam.classLevel) : null;

    if (!student && exam.scores && exam.scores.length > 0) {
        // If no specific student, and scores exist, prompt to select a student or show for first student with scores.
        // This part needs more UI to select a student. For now, let's just use the first student with scores if any.
        const firstStudentWithScoresId = exam.scores[0]?.studentId;
        const firstStudentDetails = mockStudents.find(s => s.id === firstStudentWithScoresId);
        if (firstStudentDetails) {
            setSelectedStudentForMarksheet(firstStudentDetails);
        } else {
            // This case might happen if scores exist but not for any student in mockStudents (data inconsistency)
            // Or if the first score doesn't have a matching student.
            // Fallback: try to find any student from the exam's class who has scores.
            const studentWithScore = mockStudents.find(st => st.classLevel === exam.classLevel && exam.scores?.some(sc => sc.studentId === st.id));
            if (studentWithScore) {
                 setSelectedStudentForMarksheet(studentWithScore);
            } else {
                alert("No student with scores found for this exam's class to display marksheet.");
                return;
            }
        }
    } else if (student) {
        setSelectedStudentForMarksheet(student);
    } else {
        alert("No student data available or selected for this exam's marksheet.");
        return;
    }
    
    setSelectedExamForMarksheet(exam);
    setShowMarksheetModal(true);
  };

  const calculateRankings = (exam: Exam): Array<Student & { totalMarksObtained: number; totalMaxMarks: number; percentage: number; rank: number }> => {
    if (!exam.scores || !exam.detailedSubjects || exam.detailedSubjects.length === 0) return [];

    const studentTotals: Array<{ studentId: string; studentName: string; rollNumber?: string; classLevel: string; totalMarksObtained: number; totalMaxMarks: number; }> = [];

    mockStudents.filter(s => s.classLevel === exam.classLevel).forEach(student => {
      let totalMarksObtained = 0;
      let totalMaxMarksForStudent = 0;
      
      exam.detailedSubjects!.forEach(subjectDetail => {
        const score = exam.scores!.find(s => s.studentId === student.id && s.subjectName === subjectDetail.subjectName);
        if (score && score.marksObtained !== undefined) {
          totalMarksObtained += score.marksObtained;
        }
        totalMaxMarksForStudent += subjectDetail.maxMarks;
      });

      if (totalMaxMarksForStudent > 0) { // Only include students if they were part of the exam subjects
         studentTotals.push({
            studentId: student.id,
            studentName: student.name,
            rollNumber: student.rollNumber,
            classLevel: student.classLevel,
            totalMarksObtained,
            totalMaxMarks: totalMaxMarksForStudent,
        });
      }
    });
    
    const sortedStudents = studentTotals
      .map(st => ({
        ...st,
        percentage: st.totalMaxMarks > 0 ? (st.totalMarksObtained / st.totalMaxMarks) * 100 : 0,
      }))
      .sort((a, b) => b.totalMarksObtained - a.totalMarksObtained || a.studentName.localeCompare(b.studentName)); // Sort by marks, then name

    let rank = 1;
    return sortedStudents.map((student, index) => {
      if (index > 0 && student.totalMarksObtained < sortedStudents[index - 1].totalMarksObtained) {
        rank = index + 1;
      }
      // Ensure we merge with the full student object from mockStudents to get all student properties
      // and explicitly include totalMaxMarks in the final returned object for each student.
      const fullStudentDetails = mockStudents.find(s => s.id === student.studentId);
      return { ...fullStudentDetails!, ...student, totalMaxMarks: student.totalMaxMarks, rank };
    });
  };

  const handleOpenRankingsModal = (exam: Exam | null) => {
    if (!exam) {
        // If no exam is passed, try to find the first one with results published
        const firstPublishedExam = exams.find(e => e.status === 'results_published' && e.scores && e.scores.length > 0);
        if (firstPublishedExam) {
            exam = firstPublishedExam;
        } else {
            alert("Please select an exam with published results to view rankings or ensure scores are entered.");
            return;
        }
    }
    if (exam.status !== 'results_published' || !exam.scores || exam.scores.length === 0) {
      alert("Rankings can only be viewed for exams with published results and entered scores.");
      return;
    }
    const ranks = calculateRankings(exam);
    setRankedStudents(ranks);
    setSelectedExamForRankings(exam);
    setShowRankingsModal(true);
  };


  const renderExamForm = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="examName" className="block text-sm font-medium text-gray-700">Exam Name</label>
        <input type="text" id="examName" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newExam.name} onChange={(e) => setNewExam({...newExam, name: e.target.value})} />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="classLevel" className="block text-sm font-medium text-gray-700">Class Level</label>
          <select id="classLevel" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newExam.classLevel} onChange={(e) => setNewExam({...newExam, classLevel: e.target.value})}>
            {availableClassLevels.map(lvl => <option key={lvl} value={lvl}>Class {lvl}</option>)}
            <option value="All">All Classes (e.g., Olympiad)</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select id="status" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newExam.status} onChange={(e) => setNewExam({...newExam, status: e.target.value as Exam['status']})}>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="results_published">Results Published</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
          <input type="date" id="startDate" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newExam.startDate} onChange={(e) => setNewExam({...newExam, startDate: e.target.value})} />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
          <input type="date" id="endDate" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newExam.endDate} onChange={(e) => setNewExam({...newExam, endDate: e.target.value})} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Select Subjects for this Exam</label>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
          {availableSubjects.map(subject => (
            <div key={subject} className="flex items-center">
              <input
                id={`subject-exam-${subject}`}
                type="checkbox"
                checked={newExam.subjects.includes(subject)}
                onChange={() => handleSubjectSelectionChange(subject)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`subject-exam-${subject}`} className="ml-2 block text-sm text-gray-900">{subject}</label>
            </div>
          ))}
        </div>
      </div>
      
      {newExam.detailedSubjects.length > 0 && (
        <div className="space-y-4 mt-4">
          <h4 className="text-md font-medium text-gray-800">Subject Details & Schedule:</h4>
          {newExam.detailedSubjects.map((ds, index) => (
            <Card key={index} title={`Subject: ${ds.subjectName}`} className="bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor={`ds-date-${index}`} className="block text-xs font-medium text-gray-600">Date</label>
                  <input type="date" id={`ds-date-${index}`} value={ds.date} onChange={e => handleDetailedSubjectChange(index, 'date', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1 px-2 sm:text-sm"/>
                </div>
                <div>
                  <label htmlFor={`ds-time-${index}`} className="block text-xs font-medium text-gray-600">Time</label>
                  <input type="time" id={`ds-time-${index}`} value={ds.time} onChange={e => handleDetailedSubjectChange(index, 'time', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1 px-2 sm:text-sm"/>
                </div>
                <div>
                  <label htmlFor={`ds-maxMarks-${index}`} className="block text-xs font-medium text-gray-600">Max Marks</label>
                  <input type="number" id={`ds-maxMarks-${index}`} value={ds.maxMarks} onChange={e => handleDetailedSubjectChange(index, 'maxMarks', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1 px-2 sm:text-sm"/>
                </div>
                <div>
                  <label htmlFor={`ds-passingMarks-${index}`} className="block text-xs font-medium text-gray-600">Passing Marks</label>
                  <input type="number" id={`ds-passingMarks-${index}`} value={ds.passingMarks} onChange={e => handleDetailedSubjectChange(index, 'passingMarks', e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1 px-2 sm:text-sm"/>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
       <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-4">
        <div>
            <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700">Overall Total Marks (Optional)</label>
            <input type="number" id="totalMarks" placeholder="Auto-calculated if empty" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newExam.totalMarks || ''} onChange={(e) => setNewExam({...newExam, totalMarks: parseInt(e.target.value) || undefined})} />
        </div>
        <div>
            <label htmlFor="passingMarks" className="block text-sm font-medium text-gray-700">Overall Passing Marks (Optional)</label>
            <input type="number" id="passingMarks" placeholder="Auto-calculated if empty" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newExam.passingMarks || ''} onChange={(e) => setNewExam({...newExam, passingMarks: parseInt(e.target.value) || undefined})} />
        </div>
      </div>


      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={() => { setShowNewExamForm(false); setEditingExam(null); resetNewExamForm(); }}>Cancel</Button>
        <Button variant="primary" onClick={handleCreateOrUpdateExam}>{editingExam ? 'Update Exam' : 'Create Exam'}</Button>
      </div>
    </div>
  );

  const uniqueClassLevels = Array.from(new Set(exams.map(ex => ex.classLevel))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Examinations</h1>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            icon={<AwardIcon size={16} />}
            onClick={() => handleOpenRankingsModal(null)} // Pass null to let function pick default
            disabled={!exams.some(e => e.status === 'results_published' && e.scores && e.scores.length > 0)}
          >
            View Rankings
          </Button>
          <Button
            variant="primary"
            icon={<PlusCircle size={16} />}
            onClick={() => { setEditingExam(null); resetNewExamForm(); setShowNewExamForm(true); }}
          >
            Schedule New Exam
          </Button>
        </div>
      </div>

      {/* New/Edit Exam Form */}
      {showNewExamForm && (
        <Card title={editingExam ? `Edit Exam: ${editingExam.name}` : "Schedule New Examination"}>
          {renderExamForm()}
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-cyan-500 rounded-md p-3"><ListChecks className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><dt className="text-sm font-medium text-gray-500 truncate">Total Exams</dt><dd className="text-2xl font-semibold text-gray-900">{exams.length}</dd></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3"><CalendarCheck className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><dt className="text-sm font-medium text-gray-500 truncate">Scheduled</dt><dd className="text-2xl font-semibold text-gray-900">{exams.filter(e => e.status === 'scheduled').length}</dd></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3"><Percent className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><dt className="text-sm font-medium text-gray-500 truncate">Results Published</dt><dd className="text-2xl font-semibold text-gray-900">{exams.filter(e => e.status === 'results_published').length}</dd></div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3"><Clock className="h-6 w-6 text-white" /></div>
            <div className="ml-4"><dt className="text-sm font-medium text-gray-500 truncate">Ongoing</dt><dd className="text-2xl font-semibold text-gray-900">{exams.filter(e => e.status === 'ongoing').length}</dd></div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Search by exam name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Filter className="h-5 w-5 text-gray-400" /></div>
            <select className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="all">All Classes</option>
              {uniqueClassLevels.map(lvl => <option key={lvl} value={lvl}>Class {lvl}</option>)}
            </select>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Filter className="h-5 w-5 text-gray-400" /></div>
            <select className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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

      {/* Exams List */}
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
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
                    <div className="text-xs text-gray-500">Total Marks: {exam.totalMarks || 'N/A'} | Passing: {exam.passingMarks || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Class {exam.classLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {format(new Date(exam.startDate), 'MMM dd, yyyy')} - {format(new Date(exam.endDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{exam.subjects.join(', ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        exam.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        exam.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800' :
                        exam.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        exam.status === 'results_published' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800' // cancelled
                      }`}
                    >
                      {exam.status.replace('_', ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      <Button variant="icon" size="sm" onClick={() => alert(`Viewing details for ${exam.name}`)} title="View Details"><Eye size={16} /></Button>
                      <Button variant="icon" size="sm" onClick={() => handleEditExam(exam)} title="Edit Exam"><Edit size={16} className="text-yellow-600 hover:text-yellow-700" /></Button>
                      {exam.detailedSubjects && exam.detailedSubjects.length > 0 && exam.status !== 'results_published' && (
                        <Button
                          variant="icon"
                          size="sm"
                          onClick={() => {
                            // For simplicity, let's assume we manage scores for the first subject if multiple exist,
                            // or ideally, user would select a subject from the exam's detailedSubjects.
                            // For now, picking the first one if available.
                            if(exam.detailedSubjects && exam.detailedSubjects[0]){
                                handleOpenScoreModal(exam, exam.detailedSubjects[0])
                            } else {
                                alert("No specific subjects configured for detailed score entry for this exam.");
                            }
                          }}
                          title="Manage Scores"
                        >
                          <ClipboardEdit size={16} className="text-purple-600 hover:text-purple-700"/>
                        </Button>
                      )}
                       {exam.status === 'results_published' && exam.scores && exam.scores.length > 0 && (
                        <Button
                          variant="icon"
                          size="sm"
                          onClick={() => handleOpenMarksheetModal(exam)} // Initially won't pass studentId, modal should handle student selection or show for first
                          title="View Marksheet(s)"
                        >
                          <Printer size={16} className="text-teal-600 hover:text-teal-700"/>
                        </Button>
                      )}
                      <Button variant="icon" size="sm" onClick={() => alert(`Manage papers for ${exam.name}`)} title="Manage Papers/Upload"><UploadCloud size={16} className="text-indigo-600 hover:text-indigo-700"/></Button>
                      <Button variant="icon" size="sm" onClick={() => alert(`Download results for ${exam.name}`)} title="Download Results"><DownloadCloud size={16} className="text-green-600 hover:text-green-700"/></Button>
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

      {/* Score Entry Modal */}
      {showScoreModal && selectedExamForScores && selectedSubjectForScores && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <Card title={`Enter Scores for ${selectedExamForScores.name} - ${selectedSubjectForScores.subjectName} (Class ${selectedExamForScores.classLevel})`} className="w-full max-w-2xl bg-white shadow-xl rounded-lg">
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 mb-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Roll No.</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marks Obtained (out of {selectedSubjectForScores.maxMarks})</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStudentScores.map(score => {
                    const studentDetails = mockStudents.find(s => s.id === score.studentId);
                    return (
                      <tr key={score.studentId}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{studentDetails?.name || score.studentName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{studentDetails?.rollNumber || 'N/A'}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={score.marksObtained === undefined ? '' : score.marksObtained}
                            onChange={(e) => handleScoreChange(score.studentId, e.target.value)}
                            max={selectedSubjectForScores.maxMarks}
                            min="0"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-1 px-2 sm:text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Max ${selectedSubjectForScores.maxMarks}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {currentStudentScores.length === 0 && <p className="text-center text-gray-500 py-4">No students found for Class {selectedExamForScores.classLevel}.</p>}
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
              <Button variant="outline" onClick={() => setShowScoreModal(false)} icon={<X size={16}/>}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveScores} icon={<Save size={16}/>}>Save Scores</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Marksheet View Modal */}
      {showMarksheetModal && selectedExamForMarksheet && selectedStudentForMarksheet && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <Card
            title={`Marksheet: ${selectedStudentForMarksheet.name} (Roll: ${selectedStudentForMarksheet.rollNumber || 'N/A'}) - ${selectedExamForMarksheet.name}`}
            className="w-full max-w-3xl bg-white shadow-xl rounded-lg"
          >
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold">{selectedExamForMarksheet.name}</h2>
                <p className="text-sm text-gray-600">Class: {selectedExamForMarksheet.classLevel} | Academic Year: {/* TODO: Get from settings or exam */ '2024-2025'}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 mb-4 text-sm">
                <p><strong>Student Name:</strong> {selectedStudentForMarksheet.name}</p>
                <p><strong>Roll Number:</strong> {selectedStudentForMarksheet.rollNumber || 'N/A'}</p>
                <p><strong>Class:</strong> {selectedStudentForMarksheet.classLevel}</p>
                <p><strong>Date of Issue:</strong> {format(new Date(), 'MMM dd, yyyy')}</p>
              </div>

              <table className="min-w-full divide-y divide-gray-300 border border-gray-300 mb-4">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Subject</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Max Marks</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Passing Marks</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Marks Obtained</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Grade/Result</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedExamForMarksheet.detailedSubjects?.map(subjectDetail => {
                    const score = selectedExamForMarksheet.scores?.find(
                      s => s.studentId === selectedStudentForMarksheet!.id && s.subjectName === subjectDetail.subjectName
                    );
                    const marksObtained = score?.marksObtained;
                    const isPass = marksObtained !== undefined && marksObtained >= subjectDetail.passingMarks;
                    return (
                      <tr key={subjectDetail.subjectName}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-800">{subjectDetail.subjectName}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap text-sm text-gray-600">{subjectDetail.maxMarks}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap text-sm text-gray-600">{subjectDetail.passingMarks}</td>
                        <td className={`px-3 py-2 text-center whitespace-nowrap text-sm font-semibold ${marksObtained === undefined ? 'text-gray-500' : isPass ? 'text-green-600' : 'text-red-600'}`}>
                          {marksObtained === undefined ? 'N/A' : marksObtained}
                        </td>
                        <td className={`px-3 py-2 text-center whitespace-nowrap text-sm font-semibold ${marksObtained === undefined ? 'text-gray-500' : isPass ? 'text-green-600' : 'text-red-600'}`}>
                          {marksObtained === undefined ? '-' : isPass ? 'Pass' : 'Fail'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                 <tfoot className="bg-gray-100 font-semibold">
                    <tr>
                        <td className="px-3 py-2 text-right text-sm text-gray-800" colSpan={3}>Total Marks Obtained:</td>
                        <td className="px-3 py-2 text-center text-sm text-gray-800">
                            {selectedExamForMarksheet.scores?.filter(s => s.studentId === selectedStudentForMarksheet!.id).reduce((acc, curr) => acc + (curr.marksObtained || 0), 0) || 0}
                        </td>
                        <td className="px-3 py-2 text-center text-sm text-gray-800"></td>
                    </tr>
                     <tr>
                        <td className="px-3 py-2 text-right text-sm text-gray-800" colSpan={3}>Overall Percentage:</td>
                        <td className="px-3 py-2 text-center text-sm text-gray-800">
                            {(() => {
                                const totalObtained = selectedExamForMarksheet.scores?.filter(s => s.studentId === selectedStudentForMarksheet!.id).reduce((acc, curr) => acc + (curr.marksObtained || 0), 0) || 0;
                                const totalMax = selectedExamForMarksheet.detailedSubjects?.reduce((acc, curr) => acc + curr.maxMarks, 0) || 1; // Avoid division by zero
                                return totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) + '%' : 'N/A';
                            })()}
                        </td>
                        <td className="px-3 py-2 text-center text-sm text-gray-800">
                           {/* Overall Result Logic Here */}
                        </td>
                    </tr>
                </tfoot>
              </table>
              <div className="mt-6 text-sm">
                <p><strong>Remarks:</strong> {/* Placeholder for remarks */}</p>
                <div className="mt-8 flex justify-between">
                    <div>
                        <p className="mt-4 border-t-2 border-gray-400 pt-1 inline-block">Class Teacher's Signature</p>
                    </div>
                    <div>
                        <p className="mt-4 border-t-2 border-gray-400 pt-1 inline-block">Principal's Signature</p>
                    </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
              <Button variant="outline" onClick={() => setShowMarksheetModal(false)} icon={<X size={16}/>}>Close</Button>
              <Button variant="primary" onClick={() => window.print()} icon={<Printer size={16}/>}>Print Marksheet</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Rankings Modal */}
      {showRankingsModal && selectedExamForRankings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <Card
            title={`Rankings: ${selectedExamForRankings.name} (Class ${selectedExamForRankings.classLevel})`}
            className="w-full max-w-3xl bg-white shadow-xl rounded-lg"
          >
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {rankedStudents.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Rank</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Student Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Roll No.</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Marks Obtained</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rankedStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="px-3 py-2 text-center whitespace-nowrap text-sm font-medium text-gray-800">{student.rank}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700">{student.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{student.rollNumber || 'N/A'}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap text-sm text-gray-700">{student.totalMarksObtained} / {student.totalMaxMarks}</td>
                        <td className="px-3 py-2 text-center whitespace-nowrap text-sm font-semibold text-gray-800">{student.percentage.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 py-4">No students or scores available to calculate rankings for this exam.</p>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3 rounded-b-lg">
              <Button variant="outline" onClick={() => setShowRankingsModal(false)} icon={<X size={16}/>}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Exams;