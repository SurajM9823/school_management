import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Search, Clock, Download } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import api from '../../api';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

interface AttendanceRecord {
    studentId: number;
    status: AttendanceStatus;
}

interface ClassItem {
    id: number;
    name: string;
}

interface StudentItem {
    id: number;
    user: number;
    admission_number: string;
    status: string;
    class_id: number;
    section: number | null;
    // Add other fields as needed
    name?: string; // For display, if available
    rollNo?: string; // For display, if available
}

const Attendance: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [selectedClass, setSelectedClass] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [showLeavePopup, setShowLeavePopup] = useState(false);
    const [leaveStudent, setLeaveStudent] = useState<{ id: number; name: string } | null>(null);
    const [showSummary, setShowSummary] = useState(false);
    const [attendanceSummary, setAttendanceSummary] = useState<any[]>([]);
    const [showAllAttendance, setShowAllAttendance] = useState(false);
    const [allAttendance, setAllAttendance] = useState<any[]>([]);

    // Fetch classes on mount
    useEffect(() => {
        api.get('/teacher/classes/')
            .then(res => {
                setClasses(res.data);
                if (res.data.length > 0) {
                    setSelectedClass(res.data[0].id);
                }
            });
    }, []);

    // Fetch students and attendance when selectedClass or selectedDate changes
    useEffect(() => {
        if (selectedClass) {
            api.get(`/teacher/classes/${selectedClass}/students/`)
                .then(res => {
                    setStudents(res.data);
                    // Fetch attendance for this class and date
                    api.get('/teacher/attendance/list/', {
                        params: { class_id: selectedClass, date: selectedDate }
                    }).then(attRes => {
                        // Map attendance from backend to local state
                        const attendanceMap: Record<number, AttendanceStatus> = {};
                        attRes.data.forEach((a: any) => {
                            attendanceMap[a.student] = a.status;
                        });
                        setAttendance(res.data.map((student: StudentItem) => ({
                            studentId: student.id,
                            status: attendanceMap[student.id] || 'absent'
                        })));
                    });
                });
        } else {
            setStudents([]);
            setAttendance([]);
        }
    }, [selectedClass, selectedDate]);

    // Filter students based on search term
    const filteredStudents = students.filter(student =>
        (student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.admission_number?.includes(searchTerm) ||
            student.rollNo?.includes(searchTerm))
    );

    // Actions: update attendance state for a student
    const handleAttendanceChange = (studentId: number, status: AttendanceStatus) => {
        setAttendance(prev =>
            prev.map(record =>
                record.studentId === studentId ? { ...record, status } : record
            )
        );
    };

    // Toggle present/absent status
    const handleTogglePresentAbsent = (studentId: number) => {
        setAttendance(prev =>
            prev.map(record =>
                record.studentId === studentId
                    ? { ...record, status: record.status === 'present' ? 'absent' : 'present' }
                    : record
            )
        );
    };

    // Show leave popup
    const handleLeaveClick = (student: StudentItem) => {
        setLeaveStudent({ id: student.id, name: student.name || student.admission_number });
        setShowLeavePopup(true);
    };

    // Confirm leave
    const handleConfirmLeave = () => {
        if (leaveStudent) {
            handleAttendanceChange(leaveStudent.id, 'leave');
        }
        setShowLeavePopup(false);
        setLeaveStudent(null);
    };

    // Cancel leave
    const handleCancelLeave = () => {
        setShowLeavePopup(false);
        setLeaveStudent(null);
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

    const handleSaveAttendance = async () => {
        if (!selectedClass) return;
        await api.post('/teacher/attendance/save/', {
            class_id: selectedClass,
            section: null,
            date: selectedDate,
            attendance: attendance.map(a => ({
                student: a.studentId,
                status: a.status
            }))
        });
        // Fetch summary for this class/date
        const res = await api.get('/teacher/attendance/list/', {
            params: { class_id: selectedClass, date: selectedDate }
        });
        setAttendanceSummary(res.data);
        setShowSummary(true);
    };

    const handleViewAllAttendance = async () => {
        if (!selectedClass) return;
        const res = await api.get('/teacher/attendance/list/', {
            params: { class_id: selectedClass }
        });
        setAllAttendance(res.data);
        setShowAllAttendance(true);
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
                {/* Class dropdown first */}
                <div className="relative rounded-md shadow-sm">
                    <select
                        className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={selectedClass ?? ''}
                        onChange={(e) => setSelectedClass(Number(e.target.value))}
                    >
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>
                </div>
                {/* Date picker second */}
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
                {/* Search third */}
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
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">
                        Attendance for Class {selectedClass} - {format(new Date(selectedDate), 'MMMM dd, yyyy')}
                    </h2>
                    <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-500">Last updated: {format(new Date(), 'h:mm a')}</span>
                        <Button variant="outline" size="sm" onClick={handleViewAllAttendance}>
                            View All Attendance
                        </Button>
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
                            const status = attendanceRecord ? attendanceRecord.status : 'absent';

                            return (
                                <tr key={student.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {student.admission_number || student.rollNo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {student.name || student.admission_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {getStatusIcon(status)}
                                            <span className="ml-2 text-sm text-gray-900 capitalize">{status}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2 items-center">
                                            {/* Toggle button for present/absent */}
                                            <button
                                                type="button"
                                                className={`h-4 w-8 flex items-center rounded-full transition-colors duration-200 focus:outline-none ${
                                                    status === 'present' ? 'bg-green-200' : status === 'absent' ? 'bg-red-200' : 'bg-gray-200'
                                                }`}
                                                onClick={() => handleTogglePresentAbsent(student.id)}
                                                title="Toggle Present/Absent"
                                            >
                          <span
                              className={`h-4 w-4 rounded-full transition-transform duration-200 ${
                                  status === 'present'
                                      ? 'bg-green-500'
                                      : status === 'absent'
                                          ? 'bg-red-500 translate-x-4'
                                          : 'bg-gray-400'
                              }`}
                              style={{
                                  transform: status === 'absent' ? 'translateX(100%)' : 'translateX(0)',
                              }}
                          ></span>
                                            </button>
                                            {/* Late button */}
                                            <button
                                                onClick={() => handleAttendanceChange(student.id, 'late')}
                                                className={`px-2 py-1 rounded text-xs font-medium ${status === 'late' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600' : 'bg-gray-100 text-gray-800 hover:bg-yellow-50'}`}
                                            >
                                                Late
                                            </button>
                                            {/* Leave button */}
                                            <button
                                                onClick={() => handleLeaveClick(student)}
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
                        onClick={handleSaveAttendance}
                    >
                        Save Attendance
                    </Button>
                </div>

                {/* Leave Popup */}
                {showLeavePopup && leaveStudent && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                            <h3 className="text-lg font-semibold mb-2">Leave Confirmation</h3>
                            <p className="mb-4">
                                Are you sure you want to mark <span className="font-bold">{leaveStudent.name}</span> as <span className="text-blue-600 font-bold">Leave</span>?
                            </p>
                            <div className="flex justify-end space-x-2">
                                <button
                                    onClick={handleCancelLeave}
                                    className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmLeave}
                                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Summary Popup */}
                {showSummary && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
                            <h3 className="text-lg font-semibold mb-2">Attendance Saved</h3>
                            <div className="mb-4">
                                <div className="font-medium mb-2">Date: {selectedDate}</div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {attendanceSummary.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-2">{item.admission_number}</td>
                                                <td className="px-4 py-2">{item.student_name}</td>
                                                <td className="px-4 py-2 capitalize">{item.status}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="primary" size="sm" onClick={() => setShowSummary(false)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Attendance Popup */}
                {showAllAttendance && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
                            <h3 className="text-lg font-semibold mb-2">All Attendance Records</h3>
                            <div className="mb-4">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead>
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {allAttendance.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-2">{item.date}</td>
                                                <td className="px-4 py-2">{item.admission_number}</td>
                                                <td className="px-4 py-2">{item.student_name}</td>
                                                <td className="px-4 py-2 capitalize">{item.status}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="primary" size="sm" onClick={() => setShowAllAttendance(false)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Attendance;
