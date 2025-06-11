import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Filter, 
  FileText, 
  Users,
  Check,
  Calendar,
  BookOpen,
  Edit,
  Trash2,
  PlusCircle,
  Eye,
  UsersRound,
  ClipboardList
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

// Mock data for classes
const initialClasses = [
  {
    id: 1,
    name: 'Class 10A',
    gradeLevel: '10',
    teacher: 'Alice Wonderland',
    teacherId: 1,
    roomNumber: '101',
    capacity: 30,
    studentsEnrolled: 28,
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    schedule: 'Mon-Fri 9:00 AM - 3:00 PM'
  },
  {
    id: 2,
    name: 'Class 9B',
    gradeLevel: '9',
    teacher: 'Bob The Builder',
    teacherId: 2,
    roomNumber: '102',
    capacity: 25,
    studentsEnrolled: 25,
    subjects: ['English', 'History', 'Geography'],
    schedule: 'Mon-Fri 9:00 AM - 3:00 PM'
  },
  {
    id: 3,
    name: 'Class 11C (Science)',
    gradeLevel: '11',
    teacher: 'Alice Wonderland', // Can be assigned to multiple classes
    teacherId: 1,
    roomNumber: '201',
    capacity: 35,
    studentsEnrolled: 32,
    subjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
    schedule: 'Mon-Fri 8:00 AM - 2:00 PM'
  },
];

// Mock data for available teachers (simplified)
const availableTeachers = [
  { id: 1, name: 'Alice Wonderland', subject: 'Mathematics' },
  { id: 2, name: 'Bob The Builder', subject: 'Physics' },
  { id: 3, name: 'Carol Danvers', subject: 'English' },
  { id: 4, name: 'David Copperfield', subject: 'Chemistry' },
  { id: 5, name: 'Eve Harrington', subject: 'Biology' },
];

// Mock data for available subjects
const availableSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science', 'Physical Education', 'Art', 'Music', 'Drama'];


