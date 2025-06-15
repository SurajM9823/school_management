import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  School,
  Globe,
  Calendar,
  Settings as SettingsIcon,
  Mail,
  Lock,
  Users,
  BookOpen,
  Building,
  Menu,
  X,
  DollarSign, // Add this import
} from "lucide-react";
import clsx from "clsx";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  current: boolean;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, current, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={clsx(
      current
        ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600 font-semibold"
        : "text-gray-600 hover:bg-gray-200 hover:text-gray-900",
      "group flex items-center px-3 py-3 text-sm font-medium rounded-r-md transition-all duration-150"
    )}
    aria-current={current ? "page" : undefined}
  >
    <div
      className={clsx(
        "mr-3 flex-shrink-0 h-5 w-5",
        current ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
      )}
    >
      {icon}
    </div>
    <span className="truncate">{label}</span>
  </Link>
);

const Settings: React.FC = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const tabs = [
    { id: "school", label: "School Info", icon: <School size={20} />, to: "/admin/settings/school" },
    { id: "locale", label: "Timezone & Locale", icon: <Globe size={20} />, to: "/admin/settings/locale" },
    { id: "session", label: "Session Config", icon: <Calendar size={20} />, to: "/admin/settings/session" },
    { id: "defaults", label: "Default Values", icon: <SettingsIcon size={20} />, to: "/admin/settings/defaults" },
    { id: "notifications", label: "Email & SMS", icon: <Mail size={20} />, to: "/admin/settings/notifications" },
    { id: "permissions", label: "Roles & Permissions", icon: <Lock size={20} />, to: "/admin/settings/permissions" },
    { id: "staff", label: "Staff Management", icon: <Users size={20} />, to: "/admin/settings/staff" },
    { id: "academic", label: "Academic Settings", icon: <BookOpen size={20} />, to: "/admin/settings/academic" },
    { id: "campus", label: "Campus Settings", icon: <Building size={20} />, to: "/admin/settings/campus" },
    { id: "admission-fees", label: "Admission Fees", icon: <DollarSign size={20} />, to: "/admin/settings/admission-fees" }, // New tab
  ];

  const toggleSidebar = () => setOpen(!open);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div
        className={clsx(
          "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transition-transform duration-300 transform z-50 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4">
          <div className="flex items-center">
            <School className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-blue-700 text-lg font-semibold">Settings</span>
          </div>
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="mt-5 px-2 pb-4 space-y-1" role="navigation">
          {tabs.map((tab) => (
            <SidebarLink
              key={tab.id}
              to={tab.to}
              icon={tab.icon}
              label={tab.label}
              current={location.pathname === tab.to}
              onClick={() => setOpen(false)}
            />
          ))}
        </nav>
      </div>
      <div className="flex-1 p-6">
        <button
          className="md:hidden fixed top-4 left-4 p-2 bg-blue-600 text-white rounded-md z-40"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>
        <Outlet />
      </div>
    </div>
  );
};

export default Settings;