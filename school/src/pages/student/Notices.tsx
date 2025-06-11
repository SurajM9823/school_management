import React, { useState, useMemo } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Megaphone, Calendar, Filter, Eye, Download, Bell, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Notice {
  id: string;
  title: string;
  content: string;
  publishedDate: string; // YYYY-MM-DD
  category: 'General' | 'Academic' | 'Events' | 'Urgent' | 'Holidays' | 'Exams' | 'Clubs';
  audience: 'All' | 'Students' | 'Specific Grades';
  gradeTarget?: string; // e.g., "Grade 10", "Senior School"
  isNew?: boolean;
  attachments?: Array<{ name: string; url: string }>;
  author?: string;
}

// Mock data - Tailored for students
const mockNotices: Notice[] = [
  {
    id: 'snotice001',
    title: 'Annual Sports Day Schedule & Registrations',
    content: 'The Annual Sports Day is approaching! Registrations for various events are now open. Please find the detailed schedule and registration link attached. Last date for registration is June 12th.',
    publishedDate: '2024-06-08',
    category: 'Events',
    audience: 'Students',
    isNew: true,
    attachments: [{ name: 'Sports_Day_Schedule.pdf', url: '#'}, { name: 'Registration_Form.docx', url: '#'}],
    author: 'Sports Committee',
  },
  {
    id: 'snotice002',
    title: 'Mid-Term Exam Timetable (Grades 9-12)',
    content: 'The timetable for the upcoming Mid-Term examinations for Grades 9 to 12 has been published. Please check the attached document for your respective schedule. All the best!',
    publishedDate: '2024-06-05',
    category: 'Exams',
    audience: 'Specific Grades',
    gradeTarget: 'Grades 9-12',
    attachments: [{ name: 'MidTerm_Timetable_Senior.pdf', url: '#'}],
    author: 'Examination Department',
  },
  {
    id: 'snotice003',
    title: 'Library Book Return Reminder',
    content: 'All students are reminded to return any overdue library books by this Friday, June 14th, to avoid fines. You can check your borrowed books status on the library portal.',
    publishedDate: '2024-06-10',
    category: 'General',
    audience: 'Students',
    isNew: true,
    author: 'Librarian',
  },
  {
    id: 'snotice004',
    title: 'Science Club Meeting - Project Discussion',
    content: 'There will be a Science Club meeting this Thursday at 3:00 PM in the Physics Lab to discuss upcoming project ideas for the inter-school fair. All members are requested to attend.',
    publishedDate: '2024-06-09',
    category: 'Clubs',
    audience: 'Students', // Or specific to club members
    author: 'Science Club Coordinator',
  },
];

const noticeCategories: Notice['category'][] = ['General', 'Academic', 'Events', 'Urgent', 'Holidays', 'Exams', 'Clubs'];

const Notices: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>(mockNotices);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(null);

  const filteredNotices = useMemo(() => {
    return notices
      .filter(notice => categoryFilter === 'all' || notice.category === categoryFilter)
      .sort((a, b) => parseISO(b.publishedDate).getTime() - parseISO(a.publishedDate).getTime());
  }, [notices, categoryFilter]);

  const getCategoryPillStyle = (category: Notice['category']) => {
    if (category === 'Urgent') return 'bg-red-100 text-red-800';
    if (category === 'Events' || category === 'Clubs') return 'bg-purple-100 text-purple-800';
    if (category === 'Academic' || category === 'Exams') return 'bg-blue-100 text-blue-800';
    if (category === 'Holidays') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800'; // General
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
          <Megaphone size={28} className="mr-3 text-indigo-600"/> Notices & Announcements
      </h1>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-4">
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700">Filter by Category:</label>
            <select id="categoryFilter" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 rounded-md">
              <option value="all">All Categories</option>
              {noticeCategories.map(category => (<option key={category} value={category}>{category}</option>))}
            </select>
        </div>
      </Card>

      {/* Notices List */}
      {filteredNotices.length > 0 ? (
        <div className="space-y-5">
          {filteredNotices.map((notice) => (
            <Card key={notice.id} className={`hover:shadow-lg transition-shadow ${notice.isNew ? 'border-2 border-indigo-400' : ''}`}>
              <div className="p-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-2">
                  <h2 className="text-lg font-semibold text-indigo-700">{notice.title}</h2>
                  <div className="flex items-center mt-1 sm:mt-0">
                    {notice.isNew && <span className="mr-2 px-2 py-0.5 text-xs font-semibold bg-yellow-400 text-yellow-900 rounded-full flex items-center"><Bell size={12} className="mr-1"/>New</span>}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getCategoryPillStyle(notice.category)}`}>{notice.category}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2 flex items-center">
                  <Calendar size={14} className="mr-1" /> Published: {format(parseISO(notice.publishedDate), 'MMM dd, yyyy')}
                  {notice.author && <span className="ml-2">| By: {notice.author}</span>}
                  {notice.gradeTarget && <span className="ml-2 text-blue-600">| For: {notice.gradeTarget}</span>}
                </p>
                
                <p className={`text-sm text-gray-700 ${expandedNoticeId !== notice.id ? 'line-clamp-3' : ''}`}>{notice.content}</p>

                {expandedNoticeId === notice.id && notice.attachments && notice.attachments.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700">Attachments:</p>
                        <ul className="list-disc list-inside ml-4">
                        {notice.attachments.map((file, idx) => (
                            <li key={idx} className="text-sm"><a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center"><Download size={14} className="mr-1"/> {file.name}</a></li>
                        ))}
                        </ul>
                    </div>
                )}

                <div className="mt-3 text-right">
                    <Button variant="outline" size="sm" icon={<Eye size={14}/>} onClick={() => setExpandedNoticeId(expandedNoticeId === notice.id ? null : notice.id)}>
                        {expandedNoticeId === notice.id ? 'Show Less' : 'Read More'}
                    </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><div className="text-center py-10"><Info className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No Notices Found</h3><p className="mt-1 text-sm text-gray-500">No notices match your filters, or none have been published yet.</p></div></Card>
      )}
    </div>
  );
};

export default Notices;