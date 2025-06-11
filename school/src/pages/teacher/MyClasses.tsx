import React from 'react';
import Card from '../../components/common/Card';
import { BookOpen, Users, Edit3 } from 'lucide-react';
import Button from '../../components/common/Button';

interface Subject {
  id: string;
  name: string;
  students: number;
}

interface AssignedClass {
  id: string;
  name: string;
  subjects: Subject[];
}

const mockAssignedClasses: AssignedClass[] = [
  {
    id: 'class1',
    name: 'Class 8A',
    subjects: [
      { id: 'subj1a', name: 'Mathematics', students: 30 },
      { id: 'subj1b', name: 'Science', students: 28 },
    ],
  },
  {
    id: 'class2',
    name: 'Class 9B',
    subjects: [{ id: 'subj2a', name: 'English Literature', students: 32 }],
  },
  {
    id: 'class3',
    name: 'Class 10C',
    subjects: [
      { id: 'subj3a', name: 'Physics', students: 25 },
      { id: 'subj3b', name: 'Chemistry', students: 25 },
    ],
  },
];

const MyClasses: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">My Classes & Subjects</h1>
      </div>

      {mockAssignedClasses.length === 0 ? (
        <Card>
          <p className="text-gray-600">You are not currently assigned to any classes.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {mockAssignedClasses.map((assignedClass) => (
            <Card key={assignedClass.id} title={`Class: ${assignedClass.name}`}>
              <ul className="divide-y divide-gray-200">
                {assignedClass.subjects.map((subject) => (
                  <li key={subject.id} className="py-4">
                    <div className="flex items-center justify-between space-x-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <BookOpen size={20} />
                        </div>
                        <div>
                          <p className="text-md font-medium text-gray-900">{subject.name}</p>
                          <p className="text-sm text-gray-500 flex items-center">
                            <Users size={14} className="mr-1" /> {subject.students} Students
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" icon={<Users size={16}/>}>
                          View Students
                        </Button>
                        <Button variant="outline" size="sm" icon={<Edit3 size={16}/>}>
                          Add Remarks
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
      {/* TODO: Implement functionality for View Students and Add Remarks */}
      {/* TODO: Fetch actual class and subject data from API */}
    </div>
  );
};

export default MyClasses;