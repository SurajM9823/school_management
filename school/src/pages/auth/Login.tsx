import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { School, Mail, Lock } from 'lucide-react';
import Button from '../../components/common/Button';

interface LocationState {
  from?: { pathname: string };
}

type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent' | 'student' | 'accountant';
  avatar?: string;
  is_superuser?: boolean;
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const from = (location.state as LocationState)?.from?.pathname || '/';

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        const response = await login(email, password);
        const user: User = response.user;
        console.log('User after login:', user);
        const redirectPath = getRedirectPath(user);
        navigate(redirectPath, { replace: true });
    } catch (err: any) {
        const errorMsg = err.response?.data?.non_field_errors?.[0] || err.message || 'Login failed. Please check your credentials or contact support.';
        setError(errorMsg);
        setIsLoading(false);
        console.error('Login error:', err);
    }
};

  const getRedirectPath = (user: User) => {
    if (user.is_superuser) {
      return '/superadmin/dashboard';
    }
    switch (user.role) {
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
        return from;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <School className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          EduSync School Management
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to access your school dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Sign in
              </Button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setEmail('admin@example.com')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Admin: admin@example.com
              </button>
              <button
                type="button"
                onClick={() => setEmail('teacher1@example.com')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Teacher: teacher1@example.com
              </button>
              <button
                type="button"
                onClick={() => setEmail('parent1@example.com')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Parent: parent1@example.com
              </button>
              <button
                type="button"
                onClick={() => setEmail('student1@example.com')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Student: student1@example.com
              </button>
              <button
                type="button"
                onClick={() => setEmail('accountant1@example.com')}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Accountant: accountant1@example.com
              </button>
              <div className="flex justify-center">
                <span className="text-sm text-gray-700">YourNewSecurePassword</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;