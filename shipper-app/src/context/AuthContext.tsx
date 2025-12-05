import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe, logout as logoutAPI } from '../api/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        const response = await getMe();
        if (response.success && response.data) {
          // Chỉ cho phép DRIVER role
          if (response.data.role === 'DRIVER') {
            setUser(response.data);
          } else {
            // Nếu không phải DRIVER, đăng xuất
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
            setUser(null);
          }
        } else {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await logoutAPI();
    } catch (error) {
      // Ignore logout API error
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
