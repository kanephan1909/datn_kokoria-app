import { StyleSheet } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DriversScreen from '../screens/DriversScreen';
import AddDriverScreen from '../screens/AddDriverScreen';

const Stack = createNativeStackNavigator();

const DriversStack = () => {
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
        name="Drivers"
        component={DriversScreen}
        options={{ title: 'Tài Xế' }}
      />
      <Stack.Screen
        name="AddDriver"
        component={AddDriverScreen}
        options={{ title: 'Thêm Tài Xế' }}
      />
      <Stack.Screen
        name="EditDriver"
        component={AddDriverScreen}
        options={{ title: 'Chỉnh Sửa Tài Xế' }}
      />
    </Stack.Navigator>
  );
};

export default DriversStack;

