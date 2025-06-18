import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

type UserRole = 'admin' | 'teacher' | 'parent' | 'student' | 'accountant';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ access: string; refresh: string; user: User }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const initializeAuth = async () => {
    console.log('Initializing auth...');
    const accessToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    console.log('Access token:', accessToken);
    console.log('Stored user:', storedUser);
    if (accessToken && storedUser) {
      try {
        const response = await api.get('/school/settings/current-user/', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log('Current user response:', response.data);
        const userData = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
          avatar: response.data.avatar || undefined,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error: any) {
        console.error('Token validation failed:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        if (error.response?.status === 401) {
          // Clear tokens only for unauthorized errors
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        } else {
          // For other errors (e.g., 500), keep user logged in
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch {
            setUser(null);
          }
        }
      }
    } else {
      setUser(null);
    }
    setLoading(false);
    console.log('Auth initialization complete, user:', user);
  };
  initializeAuth();
}, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/token/', { email, password });
      const { access, refresh, user } = response.data;
      console.log('Login Response:', response.data);
      console.log('Storing accessToken:', access);
      console.log('Storing user:', user);

      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return { access, refresh, user };
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      throw new Error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};