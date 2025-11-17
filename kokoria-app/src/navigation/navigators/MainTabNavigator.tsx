// import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainRoutes} from '../Routes';
import HomeScreen from '../../screens/HomeScreen';
import StoreScreen from '../../screens/StoreSreen';
import {FontAwesome} from '@react-native-vector-icons/fontawesome';
import UserScreen from '../../screens/UserScreen';

const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#1E88E5',
        headerShown: false,
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
        name={MainRoutes.Store}
        component={StoreScreen}
        options={{
          tabBarIcon: ({color}: {color: string}) => (
            <FontAwesome name="shopping-cart" color={color} size={24} />
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
