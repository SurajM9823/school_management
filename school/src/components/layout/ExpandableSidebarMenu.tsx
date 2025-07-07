import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface SubMenuItem {
  to: string;
  label: string;
}

interface ExpandableSidebarMenuProps {
  icon: React.ReactNode;
  label: string;
  subItems: SubMenuItem[];
}

const ExpandableSidebarMenu: React.FC<ExpandableSidebarMenuProps> = ({ icon, label, subItems }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  const isActive = subItems.some(item => location.pathname === item.to);
  
  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          isActive
            ? 'text-primary border-l-4 border-darkPrimary font-semibold bg-lightPrimary'
            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
          'group flex items-center w-full px-3 py-2 text-sm font-medium transition-all duration-150 justify-between'
        )}
      >
        <div className="flex items-center">
          <div className={clsx('mr-3 flex-shrink-0 h-5 w-5', isActive ? 'text-darkPrimary' : 'text-gray-500 group-hover:text-gray-700')}>
            {icon}
          </div>
          <span className="truncate">{label}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      
      {isExpanded && (
        <div className="pl-10 space-y-1">
          {subItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                location.pathname === item.to
                  ? 'text-primary font-semibold bg-lightPrimary'
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900',
                'group flex items-center px-3 py-2 text-sm font-medium transition-all duration-150 rounded-md'
              )}
            >
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpandableSidebarMenu;