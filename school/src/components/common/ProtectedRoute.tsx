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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard\" replace />;
      case 'teacher':
        return <Navigate to="/teacher/dashboard" replace />;
      case 'parent':
        return <Navigate to="/parent/dashboard" replace />;
      case 'student':
        return <Navigate to="/student/dashboard" replace />;
      case 'accountant':
        return <Navigate to="/accountant/fees" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;