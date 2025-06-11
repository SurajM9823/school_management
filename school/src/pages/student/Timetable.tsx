import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Clock, BookOpen, User, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns'; // isSameDay might not be needed here but good for consistency

interface Period {
  subject: string;
  teacher: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room?: string; 
  isBreak?: boolean; // To style breaks differently
}

interface DailySchedule {
  day: string; 
  periods: Period[];
}

// Mock data - For the logged-in student's class
const mockStudentTimetable: DailySchedule[] = [
  {
    day: 'Monday',
    periods: [
      { subject: 'Mathematics', teacher: 'Mr. Sharma', startTime: '09:00', endTime: '09:45', room: '101' },
      { subject: 'Physics', teacher: 'Ms. Singh', startTime: '09:45', endTime: '10:30', room: 'Lab A' },
      { subject: 'Break', teacher: '', startTime: '10:30', endTime: '10:45', isBreak: true },
      { subject: 'English', teacher: 'Mrs. Dsouza', startTime: '10:45', endTime: '11:30', room: '102' },
      { subject: 'Chemistry', teacher: 'Dr. Nath', startTime: '11:30', endTime: '12:15', room: 'Lab B' },
      { subject: 'Lunch', teacher: '', startTime: '12:15', endTime: '13:00', isBreak: true },
      { subject: 'History', teacher: 'Mr. Lal', startTime: '13:00', endTime: '13:45', room: '103' },
      { subject: 'Geography', teacher: 'Ms. Geeta', startTime: '13:45', endTime: '14:30', room: '103' },
    ],
  },
  {
    day: 'Tuesday',
    periods: [
      { subject: 'Biology', teacher: 'Ms. Reddy', startTime: '09:00', endTime: '09:45', room: 'Lab C' },
      { subject: 'Mathematics', teacher: 'Mr. Sharma', startTime: '09:45', endTime: '10:30', room: '101' },
      { subject: 'Break', teacher: '', startTime: '10:30', endTime: '10:45', isBreak: true },
      { subject: 'Physics', teacher: 'Ms. Singh', startTime: '10:45', endTime: '11:30', room: 'Lab A' },
      { subject: 'English', teacher: 'Mrs. Dsouza', startTime: '11:30', endTime: '12:15', room: '102' },
      { subject: 'Lunch', teacher: '', startTime: '12:15', endTime: '13:00', isBreak: true },
      { subject: 'Computer Sci.', teacher: 'Mr. Kumar', startTime: '13:00', endTime: '13:45', room: 'Comp Lab' },
      { subject: 'Art', teacher: 'Ms. Clara', startTime: '13:45', endTime: '14:30', room: 'Art Room' },
    ],
  },
  {
    day: 'Wednesday',
    periods: [
        { subject: 'Chemistry', teacher: 'Dr. Nath', startTime: '09:00', endTime: '09:45', room: 'Lab B' },
        { subject: 'History', teacher: 'Mr. Lal', startTime: '09:45', endTime: '10:30', room: '103' },
        { subject: 'Break', teacher: '', startTime: '10:30', endTime: '10:45', isBreak: true },
        { subject: 'Mathematics', teacher: 'Mr. Sharma', startTime: '10:45', endTime: '11:30', room: '101' },
        { subject: 'Biology', teacher: 'Ms. Reddy', startTime: '11:30', endTime: '12:15', room: 'Lab C' },
        { subject: 'Lunch', teacher: '', startTime: '12:15', endTime: '13:00', isBreak: true },
        { subject: 'English', teacher: 'Mrs. Dsouza', startTime: '13:00', endTime: '13:45', room: '102' },
        { subject: 'Music', teacher: 'Mr. Strauss', startTime: '13:45', endTime: '14:30', room: 'Music Room' },
    ],
  },
  {
    day: 'Thursday',
    periods: [
        { subject: 'Physics', teacher: 'Ms. Singh', startTime: '09:00', endTime: '09:45', room: 'Lab A' },
        { subject: 'Computer Sci.', teacher: 'Mr. Kumar', startTime: '09:45', endTime: '10:30', room: 'Comp Lab' },
        { subject: 'Break', teacher: '', startTime: '10:30', endTime: '10:45', isBreak: true },
        { subject: 'Chemistry', teacher: 'Dr. Nath', startTime: '10:45', endTime: '11:30', room: 'Lab B' },
        { subject: 'Geography', teacher: 'Ms. Geeta', startTime: '11:30', endTime: '12:15', room: '103' },
        { subject: 'Lunch', teacher: '', startTime: '12:15', endTime: '13:00', isBreak: true },
        { subject: 'Mathematics', teacher: 'Mr. Sharma', startTime: '13:00', endTime: '13:45', room: '101' },
        { subject: 'P.E.', teacher: 'Mr. David', startTime: '13:45', endTime: '14:30', room: 'Field' },
    ],
  },
  {
    day: 'Friday',
    periods: [
        { subject: 'English', teacher: 'Mrs. Dsouza', startTime: '09:00', endTime: '09:45', room: '102' },
        { subject: 'Biology', teacher: 'Ms. Reddy', startTime: '09:45', endTime: '10:30', room: 'Lab C' },
        { subject: 'Break', teacher: '', startTime: '10:30', endTime: '10:45', isBreak: true },
        { subject: 'History', teacher: 'Mr. Lal', startTime: '10:45', endTime: '11:30', room: '103' },
        { subject: 'Art', teacher: 'Ms. Clara', startTime: '11:30', endTime: '12:15', room: 'Art Room' },
        { subject: 'Lunch', teacher: '', startTime: '12:15', endTime: '13:00', isBreak: true },
        { subject: 'Physics', teacher: 'Ms. Singh', startTime: '13:00', endTime: '13:45', room: 'Lab A' },
        { subject: 'Library', teacher: 'Ms. Librarian', startTime: '13:45', endTime: '14:30', room: 'Library' },
    ],
  },
  { day: 'Saturday', periods: [] },
  { day: 'Sunday', periods: [] },
];

