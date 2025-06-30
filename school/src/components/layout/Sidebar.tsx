// src/components/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';
import logo from '../../../public/images/smslogo.png'; 
import api from '../../api'; 
import {
  School,
  Users,
  BookOpen,
  Calendar,
  FileText,
  Award,
  DollarSign,
  Clock,
  BellRing,
  MessageSquare,
  User,
  Settings,
  Edit3,
  ClipboardCheck,
  Briefcase,
  Bus,
  Building2,
  CreditCard,
  Activity,
} from 'lucide-react';

// Define backend base URL
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  current: boolean;
}

interface SchoolData{
  name: string;
  address: string;
  contact: string;
  email: string;
  logo: string | null;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, current }) => (
  <Link
    to={to}
    className={clsx(
      current
        ? 'text-primary border-l-4 border-darkPrimary font-semibold bg-lightPrimary'
        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
      'group flex items-center px-3 py-2 text-sm font-medium transition-all duration-150'
    )}
  >
    <div className={clsx('mr-3 flex-shrink-0 h-5 w-5', current ? 'text-darkPrimary' : 'text-gray-500 group-hover:text-gray-700')}>
      {icon}
    </div>
    <span className="truncate" >{label}</span>
  </Link>
);

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!user) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/school/settings');
        const data = response.data;
        // Prepend backend base URL to logo path if it exists
        if (data.logo && typeof data.logo === 'string' && data.logo.startsWith('/media')) {
          data.logo = `${BACKEND_BASE_URL}${data.logo}`;
        }
        setSchoolData({ name: data.name, address: data.address ,contact: data.contact,email: data.email,logo: data.logo });//eslint-disable-next-line
      } catch (err: any ) {
        console.error('Fetch school data error:', err);
        setError('Failed to load school data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolData();
  }, [user]);
  
  if (!user) return null;
  const getNavigationLinks = () => {
    if (user.is_superuser) {
      return [
        { to: '/superadmin/dashboard', icon: <School size={16} />, label: 'Dashboard' },
        { to: '/superadmin/add-school', icon: <Building2 size={18} />, label: 'Add School' },
        { to: '/superadmin/activities', icon: <Activity size={18} />, label: 'Activity Tracker' },
        { to: '/superadmin/settings', icon: <Settings size={18} />, label: 'Settings' },
      ];
    }
    switch (user.role) {
      case 'admin':
        return [
          { to: '/admin/dashboard', icon: <School size={18} />, label: 'Dashboard' },
          { to: '/admin/admissions', icon: <Users size={18} />, label: 'Admissions' },
          { to: '/admin/teachers', icon: <BookOpen size={18} />, label: 'Teachers' },
          { to: '/admin/staff-management', icon: <Briefcase size={18} />, label: 'Staff Management' },
          { to: '/admin/classes', icon: <Calendar size={18} />, label: 'Classes' },
          { to: '/admin/exams', icon: <FileText size={18} />, label: 'Exams' },
          { to: '/admin/scholarships', icon: <Award size={18} />, label: 'Scholarships' },
          { to: '/admin/transport-management', icon: <Bus size={18} />, label: 'Transport' },
          { to: '/admin/user-management', icon: <Users size={18} />, label: 'User Management' },
          { to: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
        ];
      case 'teacher':
        return [
          { to: '/teacher/dashboard', icon: <School size={18} />, label: 'Dashboard' },
          { to: '/teacher/my-classes', icon: <Users size={18} />, label: 'My Classes' },
          { to: '/teacher/attendance', icon: <Clock size={18} />, label: 'Attendance' },
          { to: '/teacher/schedule', icon: <Calendar size={18} />, label: 'Schedule' },
          { to: '/teacher/assignments', icon: <FileText size={18} />, label: 'Assignments' },
          { to: '/teacher/exam-marks', icon: <Edit3 size={18} />, label: 'Exam Marks' },
          { to: '/teacher/grades', icon: <Award size={18} />, label: 'View Grades' },
          { to: '/teacher/materials', icon: <BookOpen size={18} />, label: 'Reading Materials' },
          { to: '/teacher/announcements', icon: <BellRing size={18} />, label: 'Announcements' },
          { to: '/teacher/leave', icon: <ClipboardCheck size={18} />, label: 'Apply for Leave' },
        ];
      case 'parent':
        return [
          { to: '/parent/dashboard', icon: <School size={18} />, label: 'Dashboard' },
          { to: '/parent/children', icon: <Users size={18} />, label: 'My Children' },
          { to: '/parent/child-classes', icon: <BookOpen size={18} />, label: "Child's Classes" },
          { to: '/parent/assignments', icon: <FileText size={18} />, label: 'Assignments' },
          { to: '/parent/timetable', icon: <Calendar size={18} />, label: 'Timetable' },
          { to: '/parent/results', icon: <Award size={18} />, label: 'Exams & Results' },
          { to: '/parent/attendance', icon: <Clock size={18} />, label: 'Attendance' },
          { to: '/parent/fees', icon: <DollarSign size={18} />, label: 'Fees & Payments' },
          { to: '/parent/leave-requests', icon: <ClipboardCheck size={18} />, label: 'Leave Requests' },
          { to: '/parent/notices', icon: <BellRing size={18} />, label: 'Notices' },
          { to: '/parent/complaints', icon: <MessageSquare size={18} />, label: 'Complaints' },
        ];
      case 'student':
        return [
          { to: '/student/dashboard', icon: <School size={18} />, label: 'Dashboard' },
          { to: '/student/my-classes', icon: <BookOpen size={18} />, label: 'My Classes' },
          { to: '/student/assignments', icon: <FileText size={18} />, label: 'Assignments' },
          { to: '/student/timetable', icon: <Calendar size={18} />, label: 'Timetable' },
          { to: '/student/results', icon: <Award size={18} />, label: 'Exams & Results' },
          { to: '/student/attendance', icon: <Clock size={18} />, label: 'Attendance' },
          { to: '/student/fees', icon: <DollarSign size={18} />, label: 'Fees & Payments' },
          { to: '/student/leave', icon: <ClipboardCheck size={18} />, label: 'Leave Requests' },
          { to: '/student/notices', icon: <BellRing size={18} />, label: 'Notices' },
          { to: '/student/complaints', icon: <MessageSquare size={18} />, label: 'Complaint Box' },
        ];
      case 'accountant':
        return [
          { to: '/accountant/dashboard', icon: <School size={18} />, label: 'Dashboard' },
          { to: '/accountant/fees', icon: <DollarSign size={18} />, label: 'Fee Management' },
          { to: '/accountant/fee-structures', icon: <FileText size={18} />, label: 'Fee Structures' },
          { to: '/accountant/payroll', icon: <Users size={18} />, label: 'Payroll' },
          { to: '/accountant/scholarships', icon: <Award size={18} />, label: 'Scholarships' },
          { to: '/accountant/expenses', icon: <DollarSign size={18} />, label: 'Expenses' },
          { to: '/accountant/reports', icon: <FileText size={18} />, label: 'Financial Reports' },
          { to: '/accountant/settings', icon: <Settings size={18} />, label: 'Settings' },
        ];
      default:
        return [];
    }
  };

  const navigation = getNavigationLinks();

  const renderOverlay = () => (
    <div
      className={clsx(
        open ? 'block' : 'hidden',
        'fixed inset-0 z-20 transition-opacity bg-gray-600 bg-opacity-75 md:hidden'
      )}
      onClick={() => setOpen(false)}
    />
  );

  return (
    <>
      {renderOverlay()}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-30 w-64 bg-gray-200 transition duration-300 transform md:translate-x-0 md:static md:inset-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="bg-blue-200 shadow-sm z-20 sticky top-0 flex items-center justify-center" style={{ height: '66px', background: '#167F92' }}>
          <div className="flex items-center justify-center">
            {isLoading ? (
              <div className="h-12 w-12 animate-pulse rounded-md" />
            ) : error || !schoolData?.logo ? (
               <img src={logo} alt="Logo" className="h-12" />
            ) : (
              <img
                src={schoolData.logo}
                alt="School Logo"
                className="h-12 w-auto object-contain"
                onError={() => setSchoolData({ ...schoolData, logo: null })}
              />
            )}
            <span className="ml-2 text-white text-sm font-bold truncate">
              {isLoading
              ? 'Loading...'
              : (schoolData?.name
                ? schoolData.name
                  .split(' ')
                  .map(word => word[0]?.toUpperCase() || '')
                  .join('')
                : 'SMS')}
            </span>
          </div>
        </div>
        <div className="mt-1 flex flex-col flex-grow">
          <nav className="flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <SidebarLink
                key={item.to}
                to={item.to}
                icon={React.cloneElement(item.icon as React.ReactElement, {
                  className: location.pathname === item.to ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700',
                })}
                label={item.label}
                current={location.pathname === item.to || (item.to === '/superadmin/settings' && location.pathname.startsWith('/superadmin/settings'))}
              />
            ))}
          </nav>
          <div className="px-2 mt-auto border-t border-darkPrimary pt-1">
            <Link
              to="/profile"
              className={clsx(
                location.pathname === '/profile'
                  ? ' text-primary border-l-4 border-darkPrimary font-semibold bg-lightPrimary'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
                'group flex items-center px-3 py-3 text-sm font-medium rounded-r-md'
              )}
            >
              <User
                className={clsx(
                  'mr-3 flex-shrink-0 h-5 w-5',
                  location.pathname === '/profile' ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
                )}
              />
              <span className="truncate">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;