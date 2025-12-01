import 'react-native-reanimated';
import React from 'react';
// import {Text, View} from 'react-native';
import './global.css';
import './src/utils/nativewind-setup'; // Cấu hình NativeWind
import {navigationRef, setIsNavigationReady} from './src/navigation/Navigation';
import {NavigationContainer} from '@react-navigation/native';
import RootNavigator from './src/navigation/navigators/RootNavigator';
import {AuthProvider} from './src/context/AuthContext';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {useCartStore} from './src/store/useCartStore';
import {useEffect} from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  // Initialize cart khi app khởi động
  useEffect(() => {
    useCartStore.getState().loadCart();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={setIsNavigationReady}>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}
