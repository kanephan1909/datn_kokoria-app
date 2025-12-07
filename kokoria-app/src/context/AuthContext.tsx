import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import API functions directly - no circular dependency since apiClient doesn't import AuthContext
import { getMe, logout as apiLogout } from '../../api/apiClient';
import { useCartStore } from '../store/useCartStore';

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
  const resetCart = useCartStore(state => state.reset);
  const loadCart = useCartStore(state => state.loadCart);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        // Verify token bằng cách gọi getMe
        try {
          const response = await getMe();
          if (response && response.success && response.data) {
            setUser(response.data);
            // Load cart của user mới sau khi đăng nhập thành công
            // Delay một chút để đảm bảo token đã được set trong headers
            setTimeout(() => {
              loadCart().catch(err => {
                // Ignore errors khi load cart (có thể user chưa có cart)
                console.log('Cart load error (ignored):', err);
              });
            }, 100);
          } else {
            // Token không hợp lệ
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
            setUser(null);
            resetCart(); // Clear cart khi token không hợp lệ
          }
        } catch (apiError) {
          // API error - token invalid
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          setUser(null);
          resetCart(); // Clear cart khi token không hợp lệ
        }
      } else {
        setUser(null);
        resetCart(); // Clear cart khi không có token
      }
    } catch (error) {
      // Token hết hạn hoặc không hợp lệ
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      setUser(null);
      resetCart(); // Clear cart khi có lỗi
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData: User) => {
    // Clear cart của user cũ trước khi set user mới
    resetCart();
    setUser(userData);
    // Load cart của user mới sau khi đăng nhập thành công
    // Delay một chút để đảm bảo token đã được set trong headers
    setTimeout(() => {
      loadCart().catch(err => {
        // Ignore errors khi load cart (có thể user chưa có cart)
        console.log('Cart load error (ignored):', err);
      });
    }, 100);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      // Ignore logout API error
    } finally {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
      resetCart(); // Clear cart khi logout
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

