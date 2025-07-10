import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Award, User, Calendar } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../api';

interface Class {
  id: number;
  name: string;
}

interface Student {
  id: number;
  name: string;
  admission_number: string;
  section_name: string;
}

interface Grade {
  id: number;
  exam_name: string;
  subject_name: string;
  marks_obtained: number;
  max_marks: number;
}

interface StudentInfo {
  id: number;
  name: string;
  admission_number: string;
  class_name: string;
  section_name: string;
}

const Grades: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    } else {
      setStudents([]);
      setSelectedStudent(null);
      setGrades([]);
      setStudentInfo(null);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      console.log('Fetching classes...');
      setClassesLoading(true);
      const response = await api.get('/teacher/grades/classes/');
      console.log('Classes response:', response.data);
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const response = await api.get(`/teacher/grades/classes/${selectedClass}/students/`, { params });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentGrades = async (studentId: number) => {
    setGradesLoading(true);
    try {
      const response = await api.get(`/teacher/grades/students/${studentId}/`);
      setStudentInfo(response.data.student);
      setGrades(response.data.grades);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setGradesLoading(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    fetchStudentGrades(student.id);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50';
    if (percentage >= 80) return 'text-blue-600 bg-blue-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    if (percentage >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const calculatePercentage = (obtained: number, max: number) => {
    return max > 0 ? Math.round((obtained / max) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
        <Award size={28} className="mr-3 text-blue-600" />
        Student Grades
      </h1>

      {/* Class Selection */}
      <Card title="Select Class">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Choose Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={classesLoading}
            >
              <option value="">
                {classesLoading ? 'Loading classes...' : 'Select a class'}
              </option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            {!classesLoading && classes.length === 0 && (
              <p className="text-sm text-red-600 mt-1">No classes found. You may not be assigned to any classes.</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Found {classes.length} classes</p>
          </div>
        </div>
      </Card>

      {/* Student Search and Selection */}
      {selectedClass && (
        <Card title="Select Student">
          <form onSubmit={handleSearchSubmit} className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or admission number..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button type="submit" variant="primary" disabled={loading}>
                Search
              </Button>
            </div>
          </form>

          {loading ? (
            <div className="text-center py-4">Loading students...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentSelect(student)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStudent?.id === student.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <User size={16} className="mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-gray-500">
                        {student.admission_number} • {student.section_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && students.length === 0 && selectedClass && (
            <div className="text-center py-4 text-gray-500">
              No students found. Try adjusting your search.
            </div>
          )}
        </Card>
      )}

      {/* Student Grades */}
      {selectedStudent && (
        <Card title={`Grades for ${selectedStudent.name}`}>
          {studentInfo && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Name:</span>
                  <p className="text-gray-900">{studentInfo.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Admission No:</span>
                  <p className="text-gray-900">{studentInfo.admission_number}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Class:</span>
                  <p className="text-gray-900">{studentInfo.class_name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Section:</span>
                  <p className="text-gray-900">{studentInfo.section_name}</p>
                </div>
              </div>
            </div>
          )}

          {gradesLoading ? (
            <div className="text-center py-8">Loading grades...</div>
          ) : grades.length > 0 ? (
            <div className="space-y-4">
              {grades.map((grade) => {
                const percentage = calculatePercentage(grade.marks_obtained, grade.max_marks);
                return (
                  <div key={grade.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <BookOpen size={16} className="mr-2 text-blue-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{grade.subject_name}</h4>
                          <p className="text-sm text-gray-600">{grade.exam_name}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(percentage)}`}>
                        {percentage}%
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        Marks: {grade.marks_obtained} / {grade.max_marks}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No grades available for this student.</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default Grades;