import React, { useState } from 'react';
import Card from '../../components/common/Card';
import { BookOpen, User, Users, Info, Link as LinkIcon } from 'lucide-react';

interface SubjectDetails {
  id: string;
  name: string;
  teacherName: string;
  teacherEmail?: string; // Optional
  syllabusLink?: string; // Optional link to syllabus PDF or page
  resourcesLink?: string; // Optional link to subject resources
}

interface ClassInfo {
  className: string; // e.g., "Grade 10 - Section A"
  classTeacher: {
    name: string;
    email?: string;
    contact?: string;
  };
  subjects: SubjectDetails[];
}

// Mock data - In a real app, this would come from an API for the selected child
const mockClassInfo: ClassInfo = {
  className: 'Grade 10 - Section A',
  classTeacher: {
    name: 'Mrs. Anjali Verma',
    email: 'anjali.verma@school.com',
    contact: '98XXXXXX01',
  },
  subjects: [
    {
      id: 'subj1',
      name: 'Mathematics',
      teacherName: 'Mr. Rohan Sharma',
      teacherEmail: 'rohan.sharma@school.com',
      syllabusLink: '/path/to/math_syllabus.pdf',
      resourcesLink: '/parent/resources/math',
    },
    {
      id: 'subj2',
      name: 'Physics',
      teacherName: 'Ms. Priya Singh',
      teacherEmail: 'priya.singh@school.com',
      syllabusLink: '/path/to/physics_syllabus.pdf',
    },
    {
      id: 'subj3',
      name: 'Chemistry',
      teacherName: 'Dr. Alok Nath',
      teacherEmail: 'alok.nath@school.com',
    },
    {
      id: 'subj4',
      name: 'Biology',
      teacherName: 'Ms. Sunita Reddy',
      teacherEmail: 'sunita.reddy@school.com',
      resourcesLink: '/parent/resources/biology',
    },
    {
      id: 'subj5',
      name: 'English Literature',
      teacherName: 'Mrs. Carol Dsouza',
      teacherEmail: 'carol.dsouza@school.com',
    },
    {
      id: 'subj6',
      name: 'History & Civics',
      teacherName: 'Mr. David Lal',
      teacherEmail: 'david.lal@school.com',
      syllabusLink: '/path/to/history_syllabus.pdf',
    },
  ],
};

const ChildClasses: React.FC = () => {
  // Assuming selected child's data is fetched or passed via props/context
  const [classInfo, setClassInfo] = useState<ClassInfo>(mockClassInfo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Child's Classes & Subjects</h1>
        {/* Child selector would go here if not handled globally */}
      </div>

      <Card>
        <div className="p-2"> {/* Reduced padding for Card content */}
            <h2 className="text-xl font-semibold text-blue-700 mb-3">
                Class Information: {classInfo.className}
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-md font-medium text-gray-800 flex items-center">
                    <Users size={18} className="mr-2 text-blue-600" />
                    Class Teacher: <span className="font-semibold ml-1">{classInfo.classTeacher.name}</span>
                </p>
                {classInfo.classTeacher.email && (
                    <p className="text-sm text-gray-600 mt-1">
                        Email: <a href={`mailto:${classInfo.classTeacher.email}`} className="text-blue-600 hover:underline">{classInfo.classTeacher.email}</a>
                    </p>
                )}
                 {classInfo.classTeacher.contact && (
                    <p className="text-sm text-gray-600 mt-1">
                        Contact: {classInfo.classTeacher.contact} (Office Hours)
                    </p>
                )}
            </div>
        </div>
      </Card>

      <Card title={<span className="flex items-center"><BookOpen className="mr-2 text-indigo-600" /> Enrolled Subjects</span>}>
        {classInfo.subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classInfo.subjects.map((subject) => (
              <div key={subject.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-indigo-700">{subject.name}</h3>
                <p className="text-sm text-gray-600 mt-1 flex items-center">
                  <User size={14} className="mr-2 text-gray-500" />
                  Teacher: {subject.teacherName}
                </p>
                {subject.teacherEmail && (
                  <p className="text-xs text-gray-500 mt-1">
                    Email: <a href={`mailto:${subject.teacherEmail}`} className="text-indigo-600 hover:underline">{subject.teacherEmail}</a>
                  </p>
                )}
                <div className="mt-3 space-y-2">
                  {subject.syllabusLink && (
                    <a
                      href={subject.syllabusLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                    >
                      <LinkIcon size={14} className="mr-1" /> View Syllabus
                    </a>
                  )}
                  {subject.resourcesLink && (
                     <a
                      href={subject.resourcesLink}
                      // onClick={(e) => { e.preventDefault(); alert(`Navigating to resources for ${subject.name}`); }} // For SPA navigation
                      className="text-sm text-green-600 hover:text-green-800 hover:underline flex items-center"
                    >
                      <LinkIcon size={14} className="mr-1" /> View Resources
                    </a>
                  )}
                  {!subject.syllabusLink && !subject.resourcesLink && (
                    <p className="text-xs text-gray-400 italic">No additional links available.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <Info className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Subjects Enrolled</h3>
            <p className="mt-1 text-sm text-gray-500">
              Subject enrollment information is not available at this time.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ChildClasses;