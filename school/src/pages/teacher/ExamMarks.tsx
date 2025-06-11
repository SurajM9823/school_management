import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ChevronDown, Save } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  marks: { [subjectId: string]: string | number };
}

interface Exam {
  id: string;
  name: string;
}

interface ClassWithStudents {
  id: string;
  name: string;
  students: Student[];
  exams: Exam[]; // Exams associated with this class
}

const mockClassesWithStudents: ClassWithStudents[] = [
  {
    id: 'class1',
    name: 'Class 8A',
    exams: [
      { id: 'exam1-math', name: 'Mathematics - Mid Term' },
      { id: 'exam1-sci', name: 'Science - Mid Term' },
    ],
    students: [
      { id: 's1', name: 'Alice Wonderland', marks: { 'exam1-math': '', 'exam1-sci': '' } },
      { id: 's2', name: 'Bob The Builder', marks: { 'exam1-math': '', 'exam1-sci': '' } },
    ],
  },
  {
    id: 'class2',
    name: 'Class 9B',
    exams: [
      { id: 'exam2-eng', name: 'English - Final Term' },
      { id: 'exam2-hist', name: 'History - Final Term' },
    ],
    students: [
      { id: 's3', name: 'Charlie Brown', marks: { 'exam2-eng': '', 'exam2-hist': '' } },
      { id: 's4', name: 'Diana Prince', marks: { 'exam2-eng': '', 'exam2-hist': '' } },
    ],
  },
];

const ExamMarks: React.FC = () => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(mockClassesWithStudents[0]?.id || null);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [studentMarks, setStudentMarks] = useState<{ [studentId: string]: { [examId: string]: string } }>({});

  const selectedClass = mockClassesWithStudents.find(c => c.id === selectedClassId);

  const handleMarkChange = (studentId: string, examId: string, value: string) => {
    setStudentMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [examId]: value,
      },
    }));
  };

  const handleSaveChanges = () => {
    // TODO: Implement API call to save marks
    console.log('Saving marks:', studentMarks);
    alert('Marks saved (mock)!');
  };
  
  // Initialize studentMarks when selectedClass or selectedExamId changes
  React.useEffect(() => {
    if (selectedClass && selectedExamId) {
      const initialMarks: { [studentId: string]: { [examId: string]: string } } = {};
      selectedClass.students.forEach(student => {
        initialMarks[student.id] = {
          ...initialMarks[student.id],
          [selectedExamId]: student.marks[selectedExamId]?.toString() || ''
        };
      });
      setStudentMarks(initialMarks);
    }
  }, [selectedClass, selectedExamId]);


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Enter Exam Marks</h1>

      <Card>
        <div className="space-y-4">
          {/* Class Selector */}
          <div>
            <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Class
            </label>
            <select
              id="class-select"
              value={selectedClassId || ''}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSelectedExamId(null); // Reset exam when class changes
                setStudentMarks({}); // Reset marks
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="" disabled>-- Select a Class --</option>
              {mockClassesWithStudents.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Exam Selector */}
          {selectedClass && (
            <div>
              <label htmlFor="exam-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Exam
              </label>
              <select
                id="exam-select"
                value={selectedExamId || ''}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="" disabled>-- Select an Exam --</option>
                {selectedClass.exams.map(exam => (
                  <option key={exam.id} value={exam.id}>{exam.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Card>

      {selectedClass && selectedExamId && (
        <Card title={`Enter Marks for ${selectedClass.exams.find(e=>e.id === selectedExamId)?.name} - ${selectedClass.name}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedClass.students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={studentMarks[student.id]?.[selectedExamId] || ''}
                        onChange={(e) => handleMarkChange(student.id, selectedExamId, e.target.value)}
                        className="mt-1 block w-24 text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
              onClick={handleSaveChanges}
              disabled={Object.keys(studentMarks).length === 0}
            >
              Save Changes
            </Button>
          </div>
        </Card>
      )}
       {/* TODO: Add validation for marks (e.g., numeric, range) */}
       {/* TODO: Fetch actual class, student, and exam data from API */}
    </div>
  );
};

export default ExamMarks;