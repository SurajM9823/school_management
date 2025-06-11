import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { BookOpen, User, Users, Info, Link as LinkIcon, FileText, Download } from 'lucide-react';
import { Link } from 'react-router-dom'; // For linking to assignments or resources

interface SubjectDetails {
  id: string;
  name: string;
  teacherName: string;
  teacherEmail?: string;
  syllabusLink?: string;
  resourcesLink?: string; // Could be a general resources page or specific
  assignmentsLink?: string; // Link to assignments filtered by this subject
}

interface StudentClassInfo {
  className: string; // e.g., "Grade 10 - Section A"
  classTeacher: {
    name: string;
    email?: string;
  };
  subjects: SubjectDetails[];
}

// Mock data - In a real app, this would come from an API for the logged-in student
const mockStudentClassInfo: StudentClassInfo = {
  className: 'Grade 10 - Section A',
  classTeacher: {
    name: 'Mrs. Anjali Verma',
    email: 'anjali.verma@school.com',
  },
  subjects: [
    {
      id: 'subj1',
      name: 'Mathematics',
      teacherName: 'Mr. Rohan Sharma',
      teacherEmail: 'rohan.sharma@school.com',
      syllabusLink: '/path/to/math_syllabus.pdf',
      resourcesLink: '/student/resources/math', // Example link
      assignmentsLink: '/student/assignments?subject=Mathematics',
    },
    {
      id: 'subj2',
      name: 'Physics',
      teacherName: 'Ms. Priya Singh',
      teacherEmail: 'priya.singh@school.com',
      syllabusLink: '/path/to/physics_syllabus.pdf',
      assignmentsLink: '/student/assignments?subject=Physics',
    },
    {
      id: 'subj3',
      name: 'Chemistry',
      teacherName: 'Dr. Alok Nath',
      teacherEmail: 'alok.nath@school.com',
      assignmentsLink: '/student/assignments?subject=Chemistry',
    },
    {
      id: 'subj4',
      name: 'Biology',
      teacherName: 'Ms. Sunita Reddy',
      teacherEmail: 'sunita.reddy@school.com',
      resourcesLink: '/student/resources/biology',
      assignmentsLink: '/student/assignments?subject=Biology',
    },
    {
      id: 'subj5',
      name: 'English Literature',
      teacherName: 'Mrs. Carol Dsouza',
      teacherEmail: 'carol.dsouza@school.com',
      assignmentsLink: '/student/assignments?subject=English Literature',
    },
    {
      id: 'subj6',
      name: 'History & Civics',
      teacherName: 'Mr. David Lal',
      teacherEmail: 'david.lal@school.com',
      syllabusLink: '/path/to/history_syllabus.pdf',
      assignmentsLink: '/student/assignments?subject=History & Civics',
    },
     {
      id: 'subj7',
      name: 'Computer Science',
      teacherName: 'Mr. Kumar',
      teacherEmail: 'kumar.cs@school.com',
      resourcesLink: '/student/resources/cs',
      assignmentsLink: '/student/assignments?subject=Computer Science',
    },
  ],
};

const MyClasses: React.FC = () => {
  const [classInfo, setClassInfo] = useState<StudentClassInfo>(mockStudentClassInfo);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
        <Users size={28} className="mr-3 text-indigo-600"/> My Classes & Subjects
      </h1>

      <Card>
        <div className="p-3">
            <h2 className="text-xl font-semibold text-indigo-700 mb-3">
                My Class: {classInfo.className}
            </h2>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <p className="text-md font-medium text-gray-800 flex items-center">
                    <User size={18} className="mr-2 text-indigo-600" />
                    Class Teacher: <span className="font-semibold ml-1">{classInfo.classTeacher.name}</span>
                </p>
                {classInfo.classTeacher.email && (
                    <p className="text-sm text-gray-600 mt-1">
                        Email: <a href={`mailto:${classInfo.classTeacher.email}`} className="text-indigo-600 hover:underline">{classInfo.classTeacher.email}</a>
                    </p>
                )}
            </div>
        </div>
      </Card>

      <Card title={<span className="flex items-center"><BookOpen className="mr-2 text-purple-600" /> My Subjects</span>}>
        {classInfo.subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classInfo.subjects.map((subject) => (
              <div key={subject.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-purple-700">{subject.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                    <User size={14} className="mr-2 text-gray-500" />
                    Teacher: {subject.teacherName}
                    </p>
                    {subject.teacherEmail && (
                    <p className="text-xs text-gray-500 mt-1">
                        Email: <a href={`mailto:${subject.teacherEmail}`} className="text-purple-600 hover:underline">{subject.teacherEmail}</a>
                    </p>
                    )}
                </div>
                <div className="mt-4 space-y-2 border-t pt-3">
                  {subject.assignmentsLink && (
                     <Link to={subject.assignmentsLink} className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center">
                        <FileText size={14} className="mr-1.5" /> View Assignments
                    </Link>
                  )}
                  {subject.syllabusLink && (
                    <a href={subject.syllabusLink} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-gray-800 hover:underline flex items-center">
                      <Download size={14} className="mr-1.5" /> Download Syllabus
                    </a>
                  )}
                  {subject.resourcesLink && (
                     <Link to={subject.resourcesLink} className="text-sm text-green-600 hover:text-green-800 hover:underline flex items-center">
                        <LinkIcon size={14} className="mr-1.5" /> View Resources
                    </Link>
                  )}
                  {!subject.syllabusLink && !subject.resourcesLink && !subject.assignmentsLink && (
                    <p className="text-xs text-gray-400 italic">No quick links available for this subject.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Info className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Subjects Found</h3>
            <p className="mt-1 text-sm text-gray-500">Your subject enrollment information is not available.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MyClasses;