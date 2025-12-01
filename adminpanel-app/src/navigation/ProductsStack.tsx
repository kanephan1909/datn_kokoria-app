import { StyleSheet } from 'react-native';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProductsScreen from '../screens/ProductsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import VouchersStack from './VouchersStack';

const Stack = createNativeStackNavigator();

const ProductsStack = () => {
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
        name="Products"
        component={ProductsScreen}
        options={{ title: 'Sản Phẩm' }}
      />
      <Stack.Screen
        name="AddProduct"
        component={AddProductScreen}
        options={{ title: 'Thêm Sản Phẩm' }}
      />
      <Stack.Screen
        name="EditProduct"
        component={AddProductScreen}
        options={{ title: 'Chỉnh Sửa Sản Phẩm' }}
      />
      <Stack.Screen
        name="Vouchers"
        component={VouchersStack}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ProductsStack;

