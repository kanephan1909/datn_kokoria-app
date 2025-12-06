import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import API functions directly - no circular dependency since apiClient doesn't import AuthContext
import { getMe, logout as apiLogout } from '../../api/apiClient';

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
  updateUser: (userData: User) => void;
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
          const response = await getMe();
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
      await apiLogout();
    } catch (error) {
      // Ignore logout API error
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      setUser(null);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
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
        updateUser,
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

// Ensure AuthProvider is exported
export default AuthProvider;

