// import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainRoutes} from '../Routes';
import HomeScreen from '../../screens/HomeScreen';
import OrderScreen from '../../screens/OrderScreen';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import UserScreen from '../../screens/UserScreen';
import MenuScreen from '../../screens/MenuScreen';

const Tab = createBottomTabNavigator();

// Icon components defined outside to avoid recreation on each render
const HomeIcon = ({color}: {color: string}) => (
  <FontAwesome name="home" color={color} size={24} />
);

const MenuIcon = ({color}: {color: string}) => (
  <FontAwesome name="cutlery" color={color} size={24} />
);

const OrderIcon = ({color}: {color: string}) => (
  <FontAwesome name="list" color={color} size={24} />
);

const ProfileIcon = ({color}: {color: string}) => (
  <FontAwesome name="user" color={color} size={24} />
);

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
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name={MainRoutes.Menu}
        component={MenuScreen}
        options={{
          tabBarIcon: MenuIcon,
        }}
      />
      <Tab.Screen
        name={MainRoutes.Order}
        component={OrderScreen}
        options={{
          tabBarIcon: OrderIcon,
        }}
      />

      <Tab.Screen
        name={MainRoutes.Profile}
        component={UserScreen}
        options={{
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
// const styles = StyleSheet.create({});

