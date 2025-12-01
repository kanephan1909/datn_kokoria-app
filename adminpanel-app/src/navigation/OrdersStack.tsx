import { StyleSheet } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';

const Stack = createNativeStackNavigator();

const OrdersStack = () => {
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
        name="OrdersList"
        component={OrdersScreen}
        options={{ title: 'Đơn Hàng'}}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Chi Tiết Đơn Hàng' }}
      />
    </Stack.Navigator>
  );
};

export default OrdersStack;

const styles = StyleSheet.create({});