const timeSlots = [
  '09:00 - 09:45', '09:45 - 10:30', '10:30 - 10:45', '10:45 - 11:30', 
  '11:30 - 12:15', '12:15 - 13:00', '13:00 - 13:45', '13:45 - 14:30'
];
const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Timetable: React.FC = () => {
  const [timetableData] = useState<DailySchedule[]>(mockStudentTimetable);
  const [currentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const todayName = format(currentDate, 'EEEE');
  const todaySchedule = timetableData.find(d => d.day === todayName);

  // Function to get current period (mock implementation)
  const getCurrentPeriod = (): Period | null => {
    if (!todaySchedule) return null;
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    return todaySchedule.periods.find(p => currentTime >= p.startTime && currentTime < p.endTime && !p.isBreak) || null;
  };
  const currentPeriod = getCurrentPeriod();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <CalendarDays size={28} className="mr-3 text-purple-600"/> My Timetable
        </h1>
        <div className="flex space-x-2">
            <Button variant={viewMode === 'day' ? 'primary' : 'outline'} onClick={() => setViewMode('day')} size="sm">Today's Classes</Button>
            <Button variant={viewMode === 'week' ? 'primary' : 'outline'} onClick={() => setViewMode('week')} size="sm">Full Week</Button>
        </div>
      </div>

      {viewMode === 'week' && (
        <Card>
          <div className="overflow-x-auto p-1">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-xs sm:text-sm font-medium text-gray-700 w-24 sm:w-28">Time</th>
                  {daysOrder.filter(day => day !== 'Saturday' && day !== 'Sunday').map(day => (
                    <th key={day} className={`border border-gray-300 px-2 py-2 text-xs sm:text-sm font-medium text-gray-700 ${isToday(addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), daysOrder.indexOf(day))) ? 'bg-purple-200 text-purple-800' : ''}`}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(slot => {
                  const [startTime] = slot.split(' - ');
                  return (
                    <tr key={slot}>
                      <td className="border border-gray-300 px-2 py-2 text-xs sm:text-sm text-center font-medium text-gray-600 bg-gray-50 align-middle">
                        {slot.replace(' - ', '\n-\n')}
                      </td>
                      {daysOrder.filter(day => day !== 'Saturday' && day !== 'Sunday').map(dayName => {
                        const daySchedule = timetableData.find(d => d.day === dayName);
                        const period = daySchedule?.periods.find(p => p.startTime === startTime);
                        const isCurrentClass = currentPeriod?.subject === period?.subject && currentPeriod?.startTime === period?.startTime && todayName === dayName;

                        if (period?.isBreak) {
                            return (<td key={`${dayName}-${slot}`} className="border border-gray-300 px-1 py-1 text-center bg-gray-200 text-gray-600 text-xs sm:text-sm italic align-middle">{period.subject}</td>);
                        }
                        return (
                          <td key={`${dayName}-${slot}`} className={`border border-gray-300 px-1.5 py-1.5 text-center hover:bg-purple-50 transition-colors align-top ${isCurrentClass ? 'ring-2 ring-offset-0 ring-purple-500 bg-purple-100' : ''}`}>
                            {period ? (
                              <div className="text-xs sm:text-sm">
                                <p className={`font-semibold ${isCurrentClass ? 'text-purple-800' : 'text-purple-700'}`}>{period.subject}</p>
                                <p className="text-gray-600 text-xs">{period.teacher}</p>
                                {period.room && <p className="text-gray-500 text-xs mt-0.5">Rm: {period.room}</p>}
                              </div>
                            ) : (<span className="text-gray-400">-</span>)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {viewMode === 'day' && todaySchedule && (
        <Card title={<span className="flex items-center"><Clock className="mr-2 text-purple-600"/>Today's Schedule ({format(currentDate, 'EEEE, MMM dd')})</span>}>
            {todaySchedule.periods.length > 0 ? (
                <div className="space-y-3">
                    {todaySchedule.periods.map((period, index) => {
                        const isCurrentClass = currentPeriod?.subject === period.subject && currentPeriod?.startTime === period.startTime;
                        return (
                            <div key={index} className={`p-3 rounded-md border ${period.isBreak ? 'bg-gray-100 border-gray-200' : (isCurrentClass ? 'bg-purple-100 border-purple-300 ring-2 ring-purple-500' : 'bg-purple-50 border-purple-200')}`}>
                                <div className="flex justify-between items-center">
                                    <p className={`text-sm font-semibold ${isCurrentClass ? 'text-purple-900' : 'text-purple-800'}`}>{period.startTime} - {period.endTime}</p>
                                    {period.room && <p className="text-xs text-gray-500">Room: {period.room}</p>}
                                </div>
                                <p className={`text-md mt-1 ${period.isBreak ? 'italic text-gray-600' : (isCurrentClass ? 'font-bold text-gray-900' : 'font-medium text-gray-800')}`}>{period.subject}</p>
                                {period.teacher && <p className="text-xs text-gray-600">Teacher: {period.teacher}</p>}
                                {isCurrentClass && <span className="mt-1 text-xs font-semibold text-purple-700"> (Now)</span>}
                            </div>
                        );
                    })}
                </div>
            ) : (<p className="text-center text-gray-600 py-4">No classes scheduled for today. It might be a weekend or holiday.</p>)}
        </Card>
      )}
       {viewMode === 'day' && !todaySchedule && (<Card><p className="text-center text-gray-600 py-4">No schedule information available for today ({todayName}).</p></Card>)}
    </div>
  );
};

export default Timetable;