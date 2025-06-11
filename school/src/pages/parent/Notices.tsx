import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button'; // Assuming Button component exists
import { Megaphone, Calendar, Filter, Eye, Download, Bell } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Notice {
  id: string;
  title: string;
  content: string;
  publishedDate: string; // YYYY-MM-DD
  category: 'General' | 'Academic' | 'Events' | 'Urgent' | 'Holidays';
  audience: 'All' | 'Parents' | 'Students' | 'Specific Grades'; // Could be more granular
  gradeTarget?: string; // e.g., "Grade 10", "Primary Section"
  isNew?: boolean; // To highlight new notices
  attachments?: Array<{ name: string; url: string }>;
  author?: string; // e.g., Principal, Admin Office
}

// Mock data - In a real app, this would come from an API
const mockNotices: Notice[] = [
  {
    id: 'notice001',
    title: 'Annual Sports Day Postponed',
    content: 'Dear Parents and Students, due to unforeseen weather conditions, the Annual Sports Day scheduled for June 15th has been postponed. A new date will be announced shortly. We regret any inconvenience caused.',
    publishedDate: '2024-06-10',
    category: 'Events',
    audience: 'All',
    isNew: true,
    author: 'School Administration',
  },
  {
    id: 'notice002',
    title: 'Parent-Teacher Meeting for Grade 10',
    content: 'A Parent-Teacher Meeting for Grade 10 students will be held on June 20th, 2024, from 4:30 PM to 6:00 PM in their respective classrooms. Please make it convenient to attend.',
    publishedDate: '2024-06-08',
    category: 'Academic',
    audience: 'Parents',
    gradeTarget: 'Grade 10',
    author: 'Principal',
  },
  {
    id: 'notice003',
    title: 'Summer Vacation Homework Guidelines',
    content: 'All students are requested to check the school portal for their summer vacation homework assignments. Submissions are due by July 15th. Happy holidays!',
    publishedDate: '2024-05-25',
    category: 'Academic',
    audience: 'Students',
    attachments: [{ name: 'Homework_Guidelines.pdf', url: '#' }],
    author: 'Academic Coordinator',
  },
  {
    id: 'notice004',
    title: 'Urgent: School Closure on June 5th',
    content: 'Due to a local civic body directive, the school will remain closed on Wednesday, June 5th, 2024. Regular classes will resume on June 6th.',
    publishedDate: '2024-06-04',
    category: 'Urgent',
    audience: 'All',
    isNew: true,
    author: 'Principal',
  },
  {
    id: 'notice005',
    title: 'Fee Payment Reminder - Term 2',
    content: 'This is a gentle reminder that the last date for payment of Term 2 fees is July 15th, 2024. Please ensure timely payment to avoid late charges.',
    publishedDate: '2024-06-01',
    category: 'General',
    audience: 'Parents',
    author: 'Accounts Department',
  },
];

const noticeCategories: Notice['category'][] = ['General', 'Academic', 'Events', 'Urgent', 'Holidays'];

const Notices: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>(mockNotices);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  // Add date range filter if needed
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);

  const filteredNotices = useMemo(() => {
    return notices
      .filter(notice => categoryFilter === 'all' || notice.category === categoryFilter)
      .sort((a, b) => parseISO(b.publishedDate).getTime() - parseISO(a.publishedDate).getTime()); // Sort by newest first
  }, [notices, categoryFilter]);

  const getCategoryPillStyle = (category: Notice['category']) => {
    switch (category) {
      case 'Urgent': return 'bg-red-100 text-red-800';
      case 'Events': return 'bg-purple-100 text-purple-800';
      case 'Academic': return 'bg-blue-100 text-blue-800';
      case 'Holidays': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Megaphone size={28} className="mr-3 text-indigo-600"/> School Notices & Announcements
        </h1>
        {/* Child/Grade specific filter might be useful if notices are targeted */}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700">Filter by Category:</label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Categories</option>
              {noticeCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
        </div>
      </Card>

      {/* Notices List */}
      {filteredNotices.length > 0 ? (
        <div className="space-y-5">
          {filteredNotices.map((notice) => (
            <Card key={notice.id} className={`hover:shadow-lg transition-shadow ${notice.isNew ? 'border-2 border-indigo-400' : ''}`}>
              <div className="p-3"> {/* Reduced padding for Card content */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-2">
                  <h2 className="text-lg font-semibold text-indigo-700">{notice.title}</h2>
                  <div className="flex items-center mt-1 sm:mt-0">
                    {notice.isNew && <span className="mr-2 px-2 py-0.5 text-xs font-semibold bg-yellow-400 text-yellow-900 rounded-full flex items-center"><Bell size={12} className="mr-1"/>New</span>}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryPillStyle(notice.category)}`}>
                      {notice.category}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2 flex items-center">
                  <Calendar size={14} className="mr-1" /> Published: {format(parseISO(notice.publishedDate), 'MMM dd, yyyy')}
                  {notice.author && <span className="ml-2">| By: {notice.author}</span>}
                  {notice.gradeTarget && <span className="ml-2 text-blue-600">| For: {notice.gradeTarget}</span>}
                </p>
                
                <p className={`text-sm text-gray-700 ${expandedNoticeId !== notice.id ? 'line-clamp-3' : ''}`}>
                  {notice.content}
                </p>

                {expandedNoticeId === notice.id && notice.attachments && notice.attachments.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700">Attachments:</p>
                        <ul className="list-disc list-inside ml-4">
                        {notice.attachments.map((file, idx) => (
                            <li key={idx} className="text-sm">
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                                <Download size={14} className="mr-1"/> {file.name}
                            </a>
                            </li>
                        ))}
                        </ul>
                    </div>
                )}

                <div className="mt-3 text-right">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setExpandedNoticeId(expandedNoticeId === notice.id ? null : notice.id)}
                        icon={<Eye size={14}/>}
                    >
                        {expandedNoticeId === notice.id ? 'Show Less' : 'Read More'}
                    </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-10">
            <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Notices Found</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no notices matching your current filters, or no notices have been published yet.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Notices;