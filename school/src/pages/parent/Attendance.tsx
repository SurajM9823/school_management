import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import { Calendar, Check, X, AlertTriangle, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, isSameMonth, isSameDay, parseISO } from 'date-fns';

interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late' | 'Half-day' | 'Holiday';
  reason?: string; // For absence or late
}

// Mock data - In a real app, this would come from an API for the selected child
const mockAttendance: AttendanceRecord[] = [
  { date: '2024-06-01', status: 'Present' },
  { date: '2024-06-02', status: 'Present' },
  { date: '2024-06-03', status: 'Absent', reason: 'Sick leave' },
  { date: '2024-06-04', status: 'Present' },
  { date: '2024-06-05', status: 'Late', reason: 'Traffic delay' },
  { date: '2024-06-06', status: 'Holiday' }, // Weekend or public holiday
  { date: '2024-06-07', status: 'Holiday' },
  { date: '2024-05-28', status: 'Present' },
  { date: '2024-05-29', status: 'Half-day', reason: 'Doctor appointment' },
  // Add more data for current and previous months
];

for (let i = 8; i <= 30; i++) {
    if (i % 7 === 0 || i % 7 === 1) { // Simulate weekends
        mockAttendance.push({ date: `2024-06-${i.toString().padStart(2, '0')}`, status: 'Holiday' });
    } else if (i === 15) {
        mockAttendance.push({ date: `2024-06-${i.toString().padStart(2, '0')}`, status: 'Absent', reason: 'Family event' });
    }
    else {
        mockAttendance.push({ date: `2024-06-${i.toString().padStart(2, '0')}`, status: 'Present' });
    }
}


const Attendance: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(mockAttendance);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  // Calculate summary stats for the current month
  const monthlyStats = useMemo(() => {
    const monthRecords = attendanceData.filter(record => isSameMonth(parseISO(record.date), currentMonth));
    const workingDays = monthRecords.filter(r => r.status !== 'Holiday').length;
    const presentDays = monthRecords.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Half-day').length;
    const absentDays = monthRecords.filter(r => r.status === 'Absent').length;
    const lateDays = monthRecords.filter(r => r.status === 'Late').length;
    const halfDays = monthRecords.filter(r => r.status === 'Half-day').length;
    
    const overallPercentage = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;

    return {
      presentDays,
      absentDays,
      lateDays,
      halfDays,
      workingDays,
      overallPercentage: overallPercentage.toFixed(1),
    };
  }, [attendanceData, currentMonth]);

  const getDayStatus = (day: Date): AttendanceRecord | undefined => {
    return attendanceData.find(record => isSameDay(parseISO(record.date), day));
  };

  const getStatusStyles = (status?: AttendanceRecord['status']) => {
    switch (status) {
      case 'Present': return 'bg-green-500 text-white';
      case 'Absent': return 'bg-red-500 text-white';
      case 'Late': return 'bg-yellow-400 text-black';
      case 'Half-day': return 'bg-orange-400 text-black';
      case 'Holiday': return 'bg-gray-300 text-gray-700';
      default: return 'bg-gray-100 text-gray-700'; // For days with no record or future days
    }
  };
  
  const getStatusIcon = (status?: AttendanceRecord['status']) => {
    switch (status) {
      case 'Present': return <Check size={16} />;
      case 'Absent': return <X size={16} />;
      case 'Late': return <AlertTriangle size={16} />;
      case 'Half-day': return <AlertTriangle size={16} />; // Could use a different icon
      default: return null;
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfMonth = getDay(startOfMonth(currentMonth)); // 0 for Sunday, 1 for Monday...

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Child's Attendance</h1>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{monthlyStats.overallPercentage}%</p>
          <p className="text-sm text-gray-600">Overall Attendance</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-blue-600">{monthlyStats.presentDays}</p>
          <p className="text-sm text-gray-600">Days Present</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-red-600">{monthlyStats.absentDays}</p>
          <p className="text-sm text-gray-600">Days Absent</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-yellow-600">{monthlyStats.lateDays}</p>
          <p className="text-sm text-gray-600">Late Arrivals</p>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <div className="flex justify-between items-center mb-4 px-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-md hover:bg-gray-200"
            aria-label="Previous month"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-md hover:bg-gray-200"
            aria-label="Next month"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-700">
          {daysOfWeek.map(day => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-start-${i}`} className="border rounded-md p-1 h-20 sm:h-24"></div> // Empty cells for days before month starts
          ))}
          {daysInMonth.map((day) => {
            const record = getDayStatus(day);
            return (
              <div
                key={day.toString()}
                className={`border rounded-md p-1.5 sm:p-2 h-20 sm:h-24 flex flex-col justify-between text-xs sm:text-sm ${getStatusStyles(record?.status)}`}
                title={record?.reason ? `${record.status}: ${record.reason}` : record?.status}
              >
                <span className="font-semibold">{format(day, 'd')}</span>
                <div className="self-center opacity-80">
                    {getStatusIcon(record?.status)}
                </div>
                <span className="hidden sm:inline truncate">{record?.status === 'Holiday' ? 'Holiday' : record?.status === 'Absent' ? 'Absent' : ''}</span>
              </div>
            );
          })}
           {/* Empty cells for days after month ends to fill the grid */}
           {Array.from({ length: (7 - (daysInMonth.length + firstDayOfMonth) % 7) % 7 }).map((_, i) => (
            <div key={`empty-end-${i}`} className="border rounded-md p-1 h-20 sm:h-24"></div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-600 p-2">
            <strong>Legend:</strong>
            <span className="inline-block w-3 h-3 bg-green-500 rounded-sm mx-1 ml-2"></span> Present
            <span className="inline-block w-3 h-3 bg-red-500 rounded-sm mx-1 ml-2"></span> Absent
            <span className="inline-block w-3 h-3 bg-yellow-400 rounded-sm mx-1 ml-2"></span> Late
            <span className="inline-block w-3 h-3 bg-orange-400 rounded-sm mx-1 ml-2"></span> Half-day
            <span className="inline-block w-3 h-3 bg-gray-300 rounded-sm mx-1 ml-2"></span> Holiday/Weekend
        </div>
      </Card>
      
      {/* TODO: Add a list view for detailed records or if preferred over calendar */}
      {/* TODO: Add functionality to report an absence */}
    </div>
  );
};

export default Attendance;