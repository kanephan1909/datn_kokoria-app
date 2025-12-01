import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lazy import to avoid circular dependency issues
const getApiFunctions = () => {
  try {
    return require('../../api/apiClient');
  } catch (error) {
    console.error('Error loading apiClient:', error);
    return null;
  }
};

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
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
        // Verify token bằng cách gọi getMe
        try {
          const api = getApiFunctions();
          if (!api || !api.getMe) {
            console.error('API functions not available');
            setIsLoading(false);
            return;
          }
          const response = await api.getMe();
          if (response && response.success && response.data) {
            setUser(response.data);
          } else {
            // Token không hợp lệ
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
            setUser(null);
          }
        } catch (apiError) {
          // API error - token invalid
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      // Token hết hạn hoặc không hợp lệ
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
      const api = getApiFunctions();
      if (api && api.logout) {
        await api.logout();
      }
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

