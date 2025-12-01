// import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainRoutes} from '../Routes';
import HomeScreen from '../../screens/HomeScreen';
import StoreScreen from '../../screens/StoreSreen';
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
        tabBarActiveTintColor: '#1E88E5',
        headerShown: false,
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
        component={StoreScreen}
        options={{
          tabBarIcon: OrderIcon,
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
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
// const styles = StyleSheet.create({});