interface Class {
  id: number;
  name: string;
  gradeLevel: string;
  teacher: string;
  teacherId: number;
  roomNumber: string;
  capacity: number;
  studentsEnrolled: number;
  subjects: string[];
  schedule: string;
}

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>(initialClasses);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [showNewClassForm, setShowNewClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const [newClass, setNewClass] = useState({
    name: '',
    gradeLevel: '1',
    teacherId: availableTeachers[0]?.id || 0,
    roomNumber: '',
    capacity: 30,
    subjects: [] as string[],
    schedule: ''
  });

  // Filter classes
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.teacher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || cls.gradeLevel === gradeFilter;
    const matchesTeacher = teacherFilter === 'all' || cls.teacherId === parseInt(teacherFilter);
    
    return matchesSearch && matchesGrade && matchesTeacher;
  });

  const handleCreateOrUpdateClass = () => {
    if (editingClass) {
      // Update existing class
      setClasses(classes.map(cls => cls.id === editingClass.id ? { ...editingClass, ...newClass, teacher: availableTeachers.find(t => t.id === newClass.teacherId)?.name || '' } : cls));
      setEditingClass(null);
    } else {
      // Create new class
      const newId = classes.length > 0 ? Math.max(...classes.map(c => c.id)) + 1 : 1;
      setClasses([...classes, { 
        ...newClass, 
        id: newId, 
        studentsEnrolled: 0, // Default for new class
        teacher: availableTeachers.find(t => t.id === newClass.teacherId)?.name || ''
      }]);
    }
    setShowNewClassForm(false);
    resetNewClassForm();
  };

  const resetNewClassForm = () => {
    setNewClass({
      name: '',
      gradeLevel: '1',
      teacherId: availableTeachers[0]?.id || 0,
      roomNumber: '',
      capacity: 30,
      subjects: [],
      schedule: ''
    });
  };

  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setNewClass({
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      teacherId: cls.teacherId,
      roomNumber: cls.roomNumber,
      capacity: cls.capacity,
      subjects: [...cls.subjects],
      schedule: cls.schedule
    });
    setShowNewClassForm(true);
  };

  const handleDeleteClass = (id: number) => {
    // Add confirmation dialog in a real app
    setClasses(classes.filter(cls => cls.id !== id));
  };
  
  const handleSubjectChange = (subject: string) => {
    setNewClass(prev => {
      const newSubjects = prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject];
      return { ...prev, subjects: newSubjects };
    });
  };

  const renderClassForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="className" className="block text-sm font-medium text-gray-700">Class Name (e.g., Class 10A, Grade 5 Bluebirds)</label>
          <input type="text" id="className" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newClass.name} onChange={(e) => setNewClass({...newClass, name: e.target.value})} />
        </div>
        <div>
          <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700">Grade Level</label>
          <select id="gradeLevel" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newClass.gradeLevel} onChange={(e) => setNewClass({...newClass, gradeLevel: e.target.value})}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => <option key={grade} value={String(grade)}>Grade {grade}</option>)}
            <option value="Kindergarten">Kindergarten</option>
            <option value="Nursery">Nursery</option>
          </select>
        </div>
        <div>
          <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700">Assign Teacher</label>
          <select id="teacherId" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newClass.teacherId} onChange={(e) => setNewClass({...newClass, teacherId: parseInt(e.target.value)})}>
            {availableTeachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name} ({teacher.subject})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700">Room Number / Name</label>
          <input type="text" id="roomNumber" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newClass.roomNumber} onChange={(e) => setNewClass({...newClass, roomNumber: e.target.value})} />
        </div>
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity</label>
          <input type="number" id="capacity" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newClass.capacity} onChange={(e) => setNewClass({...newClass, capacity: parseInt(e.target.value)})} />
        </div>
        <div>
          <label htmlFor="schedule" className="block text-sm font-medium text-gray-700">Schedule Info (e.g., Mon-Fri 9 AM - 3 PM)</label>
          <input type="text" id="schedule" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={newClass.schedule} onChange={(e) => setNewClass({...newClass, schedule: e.target.value})} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Subjects Taught in this Class</label>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {availableSubjects.map(subject => (
            <div key={subject} className="flex items-center">
              <input
                id={`subject-${subject}`}
                name="subjects"
                type="checkbox"
                value={subject}
                checked={newClass.subjects.includes(subject)}
                onChange={() => handleSubjectChange(subject)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor={`subject-${subject}`} className="ml-2 block text-sm text-gray-900">{subject}</label>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="outline" onClick={() => { setShowNewClassForm(false); setEditingClass(null); resetNewClassForm(); }}>Cancel</Button>
        <Button variant="primary" onClick={handleCreateOrUpdateClass}>{editingClass ? 'Update Class' : 'Create Class'}</Button>
      </div>
    </div>
  );

  const uniqueGradeLevels = Array.from(new Set(classes.map(cls => cls.gradeLevel))).sort();
  const uniqueTeacherIds = Array.from(new Set(classes.map(cls => cls.teacherId)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Classes</h1>
        <Button
          variant="primary"
          icon={<PlusCircle size={16} />}
          onClick={() => { setEditingClass(null); resetNewClassForm(); setShowNewClassForm(true); }}
        >
          Add New Class
        </Button>
      </div>

      {/* New/Edit Class Form */}
      {showNewClassForm && (
        <Card title={editingClass ? `Edit Class: ${editingClass.name}` : "Add New Class"}>
          {renderClassForm()}
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <UsersRound className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Classes</dt>
              <dd className="text-2xl font-semibold text-gray-900">{classes.length}</dd>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Students (Approx)</dt>
              <dd className="text-2xl font-semibold text-gray-900">{classes.reduce((sum, cls) => sum + cls.studentsEnrolled, 0)}</dd>
            </div>
          </div>
        </Card>
         <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Avg. Class Size</dt>
              <dd className="text-2xl font-semibold text-gray-900">
                {classes.length > 0 ? (classes.reduce((sum, cls) => sum + cls.studentsEnrolled, 0) / classes.length).toFixed(1) : 0}
              </dd>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Unique Subjects</dt>
              <dd className="text-2xl font-semibold text-gray-900">{new Set(classes.flatMap(c => c.subjects)).size}</dd>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Search by class name or teacher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
              <option value="all">All Grades</option>
              {uniqueGradeLevels.map(grade => <option key={grade} value={grade}>Grade {grade}</option>)}
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <select className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
              <option value="all">All Teachers</option>
              {uniqueTeacherIds.map(id => {
                const teacher = availableTeachers.find(t => t.id === id);
                return teacher ? <option key={id} value={String(id)}>{teacher.name}</option> : null;
              })}
            </select>
          </div>
        </div>
      </Card>

      {/* Classes List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Class List</h3>
          <p className="mt-1 text-sm text-gray-500">Total {filteredClasses.length} classes found</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students (Enrolled/Capacity)</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClasses.map((cls) => (
                <tr key={cls.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{cls.name}</div>
                    <div className="text-xs text-gray-500">{cls.subjects.slice(0,3).join(', ')}{cls.subjects.length > 3 ? '...' : ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Grade {cls.gradeLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cls.teacher}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{cls.roomNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{cls.studentsEnrolled} / {cls.capacity}</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(cls.studentsEnrolled / cls.capacity) * 100}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button onClick={() => alert(`Viewing details for ${cls.name}`)} className="text-blue-600 hover:text-blue-900" title="View Class Details"><Eye size={16} /></button>
                      <button onClick={() => handleEditClass(cls)} className="text-yellow-600 hover:text-yellow-900" title="Edit Class"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteClass(cls.id)} className="text-red-600 hover:text-red-900" title="Delete Class"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-10">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter, or add a new class.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classes;