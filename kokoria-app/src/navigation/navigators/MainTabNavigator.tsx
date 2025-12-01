// import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainRoutes} from '../Routes';
import HomeScreen from '../../screens/HomeScreen';
import OrderHistoryScreen from '../../screens/OrderHistoryScreen';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import UserScreen from '../../screens/UserScreen';

const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 70,
        },
      }}>
      <Tab.Screen
        name={MainRoutes.Home}
        component={HomeScreen}
        options={{
          tabBarIcon: ({color}: {color: string}) => (
            <FontAwesome name="home" color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name={MainRoutes.Order}
        component={OrderHistoryScreen}
        options={{
          tabBarIcon: ({color}: {color: string}) => (
            <FontAwesome name="list" color={color} size={24} />
          ),
        }}
      />
      {/* <Tab.Screen name={MainRoutes.Cart} component={CartScreen} options={{
        tabBarIcon: ({color}: {color: string}) => (
          <FontAwesome name="cart" color={color} size={24} />
        ),
      }}/> */}
      <Tab.Screen
        name={MainRoutes.Profile}
        component={UserScreen}
        options={{
          tabBarIcon: ({color}: {color: string}) => (
            <FontAwesome name="user" color={color} size={24} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;

// const styles = StyleSheet.create({});
