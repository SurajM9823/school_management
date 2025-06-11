import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  FileText,
  Calendar,
  PlusCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatsCard from '../../components/common/StatsCard';
import Button from '../../components/common/Button';

const TeacherDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Teacher Dashboard</h1>
        <div className="flex space-x-3">
          <Link to="/teacher/assignments">
            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle size={16} />}
            >
              New Assignment
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="My Classes"
          value="5"
          icon={<Users size={24} />}
          color="blue"
        />
        <StatsCard
          title="Attendance Today"
          value="92%"
          change={{ value: '3%', trend: 'up' }}
          icon={<Clock size={24} />}
          color="green"
        />
        <StatsCard
          title="Pending Assignments"
          value="12"
          change={{ value: '2', trend: 'down' }}
          icon={<FileText size={24} />}
          color="yellow"
        />
        <StatsCard
          title="Upcoming Tests"
          value="3"
          icon={<Calendar size={24} />}
          color="purple"
        />
      </div>

      {/* Today's Schedule */}
      <Card title="Today's Schedule">
        <div className="overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {[
              { time: '08:30 - 09:30', class: 'Class 8A', subject: 'Mathematics' },
              { time: '09:45 - 10:45', class: 'Class 9B', subject: 'Mathematics' },
              { time: '11:00 - 12:00', class: 'Class 10A', subject: 'Mathematics' },
              { time: '13:30 - 14:30', class: 'Class 7C', subject: 'Mathematics' },
              { time: '14:45 - 15:45', class: 'Class 8B', subject: 'Mathematics' },
            ].map((schedule, idx) => (
              <li key={idx} className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Clock size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {schedule.time}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {schedule.class} - {schedule.subject}
                    </p>
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      {/* Assignments to Grade and Notice Board */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Assignments to Grade">
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {[
                { class: 'Class 10A', title: 'Trigonometry Problems', due: '2 days ago', submissions: 28 },
                { class: 'Class 9B', title: 'Algebraic Equations', due: '1 day ago', submissions: 32 },
                { class: 'Class 8A', title: 'Geometry Basics', due: 'Yesterday', submissions: 25 },
              ].map((assignment, idx) => (
                <li key={idx} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {assignment.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {assignment.class} - {assignment.submissions} submissions - Due {assignment.due}
                      </p>
                    </div>
                    <div>
                      <Button variant="primary" size="sm">
                        Grade
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4">
            <Link to="/teacher/assignments" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              View all assignments →
            </Link>
          </div>
        </Card>

        <Card title="Notice Board">
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {[
                { title: 'Staff Meeting', date: 'Tomorrow, 3:30 PM', priority: 'high' },
                { title: 'Quarterly Exam Schedule Released', date: '2 days ago', priority: 'medium' },
                { title: 'Teacher Training Workshop', date: 'Next Monday', priority: 'medium' },
                { title: 'Parent-Teacher Meeting', date: 'Next Friday, 5:00 PM', priority: 'high' },
              ].map((notice, idx) => (
                <li key={idx} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          notice.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notice.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{notice.date}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;