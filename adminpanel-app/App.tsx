import { StatusBar } from "expo-status-bar";
import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./src/context/AuthContext";
// React Query dùng để quản lý caching, server state, fetch API

// Tạo instance của React Query client
const queryClient = new QueryClient();

export default function App() {
  return (
    // Cung cấp React Query cho toàn bộ ứng dụng
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider quản lý authentication state */}
      <AuthProvider>
        {/* NavigationContainer là root wrapper cho React Navigation */}
        <NavigationContainer>
          {/* RootNavigator chứa toàn bộ cấu trúc navigation của app */}
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}
