import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, Bell, MessageSquare, Search, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'; // Added XCircle
import { useNavigate, Link } from 'react-router-dom';
import clsx from 'clsx';

interface TopBarProps {
  setSidebarOpen: (open: boolean) => void;
}

const TopBar: React.FC<TopBarProps> = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Mock notifications
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', title: 'Assignment Graded', message: 'Your Math assignment "Algebra Basics" has been graded.', time: '10m ago', read: false, link: '/student/assignments' },
    { id: 2, type: 'info', title: 'New Notice Published', message: 'Parent-Teacher Meeting schedule announced.', time: '1h ago', read: false, link: '/student/notices' },
    { id: 3, type: 'warning', title: 'Fee Payment Due', message: 'Term 2 fee payment is due by July 15th.', time: '2d ago', read: true, link: '/student/fees' },
    { id: 4, type: 'error', title: 'Leave Request Rejected', message: 'Your leave request for June 20th was rejected.', time: '3d ago', read: true, link: '/student/leave-requests' },
  ]);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
  };
  
  const getNotificationIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />; // Assuming XCircle for error
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };


  return (
    <header className="bg-white shadow-sm z-20 border-b border-gray-200 sticky top-0">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8"> {/* Changed to max-w-full for wider layout */}
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden -ml-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            
            {/* Search */}
            <div className="hidden md:flex items-center ml-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full md:w-72 lg:w-96 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
                  placeholder="Search anything..."
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notification Icons */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" aria-hidden="true" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white">
                     <span className="sr-only">{unreadNotificationsCount} new notifications</span>
                  </span>
                )}
              </button>
              {/* Notification Dropdown */}
              {isNotificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 md:w-96 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none max-h-[70vh] overflow-y-auto">
                  <div className="p-2 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  </div>
                  <div className="py-1">
                    {notifications.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No new notifications.</p>
                    ) : (
                        notifications.map(notification => (
                        <Link
                            key={notification.id}
                            to={notification.link || '#'}
                            onClick={() => { markAsRead(notification.id); setIsNotificationsOpen(false); }}
                            className={clsx(
                            'block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors',
                            !notification.read && 'bg-blue-50 font-medium'
                            )}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 pt-0.5">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                    <p className={clsx("text-sm", !notification.read ? "text-gray-900" : "text-gray-600")}>{notification.title}</p>
                                    <p className={clsx("text-xs", !notification.read ? "text-gray-700" : "text-gray-500")}>{notification.message}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{notification.time}</p>
                                </div>
                                {!notification.read && <span className="h-2 w-2 rounded-full bg-blue-500 self-center"></span>}
                            </div>
                        </Link>
                        ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-gray-200 text-center">
                        <Link to="/notifications" onClick={() => setIsNotificationsOpen(false)} className="text-xs text-blue-600 hover:underline">View all notifications</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Message Icon - can be enhanced similarly if needed */}
            <button
              type="button"
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
            >
              <span className="sr-only">View messages</span>
              <MessageSquare className="h-6 w-6" aria-hidden="true" />
            </button>
            
            <div className="border-l border-gray-200 h-8 mx-2"></div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 p-1 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                id="user-menu-button"
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="true"
              >
                <img
                  className="h-9 w-9 rounded-full border-2 border-gray-200"
                  src={user.avatar || 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150'}
                  alt={`${user.name} avatar`}
                />
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-gray-800">{user.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                </div>
              </button>
              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                 <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Link to="/profile" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Your Profile</Link>
                    <Link to="/settings" onClick={() => setIsProfileMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Settings</Link>
                    <button onClick={() => { handleLogout(); setIsProfileMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;