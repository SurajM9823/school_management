import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../layout/Layout';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute: loading=', loading, 'isAuthenticated=', isAuthenticated, 'user=', user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    console.log('Not authenticated or no user, redirecting to /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(user.role)) {
    console.log(`User role ${user.role} not in allowed roles ${roles}, redirecting`);
    // Redirect to role-specific dashboard
    const redirectPath = getRedirectPath(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  console.log(`Access granted for user role ${user.role} to route with roles ${roles}`);
  return <Layout>{children}</Layout>;
};

const getRedirectPath = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'teacher':
      return '/teacher/dashboard';
    case 'parent':
      return '/parent/dashboard';
    case 'student':
      return '/student/dashboard';
    case 'accountant':
      return '/accountant/fees';
    default:
      return '/login';
  }
};

export default ProtectedRoute;