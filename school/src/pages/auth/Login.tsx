import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Button from '../../components/common/Button';
import logo from '../../../public/images/smslogo.png';
import emailIcon from '../../../public/icon/gmail.png';
import lock from '../../../public/icon/lock.png';

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
  const [showPassword, setShowPassword] = useState(false);

  
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
    <div className="min-h-screen flex flex-col justify-center" style={{ background: 'linear-gradient( #00c6a7, #082a68) fixed' }}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md lg:mx-auto">
        <div
  className="py-6 px-4 mx-5 lg:mx-auto shadow-lg sm:rounded-lg rounded-lg sm:px-8  lg:w-96"
  style={{
    background: 'linear-gradient(135deg, #e0f7f4, #ffffff)',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
  }}
>
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img className=" h-20 w-auto" src={logo} alt="Logo" />
        </div>
        <h1 className="text-center text-xl font-extrabold text-primary">
          School Management System
        </h1>
        <h3 className="text-center text-xs font-medium text-gray-600 mb-4">
          Sign in to your account</h3>
      </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <img src={emailIcon} className="h-5 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Email address"
                  autoFocus
                />
              </div>
            </div>

            <div>
             
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <img src={lock} className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-6 w-5" /> : <Eye className="h-6 w-5" />}
                </button>
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
                className="w-full btn bg-transparent text-gray-950 border border-primary hover:bg-darkPrimary hover:text-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                isLoading={isLoading}
              >
                Sign in
              </Button>
            </div>
          </form>   
        </div>
        <div className="mt-10 text-center text-sm text-gray-300">
          &copy; {new Date().getFullYear()} School Management System. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;