import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Convert path to breadcrumb label
  const getLabel = (path: string): string => {
    // Capitalize first letter and replace hyphens with spaces
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  };

  return (
    <nav className="flex mb-2" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        <li>
          <div>
            <Link to="/" className="text-gray-400 hover:text-gray-500">
              <Home className="flex-shrink-0 h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {pathnames.map((path, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          
          return (
            <li key={routeTo}>
              <div className="flex items-center">
                <ChevronRight
                  className="flex-shrink-0 h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
                {isLast ? (
                  <span className="ml-1 text-sm font-medium text-gray-700">
                    {getLabel(path)}
                  </span>
                ) : (
                  <Link
                    to={routeTo}
                    className="ml-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {getLabel(path)}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;