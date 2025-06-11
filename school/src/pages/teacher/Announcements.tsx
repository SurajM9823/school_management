import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { PlusCircle, BellRing, Trash2, Edit } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  audience: 'all' | 'students' | 'parents' | string; // string for specific class like "Class 8A"
  priority?: 'low' | 'medium' | 'high';
}

const mockAnnouncements: Announcement[] = [
  {
    id: 'anc1',
    title: 'Upcoming Parent-Teacher Meeting',
    content: 'The quarterly Parent-Teacher meeting is scheduled for next Friday. Please check your emails for specific time slots.',
    date: '2024-05-28',
    audience: 'parents',
    priority: 'high',
  },
  {
    id: 'anc2',
    title: 'Science Fair Submissions Due',
    content: 'Reminder: All Science Fair project submissions are due by this Wednesday. Late submissions will not be accepted.',
    date: '2024-05-25',
    audience: 'Class 8A', // Example of specific class
    priority: 'medium',
  },
  {
    id: 'anc3',
    title: 'School Holiday Next Monday',
    content: 'The school will be closed next Monday due to a public holiday.',
    date: '2024-05-22',
    audience: 'all',
    priority: 'low',
  },
];

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({ audience: 'all', priority: 'medium' });

  const handleSaveAnnouncement = () => {
    if (newAnnouncement.title && newAnnouncement.content) {
      if (editingAnnouncement) {
        // Update existing announcement
        setAnnouncements(prev =>
          prev.map(anc =>
            anc.id === editingAnnouncement.id ? { ...anc, ...newAnnouncement } as Announcement : anc
          )
        );
        alert('Announcement updated (mock)!');
      } else {
        // Add new announcement
        const announcementToAdd: Announcement = {
          id: `anc${announcements.length + 1 + Math.random()}`, // Ensure unique ID
          title: newAnnouncement.title!,
          content: newAnnouncement.content!,
          date: new Date().toISOString().split('T')[0],
          audience: newAnnouncement.audience!,
          priority: newAnnouncement.priority,
        };
        setAnnouncements(prev => [announcementToAdd, ...prev]);
        alert('Announcement added (mock)!');
      }
      setShowAddForm(false);
      setEditingAnnouncement(null);
      setNewAnnouncement({ audience: 'all', priority: 'medium' });
      // TODO: Implement API call
    } else {
      alert('Please provide a title and content for the announcement.');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement(announcement);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    setAnnouncements(prev => prev.filter(anc => anc.id !== id));
    // TODO: Implement API call to delete
    alert('Announcement deleted (mock)!');
  };

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
      default: return 'border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Announcements</h1>
        <Button
          variant="primary"
          icon={<PlusCircle size={16} />}
          onClick={() => { setShowAddForm(true); setEditingAnnouncement(null); setNewAnnouncement({ audience: 'all', priority: 'medium' }); }}
        >
          New Announcement
        </Button>
      </div>

      {showAddForm && (
        <Card title={editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}>
          <div className="space-y-4">
            <div>
              <label htmlFor="anc-title" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="anc-title"
                value={newAnnouncement.title || ''}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="anc-content" className="block text-sm font-medium text-gray-700">Content</label>
              <textarea
                id="anc-content"
                rows={4}
                value={newAnnouncement.content || ''}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="anc-audience" className="block text-sm font-medium text-gray-700">Audience</label>
              <select
                id="anc-audience"
                value={newAnnouncement.audience}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, audience: e.target.value as any }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="all">All Users</option>
                <option value="students">All Students</option>
                <option value="parents">All Parents</option>
                {/* TODO: Populate with actual classes if needed */}
                <option value="Class 8A">Class 8A</option>
                <option value="Class 9B">Class 9B</option>
              </select>
            </div>
            <div>
              <label htmlFor="anc-priority" className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                id="anc-priority"
                value={newAnnouncement.priority}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, priority: e.target.value as 'low' | 'medium' | 'high' }))}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={() => { setShowAddForm(false); setEditingAnnouncement(null); setNewAnnouncement({ audience: 'all', priority: 'medium' }); }}>
              Cancel
            </Button>
            <Button variant="primary" icon={<PlusCircle size={16} />} onClick={handleSaveAnnouncement}>
              {editingAnnouncement ? 'Save Changes' : 'Post Announcement'}
            </Button>
          </div>
        </Card>
      )}

      {announcements.length === 0 && !showAddForm ? (
        <Card>
          <p className="text-gray-600 text-center py-4">No announcements posted yet. Click "New Announcement" to create one.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className={`border-l-4 ${getPriorityColor(announcement.priority)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{announcement.title}</h3>
                  <p className="text-sm text-gray-500">
                    Posted on: {announcement.date} | Audience: {announcement.audience}
                    {announcement.priority && ` | Priority: ${announcement.priority}`}
                  </p>
                  <p className="text-gray-700 mt-2">{announcement.content}</p>
                </div>
                <div className="flex-shrink-0 flex space-x-2">
                   <Button variant="icon" size="sm" icon={<Edit size={16} />} onClick={() => handleEdit(announcement)} className="text-blue-600 hover:text-blue-800" />
                   <Button variant="icon" size="sm" icon={<Trash2 size={16} />} onClick={() => handleDelete(announcement.id)} className="text-red-500 hover:text-red-700" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* TODO: Implement API integration for CRUD operations */}
      {/* TODO: Add filtering by audience/priority */}
    </div>
  );
};

export default Announcements;