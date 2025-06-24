import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

type UserRole = 'admin' | 'teacher' | 'parent' | 'student' | 'accountant';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  is_superuser: boolean; // Make is_superuser required
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
          // Set user from localStorage immediately as a fallback
          const parsedUser = JSON.parse(storedUser) as User;
          console.log('Parsed stored user:', parsedUser);
          setUser(parsedUser);

          // Try refreshing token if expired
          try {
            const response = await api.get('/school/settings/current-user/', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            console.log('Current user response:', response.data);
            const userData: User = {
              id: response.data.id,
              name: response.data.name,
              email: response.data.email,
              role: response.data.role,
              avatar: response.data.avatar || undefined,
              is_superuser: response.data.is_superuser ?? false, // Fallback to false if undefined
            };
            console.log('Parsed user data:', userData);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } catch (apiError: any) {
            if (apiError.response?.status === 401) {
              console.log('Access token expired, attempting to refresh...');
              const refreshToken = localStorage.getItem('refreshToken');
              if (refreshToken) {
                try {
                  const refreshResponse = await api.post('/token/refresh/', { refresh: refreshToken });
                  const { access, user } = refreshResponse.data;
                  console.log('Token refreshed, new access token:', access);
                  localStorage.setItem('accessToken', access);
                  localStorage.setItem('user', JSON.stringify(user));
                  setUser(user);
                } catch (refreshError: any) {
                  console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
                  throw apiError; // Re-throw to handle in outer catch
                }
              } else {
                throw apiError; // No refresh token, re-throw
              }
            } else {
              throw apiError; // Non-401 error, re-throw
            }
          }
        } catch (error: any) {
          console.error('Token validation failed:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
          if (error.response?.status === 401) {
            console.log('401 Unauthorized, clearing auth data');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
          } else {
            // Use stored user as fallback for non-401 errors
            console.log('Using fallback user data:', parsedUser);
            setUser(parsedUser);
          }
        }
      } else {
        console.log('No access token or stored user, setting user to null');
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

        const userData: User = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar || undefined,
            is_superuser: user.is_superuser ?? false,
        };
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        return { access, refresh, user: userData };
    } catch (error: any) {
        console.error('Login Error:', error.response?.data || error.message);
        // Throw the specific error message from backend
        throw new Error(error.response?.data?.non_field_errors?.[0] || 'Login failed. Please check your credentials or contact support.');
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