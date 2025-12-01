import { StyleSheet } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VouchersScreen from '../screens/VouchersScreen';
import AddVoucherScreen from '../screens/AddVoucherScreen';

const Stack = createNativeStackNavigator();

const VouchersStack = () => {
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
        name="VouchersList"
        component={VouchersScreen}
        options={{ title: 'Vouchers' }}
      />
      <Stack.Screen
        name="AddVoucher"
        component={AddVoucherScreen}
        options={{ title: 'Thêm Voucher' }}
      />
      <Stack.Screen
        name="EditVoucher"
        component={AddVoucherScreen}
        options={{ title: 'Chỉnh Sửa Voucher' }}
      />
    </Stack.Navigator>
  );
};

export default VouchersStack;

