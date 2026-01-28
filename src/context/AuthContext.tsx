import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { axiosSecure } from '@/AllHooks/useAxiosSecure';
import Cookies from 'js-cookie';

// Types
interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  status?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const cookieOptions = {
  expires: 1,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);


  const fetchCurrentUser = async (): Promise<User | null> => {
    try {
      const token = Cookies.get('accessToken');

      if (!token) return null;

      const res = await axiosSecure.get('/user/me');
      return res.data?.data || null;

    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    initAuth();
  }, []);


  const login = async (accessToken: string, refreshToken: string) => {
    
    Cookies.set('accessToken', accessToken, cookieOptions);
    Cookies.set('refreshToken', refreshToken, { ...cookieOptions, expires: 30 });

    // Fetch user data
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
  };

  // Logout function
  const logout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setUser(null);
    window.location.href = '/';
  };

  // Refresh user data
  const refreshUser = async () => {
    const currentUser = await fetchCurrentUser();
    setUser(currentUser);
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
