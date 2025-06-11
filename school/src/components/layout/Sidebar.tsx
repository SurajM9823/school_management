import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';
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
} from 'lucide-react';

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

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, current }) => (
  <Link
    to={to}
    className={clsx(
      current
        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600 font-semibold'
        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
      'group flex items-center px-3 py-3 text-sm font-medium rounded-r-md transition-all duration-150'
    )}
  >
    <div className={clsx('mr-3 flex-shrink-0 h-5 w-5', current ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700')}>
      {icon}
    </div>
    <span className="truncate">{label}</span>
  </Link>
);

const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getNavigationLinks = () => {
    switch (user.role) {
      case 'admin':
        return [
          { to: '/admin/dashboard', icon: <School size={20} />, label: 'Dashboard' },
          { to: '/admin/admissions', icon: <Users size={20} />, label: 'Admissions' },
          { to: '/admin/teachers', icon: <BookOpen size={20} />, label: 'Teachers' },
          { to: '/admin/staff-management', icon: <Briefcase size={20} />, label: 'Staff Management' },
          { to: '/admin/classes', icon: <Calendar size={20} />, label: 'Classes' },
          { to: '/admin/exams', icon: <FileText size={20} />, label: 'Exams' },
          { to: '/admin/scholarships', icon: <Award size={20} />, label: 'Scholarships' },
          { to: '/admin/transport-management', icon: <Bus size={20} />, label: 'Transport' },
          { to: '/admin/user-management', icon: <Users size={20} />, label: 'User Management' },
          { to: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
        ];
      case 'teacher':
        return [
          { to: '/teacher/dashboard', icon: <School size={20} />, label: 'Dashboard' },
          { to: '/teacher/my-classes', icon: <Users size={20} />, label: 'My Classes' },
          { to: '/teacher/attendance', icon: <Clock size={20} />, label: 'Attendance' },
          { to: '/teacher/schedule', icon: <Calendar size={20} />, label: 'Schedule' },
          { to: '/teacher/assignments', icon: <FileText size={20} />, label: 'Assignments' },
          { to: '/teacher/exam-marks', icon: <Edit3 size={20} />, label: 'Exam Marks' },
          { to: '/teacher/grades', icon: <Award size={20} />, label: 'View Grades' },
          { to: '/teacher/materials', icon: <BookOpen size={20} />, label: 'Reading Materials' },
          { to: '/teacher/announcements', icon: <BellRing size={20} />, label: 'Announcements' },
          { to: '/teacher/leave', icon: <ClipboardCheck size={20} />, label: 'Apply for Leave' },
        ];
      case 'parent':
        return [
          { to: '/parent/dashboard', icon: <School size={20} />, label: 'Dashboard' },
          { to: '/parent/children', icon: <Users size={20} />, label: 'My Children' },
          { to: '/parent/child-classes', icon: <BookOpen size={20} />, label: "Child's Classes" },
          { to: '/parent/assignments', icon: <FileText size={20} />, label: 'Assignments' },
          { to: '/parent/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
          { to: '/parent/results', icon: <Award size={20} />, label: 'Exams & Results' },
          { to: '/parent/attendance', icon: <Clock size={20} />, label: 'Attendance' },
          { to: '/parent/fees', icon: <DollarSign size={20} />, label: 'Fees & Payments' },
          { to: '/parent/leave-requests', icon: <ClipboardCheck size={20} />, label: 'Leave Requests' },
          { to: '/parent/notices', icon: <BellRing size={20} />, label: 'Notices' },
          { to: '/parent/complaints', icon: <MessageSquare size={20} />, label: 'Complaints' },
        ];
      case 'student':
        return [
          { to: '/student/dashboard', icon: <School size={20} />, label: 'Dashboard' },
          { to: '/student/my-classes', icon: <BookOpen size={20} />, label: 'My Classes' },
          { to: '/student/assignments', icon: <FileText size={20} />, label: 'Assignments' },
          { to: '/student/timetable', icon: <Calendar size={20} />, label: 'Timetable' },
          { to: '/student/results', icon: <Award size={20} />, label: 'Exams & Results' },
          { to: '/student/attendance', icon: <Clock size={20} />, label: 'Attendance' },
          { to: '/student/fees', icon: <DollarSign size={20} />, label: 'Fees & Payments' },
          { to: '/student/leave', icon: <ClipboardCheck size={20} />, label: 'Leave Requests' },
          { to: '/student/notices', icon: <BellRing size={20} />, label: 'Notices' },
          { to: '/student/complaints', icon: <MessageSquare size={20} />, label: 'Complaint Box' },
        ];
      case 'accountant':
        return [
          { to: '/accountant/dashboard', icon: <School size={20} />, label: 'Dashboard' },
          { to: '/accountant/fees', icon: <DollarSign size={20} />, label: 'Fee Management' },
          { to: '/accountant/fee-structures', icon: <FileText size={20} />, label: 'Fee Structures' },
          { to: '/accountant/payroll', icon: <Users size={20} />, label: 'Payroll' },
          { to: '/accountant/scholarships', icon: <Award size={20} />, label: 'Scholarships' },
          { to: '/accountant/expenses', icon: <DollarSign size={20} />, label: 'Expenses' },
          { to: '/accountant/reports', icon: <FileText size={20} />, label: 'Financial Reports' },
          { to: '/accountant/settings', icon: <Settings size={20} />, label: 'Settings' },
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
          'fixed inset-y-0 left-0 z-30 w-64 bg-gray-50 border-gray-200 transition duration-300 transform md:translate-x-0 md:static md:inset-0 md:border-r',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-center h-16 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <School className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-blue-700 text-lg font-semibold">EduSync</span>
          </div>
        </div>
        <div className="mt-5 flex flex-col flex-grow">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => (
              <SidebarLink
                key={item.to}
                to={item.to}
                icon={React.cloneElement(item.icon as React.ReactElement, {
                  className: location.pathname === item.to ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700',
                })}
                label={item.label}
                current={location.pathname === item.to || (item.to === '/admin/settings' && location.pathname.startsWith('/admin/settings'))}
              />
            ))}
          </nav>
          <div className="px-2 pb-4 mt-auto border-t border-gray-200 pt-4">
            <Link
              to="/profile"
              className={clsx(
                location.pathname === '/profile'
                  ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600 font-semibold'
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