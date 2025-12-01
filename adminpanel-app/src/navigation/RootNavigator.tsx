import { StyleSheet } from "react-native";
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CategoriesStack from "./CategoriesStack";
import ProductsStack from "./ProductsStack";
import UsersStack from "./UsersStack";
import OrdersStack from "./OrdersStack";
import DashboardScreen from "../screens/DashboardScreen";
import LoginScreen from "../screens/LoginScreen";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { ActivityIndicator, View } from "react-native";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          if (route.name === "Dashboard")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "CategoriesTab")
            iconName = focused ? "list" : "list-outline";
          else if (route.name === "ProductsTab")
            iconName = focused ? "cube" : "cube-outline";
          else if (route.name === "Orders")
            iconName = focused ? "cart" : "cart-outline";
          else if (route.name === "UsersTab")
            iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Tổng quan" }}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesStack}
        options={{ title: "Danh Mục" }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductsStack}
        options={{ title: "Sản Phẩm" }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{ title: "Đơn Hàng" }}
      />
      <Tab.Screen
        name="UsersTab"
        component={UsersStack}
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
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;

const styles = StyleSheet.create({});
