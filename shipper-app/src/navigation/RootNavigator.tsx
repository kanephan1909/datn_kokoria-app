import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { ActivityIndicator, View } from "react-native";
import LoginScreen from "../screens/LoginScreen";
import OrdersScreen from "../screens/OrdersScreen";
import MyOrdersScreen from "../screens/MyOrdersScreen";
import EarningsScreen from "../screens/EarningsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import OrderDetailScreen from "../screens/OrderDetailScreen";
import ChatScreen from "../screens/ChatScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "cube";
          if (route.name === "Orders") {
            iconName = focused ? "cube" : "cube-outline";
          } else if (route.name === "MyOrders") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "Earnings") {
            iconName = focused ? "cash" : "cash-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: "Đơn hàng" }}
      />
      <Tab.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ title: "Đơn của tôi" }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: "Thu nhập" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Tôi" }}
      />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen 
            name="OrderDetail" 
            component={OrderDetailScreen}
            options={{ 
              headerShown: true,
              title: "Chi tiết đơn hàng",
              headerBackTitle: "Quay lại"
            }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ 
              headerShown: false
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
