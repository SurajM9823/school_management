import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Calendar, Check, X, AlertTriangle, ChevronLeft, ChevronRight, UserCheck, CalendarPlus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, isSameMonth, isSameDay, parseISO, addDays } from 'date-fns';
import { Link } from 'react-router-dom'; // For linking to leave request page

interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late' | 'Half-day' | 'Holiday';
  reason?: string; // For absence or late
}

// Mock data - In a real app, this would come from an API for the logged-in student
const mockAttendance: AttendanceRecord[] = [
  { date: '2024-06-01', status: 'Present' },
  { date: '2024-06-02', status: 'Present' },
  { date: '2024-06-03', status: 'Absent', reason: 'Sick' },
  { date: '2024-06-04', status: 'Present' },
  { date: '2024-06-05', status: 'Late', reason: 'Traffic' },
  { date: '2024-06-06', status: 'Holiday' },
  { date: '2024-06-07', status: 'Holiday' },
  { date: '2024-05-28', status: 'Present' },
  { date: '2024-05-29', status: 'Half-day', reason: 'Doctor appointment' },
];

// Populate more mock data for the current month for better visualization
const today = new Date();
const startCurrentMonth = startOfMonth(today);
for (let i = 0; i < endOfMonth(today).getDate(); i++) {
    const day = addDays(startCurrentMonth, i);
    const dateStr = format(day, 'yyyy-MM-dd');
    if (!mockAttendance.find(att => att.date === dateStr)) { // Add if not already present
        const dayOfWeek = getDay(day);
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
             mockAttendance.push({ date: dateStr, status: 'Holiday' });
        } else if (i % 5 === 0 && i > 5) { // Simulate an absence
            mockAttendance.push({ date: dateStr, status: 'Absent', reason: 'Not specified' });
        } else if (i % 7 === 0 && i > 0) { // Simulate lateness
            mockAttendance.push({ date: dateStr, status: 'Late', reason: 'Woke up late' });
        }
        else {
            mockAttendance.push({ date: dateStr, status: 'Present' });
        }
    }
}
mockAttendance.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());


const Attendance: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(mockAttendance);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const monthlyStats = useMemo(() => {
    const monthRecords = attendanceData.filter(record => isSameMonth(parseISO(record.date), currentMonth));
    const workingDays = monthRecords.filter(r => r.status !== 'Holiday').length;
    const presentDays = monthRecords.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Half-day').length;
    const absentDays = monthRecords.filter(r => r.status === 'Absent').length;
    const lateDays = monthRecords.filter(r => r.status === 'Late').length;

    const overallPercentage = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;

    return {
      presentDays,
      absentDays,
      lateDays,
      workingDays,
      overallPercentage: overallPercentage.toFixed(1),
    };
  }, [attendanceData, currentMonth]);

  const getDayStatus = (day: Date): AttendanceRecord | undefined => {
    return attendanceData.find(record => isSameDay(parseISO(record.date), day));
  };

  const getStatusStyles = (status?: AttendanceRecord['status'], isCurrentDay?: boolean) => {
    let baseStyle = '';
    if (status === 'Present') baseStyle = 'bg-green-500 text-white';
    else if (status === 'Absent') baseStyle = 'bg-red-500 text-white';
    else if (status === 'Late') baseStyle = 'bg-yellow-400 text-black';
    else if (status === 'Half-day') baseStyle = 'bg-orange-400 text-black';
    else if (status === 'Holiday') baseStyle = 'bg-gray-300 text-gray-700';
    else baseStyle = 'bg-gray-100 text-gray-700';

    return `${baseStyle} ${isCurrentDay ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`;
  };

  const getStatusIcon = (status?: AttendanceRecord['status']) => {
    if (status === 'Present') return <Check size={16} />;
    if (status === 'Absent') return <X size={16} />;
    if (status === 'Late' || status === 'Half-day') return <AlertTriangle size={16} />;
    return null;
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfMonthCalendar = getDay(startOfMonth(currentMonth));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <UserCheck size={28} className="mr-3 text-green-600"/> My Attendance
        </h1>
        <Link to="/student/leave-requests">
            <Button variant="outline" icon={<CalendarPlus size={16}/>}>
                Apply for Leave
            </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-green-600">{monthlyStats.overallPercentage}%</p>
          <p className="text-sm text-gray-600 mt-1">Overall This Month</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-blue-600">{monthlyStats.presentDays}</p>
          <p className="text-sm text-gray-600 mt-1">Days Present</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-red-600">{monthlyStats.absentDays}</p>
          <p className="text-sm text-gray-600 mt-1">Days Absent</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-yellow-600">{monthlyStats.lateDays}</p>
          <p className="text-sm text-gray-600 mt-1">Late Arrivals</p>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <div className="flex justify-between items-center mb-4 px-2">
          <Button variant="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} aria-label="Previous month">
            <ChevronLeft size={24} />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} aria-label="Next month">
            <ChevronRight size={24} />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-700">
          {daysOfWeek.map(day => (<div key={day} className="py-2">{day}</div>))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonthCalendar }).map((_, i) => (
            <div key={`empty-start-${i}`} className="border rounded-md p-1 h-20 sm:h-24 bg-gray-50"></div>
          ))}
          {daysInMonth.map((day) => {
            const record = getDayStatus(day);
            const isCurrentDay = isSameDay(day, new Date());
            return (
              <div
                key={day.toString()}
                className={`border rounded-md p-1.5 sm:p-2 h-20 sm:h-24 flex flex-col justify-between text-xs sm:text-sm ${getStatusStyles(record?.status, isCurrentDay)}`}
                title={record?.reason ? `${record.status}: ${record.reason}` : record?.status}
              >
                <span className={`font-semibold ${isCurrentDay ? 'text-blue-700' : ''}`}>{format(day, 'd')}</span>
                <div className="self-center opacity-80">{getStatusIcon(record?.status)}</div>
                <span className="hidden sm:inline truncate">{record?.status === 'Holiday' ? 'Holiday' : record?.status === 'Absent' ? 'Absent' : ''}</span>
              </div>
            );
          })}
           {Array.from({ length: (7 - (daysInMonth.length + firstDayOfMonthCalendar) % 7) % 7 }).map((_, i) => (
            <div key={`empty-end-${i}`} className="border rounded-md p-1 h-20 sm:h-24 bg-gray-50"></div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-600 p-2 flex flex-wrap gap-x-4 gap-y-1">
            <strong>Legend:</strong>
            <span className="flex items-center"><span className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-1"></span> Present</span>
            <span className="flex items-center"><span className="inline-block w-3 h-3 bg-red-500 rounded-sm mr-1"></span> Absent</span>
            <span className="flex items-center"><span className="inline-block w-3 h-3 bg-yellow-400 rounded-sm mr-1"></span> Late</span>
            <span className="flex items-center"><span className="inline-block w-3 h-3 bg-orange-400 rounded-sm mr-1"></span> Half-day</span>
            <span className="flex items-center"><span className="inline-block w-3 h-3 bg-gray-300 rounded-sm mr-1"></span> Holiday</span>
        </div>
      </Card>
    </div>
  );
};

export default Attendance;