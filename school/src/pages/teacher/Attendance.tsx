import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Search, Clock, Download } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

// Mock data for students
const students = [
  { id: 1, name: 'Alice Johnson', rollNo: '1001', class: '10A' },
  { id: 2, name: 'Bob Smith', rollNo: '1002', class: '10A' },
  { id: 3, name: 'Charlie Brown', rollNo: '1003', class: '10A' },
  { id: 4, name: 'Diana Parker', rollNo: '1004', class: '10A' },
  { id: 5, name: 'Edward Thomas', rollNo: '1005', class: '10A' },
  { id: 6, name: 'Fiona Martin', rollNo: '1006', class: '10A' },
  { id: 7, name: 'George Wilson', rollNo: '1007', class: '10A' },
  { id: 8, name: 'Hannah Davis', rollNo: '1008', class: '10A' },
  { id: 9, name: 'Ian Roberts', rollNo: '1009', class: '10A' },
  { id: 10, name: 'Jane Miller', rollNo: '1010', class: '10A' },
];

// Mock attendance data
const initialAttendance = students.map(student => ({
  studentId: student.id,
  status: 'present', // present, absent, late, leave
}));

type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

interface AttendanceRecord {
  studentId: number;
  status: AttendanceStatus;
}

const Attendance: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('10A');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.includes(searchTerm)
  );

  const handleAttendanceChange = (studentId: number, status: AttendanceStatus) => {
    setAttendance(prev => 
      prev.map(record => 
        record.studentId === studentId ? { ...record, status } : record
      )
    );
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return <div className="h-4 w-4 rounded-full bg-green-500"></div>;
      case 'absent':
        return <div className="h-4 w-4 rounded-full bg-red-500"></div>;
      case 'late':
        return <div className="h-4 w-4 rounded-full bg-yellow-500"></div>;
      case 'leave':
        return <div className="h-4 w-4 rounded-full bg-blue-500"></div>;
      default:
        return null;
    }
  };

  const countByStatus = (status: AttendanceStatus) => {
    return attendance.filter(record => record.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Attendance Management</h1>
        <Button
          variant="outline"
          size="sm"
          icon={<Download size={16} />}
        >
          Export
        </Button>
      </div>

      {/* Filters and Date Selection */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="date"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="relative rounded-md shadow-sm">
          <select
            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="10A">Class 10A</option>
            <option value="9B">Class 9B</option>
            <option value="8A">Class 8A</option>
          </select>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Present</p>
              <p className="text-xl font-semibold text-gray-900">{countByStatus('present')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full bg-red-500"></div>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Absent</p>
              <p className="text-xl font-semibold text-gray-900">{countByStatus('absent')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full bg-yellow-500"></div>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Late</p>
              <p className="text-xl font-semibold text-gray-900">{countByStatus('late')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full bg-blue-500"></div>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Leave</p>
              <p className="text-xl font-semibold text-gray-900">{countByStatus('leave')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Attendance for Class {selectedClass} - {format(new Date(selectedDate), 'MMMM dd, yyyy')}
          </h2>
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Last updated: {format(new Date(), 'h:mm a')}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Roll No
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const attendanceRecord = attendance.find(record => record.studentId === student.id);
                const status = attendanceRecord ? attendanceRecord.status : 'present';

                return (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.rollNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(status)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">{status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAttendanceChange(student.id, 'present')}
                          className={`px-2 py-1 rounded text-xs font-medium ${status === 'present' ? 'bg-green-100 text-green-800 ring-1 ring-green-600' : 'bg-gray-100 text-gray-800 hover:bg-green-50'}`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.id, 'absent')}
                          className={`px-2 py-1 rounded text-xs font-medium ${status === 'absent' ? 'bg-red-100 text-red-800 ring-1 ring-red-600' : 'bg-gray-100 text-gray-800 hover:bg-red-50'}`}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.id, 'late')}
                          className={`px-2 py-1 rounded text-xs font-medium ${status === 'late' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600' : 'bg-gray-100 text-gray-800 hover:bg-yellow-50'}`}
                        >
                          Late
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(student.id, 'leave')}
                          className={`px-2 py-1 rounded text-xs font-medium ${status === 'leave' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-600' : 'bg-gray-100 text-gray-800 hover:bg-blue-50'}`}
                        >
                          Leave
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500">No students found</p>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button
            variant="primary"
            size="md"
          >
            Save Attendance
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Attendance;