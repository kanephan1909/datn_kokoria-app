import { StyleSheet } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UsersScreen from '../screens/UsersScreen';
import AddUserScreen from '../screens/AddUserScreen';
import DriversStack from './DriversStack';

const Stack = createNativeStackNavigator();

const UsersStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: 'tomato',
        },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: 'bold' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="Users"
        component={UsersScreen}
        options={{ title: 'Người Dùng', headerShown: false }}
      />
      <Stack.Screen
        name="AddUser"
        component={AddUserScreen}
        options={{ title: 'Thêm Người Dùng' }}
      />
      <Stack.Screen
        name="EditUser"
        component={AddUserScreen}
        options={{ title: 'Chỉnh Sửa Người Dùng' }}
      />
      <Stack.Screen
        name="Drivers"
        component={DriversStack}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default UsersStack;

