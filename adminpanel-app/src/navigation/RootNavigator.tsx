import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CategoriesStack from "./CategoriesStack";
import UsersScreen from "../screens/UsersScreen";
import OrdersStack from "./OrdersStack";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

const RootNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";
          if (route.name === "CategoriesTab")
            iconName = focused ? "list" : "list-outline";
          else if (route.name === "Users")
            iconName = focused ? "person" : "person-outline";
          else if (route.name === "Orders")
            iconName = focused ? "cart" : "cart-outline";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesStack}
        options={{ title: "Danh Mục" }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{ title: "Đơn Hàng" }}
      />
      <Tab.Screen
        name="Users"
        component={UsersScreen}
        options={{ title: "Tôi" }}
      />
    </Tab.Navigator>
  );
};

export default RootNavigator;

const styles = StyleSheet.create({});
