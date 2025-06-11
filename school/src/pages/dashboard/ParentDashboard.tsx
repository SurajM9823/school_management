import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  FileText,
  DollarSign,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatsCard from '../../components/common/StatsCard';
import Button from '../../components/common/Button';

// Mock children data
const children = [
  { id: 1, name: 'Sarah Smith', grade: '10A', roll: '1024' },
  { id: 2, name: 'Michael Smith', grade: '7B', roll: '2045' }
];

const ParentDashboard: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState(children[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header with Child Switcher */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-2xl font-semibold text-gray-900">Parent Dashboard</h1>
        
        <div className="relative inline-block text-left">
          <div>
            <button
              type="button"
              className="inline-flex justify-between w-64 rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
              id="child-menu"
              aria-expanded="true"
              aria-haspopup="true"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  {selectedChild.name.charAt(0)}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{selectedChild.name}</p>
                  <p className="text-xs text-gray-500">Grade {selectedChild.grade} - Roll #{selectedChild.roll}</p>
                </div>
              </div>
              {dropdownOpen ? (
                <ChevronUp className="ml-2 h-5 w-5" aria-hidden="true" />
              ) : (
                <ChevronDown className="ml-2 h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>

          {dropdownOpen && (
            <div
              className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="child-menu"
            >
              <div className="py-1" role="none">
                {children.map((child) => (
                  <button
                    key={child.id}
                    className={`${
                      selectedChild.id === child.id ? 'bg-gray-100' : ''
                    } text-left w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                    role="menuitem"
                    onClick={() => {
                      setSelectedChild(child);
                      setDropdownOpen(false);
                    }}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        {child.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{child.name}</p>
                        <p className="text-xs text-gray-500">Grade {child.grade} - Roll #{child.roll}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Attendance"
          value="94%"
          change={{ value: '2%', trend: 'up' }}
          icon={<Clock size={24} />}
          color="green"
        />
        <StatsCard
          title="Assignments"
          value="3"
          change={{ value: '1', trend: 'down' }}
          icon={<FileText size={24} />}
          color="blue"
        />
        <StatsCard
          title="Upcoming Tests"
          value="2"
          icon={<BookOpen size={24} />}
          color="purple"
        />
        <StatsCard
          title="Fees Due"
          value="₹12,500"
          icon={<DollarSign size={24} />}
          color="red"
        />
      </div>

      {/* Academic Performance */}
      <Card title="Academic Performance">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {['Mathematics', 'Science', 'English'].map((subject) => (
            <div key={subject} className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900">{subject}</h3>
              <div className="mt-2 flex items-baseline">
                <p className="text-2xl font-semibold text-blue-600">
                  {Math.floor(Math.random() * 30) + 70}/100
                </p>
                <p className="ml-2 text-sm text-gray-500">Last test</p>
              </div>
              <div className="mt-4">
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-200">
                    <div
                      style={{
                        width: `${Math.floor(Math.random() * 30) + 70}%`,
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <Button variant="outline" size="sm">
            View Full Report
          </Button>
        </div>
      </Card>

      {/* Upcoming Events and Fee Status */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card title="Upcoming Events">
          <div className="space-y-4">
            {[
              { date: 'Jun 15', title: 'Annual Sports Day', description: 'Main Ground, 9:00 AM' },
              { date: 'Jun 20', title: 'Parent-Teacher Meeting', description: 'Classroom 10A, 4:30 PM' },
              { date: 'Jun 30', title: 'Final Term Exams Begin', description: 'As per schedule' },
            ].map((event, idx) => (
              <div key={idx} className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-md bg-blue-100 flex flex-col items-center justify-center text-blue-600">
                  <span className="text-xs font-medium">{event.date.split(' ')[0]}</span>
                  <span className="text-sm font-bold">{event.date.split(' ')[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-500">{event.description}</p>
                </div>
                <div>
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Fee Status */}
        <Card title="Fee Status">
          <div className="space-y-4">
            {[
              { term: 'Term 1 (Apr-Jun)', amount: '₹25,000', status: 'Paid', date: 'Apr 10, 2023' },
              { term: 'Term 2 (Jul-Sep)', amount: '₹25,000', status: 'Due', date: 'Jul 10, 2023' },
              { term: 'Term 3 (Oct-Dec)', amount: '₹25,000', status: 'Upcoming', date: 'Oct 10, 2023' },
              { term: 'Term 4 (Jan-Mar)', amount: '₹25,000', status: 'Upcoming', date: 'Jan 10, 2024' },
            ].map((fee, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{fee.term}</p>
                  <p className="text-xs text-gray-500">Due date: {fee.date}</p>
                </div>
                <div className="text-sm font-medium">{fee.amount}</div>
                <div>
                  {fee.status === 'Paid' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Paid
                    </span>
                  ) : fee.status === 'Due' ? (
                    <Button variant="primary" size="sm">
                      Pay Now
                    </Button>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ParentDashboard;