import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  FileText,
  Clock,
  Award,
  DollarSign,
  Bell
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatsCard from '../../components/common/StatsCard';
import Button from '../../components/common/Button';

const StudentDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Student Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Welcome back, Student!</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/student/timetable">
            <Button
              variant="outline"
              size="sm"
              icon={<Calendar size={16} />}
            >
              Timetable
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Attendance"
          value="96%"
          change={{ value: '2%', trend: 'up' }}
          icon={<Clock size={24} />}
          color="green"
        />
        <StatsCard
          title="Assignments"
          value="5"
          change={{ value: '2', trend: 'up' }}
          icon={<FileText size={24} />}
          color="blue"
        />
        <StatsCard
          title="Upcoming Tests"
          value="3"
          icon={<BookOpen size={24} />}
          color="purple"
        />
        <StatsCard
          title="Overall Grade"
          value="A"
          icon={<Award size={24} />}
          color="yellow"
        />
      </div>

      {/* Today's Schedule */}
      <Card title="Today's Schedule">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-blue-800">Current Class</h3>
                <p className="mt-1 text-xl font-semibold text-blue-900">Mathematics</p>
                <p className="text-sm text-blue-700">Room 203 • 10:30 - 11:30 AM</p>
              </div>
              <div>
                <div className="bg-blue-100 rounded-full p-3">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Next Class</h3>
                <p className="mt-1 text-xl font-semibold text-gray-900">Science</p>
                <p className="text-sm text-gray-600">Room 105 • 11:45 - 12:45 PM</p>
              </div>
              <div>
                <div className="bg-gray-200 rounded-full p-3">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <ul className="divide-y divide-gray-200">
            {[
              { time: '09:00 - 10:00', subject: 'English Literature', room: '101' },
              { time: '10:30 - 11:30', subject: 'Mathematics', room: '203', current: true },
              { time: '11:45 - 12:45', subject: 'Science', room: '105' },
              { time: '13:30 - 14:30', subject: 'History', room: '302' },
              { time: '14:45 - 15:45', subject: 'Computer Science', room: '205' },
            ].map((schedule, idx) => (
              <li key={idx} className={`py-3 ${schedule.current ? 'bg-blue-50 rounded-md px-2' : ''}`}>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-12 text-sm font-medium text-gray-600">
                    {schedule.time.split('-')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${schedule.current ? 'text-blue-700' : 'text-gray-900'}`}>
                      {schedule.subject}
                    </p>
                    <p className={`text-xs ${schedule.current ? 'text-blue-600' : 'text-gray-500'}`}>
                      Room {schedule.room}
                    </p>
                  </div>
                  {schedule.current && (
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Current
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Assignments and Announcements */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Pending Assignments">
          <div className="space-y-4">
            {[
              { subject: 'Mathematics', title: 'Trigonometry Assignment', due: 'Tomorrow', completed: false },
              { subject: 'Science', title: 'Lab Report: Chemical Reactions', due: 'Friday', completed: false },
              { subject: 'English', title: 'Essay on Shakespeare', due: 'Monday', completed: false },
              { subject: 'History', title: 'Research on Industrial Revolution', due: 'Next Wednesday', completed: true },
            ].map((assignment, idx) => (
              <div key={idx} className="flex items-start space-x-4">
                <div className="flex-shrink-0 pt-1">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    defaultChecked={assignment.completed}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
                  <p className="text-sm text-gray-500">
                    {assignment.subject} • Due {assignment.due}
                  </p>
                </div>
                <div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link to="/student/assignments" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all assignments →
            </Link>
          </div>
        </Card>

        <Card title="Announcements">
          <div className="space-y-4">
            {[
              { title: 'Final Exam Schedule Released', date: '2 days ago', icon: <Calendar size={16} />, priority: 'high' },
              { title: 'Fee Payment Reminder', date: '1 week ago', icon: <DollarSign size={16} />, priority: 'medium' },
              { title: 'Science Exhibition Next Month', date: '3 days ago', icon: <BookOpen size={16} />, priority: 'medium' },
              { title: 'Sports Day Preparation', date: 'Yesterday', icon: <Bell size={16} />, priority: 'low' },
            ].map((announcement, idx) => (
              <div key={idx} className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  {announcement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">{announcement.title}</p>
                    <span
                      className={`ml-2 inline-block h-2 w-2 rounded-full ${
                        announcement.priority === 'high'
                          ? 'bg-red-500'
                          : announcement.priority === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                    />
                  </div>
                  <p className="text-sm text-gray-500">{announcement.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;