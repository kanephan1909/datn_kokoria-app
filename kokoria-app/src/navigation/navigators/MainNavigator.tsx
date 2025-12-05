// import { Text, View } from 'react-native'
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MainTabNavigator from './MainTabNavigator';
import {MainRoutes} from '../Routes';
import ProductDetailsScreen from '../../screens/ProductDetailsScreen';
import OrderHistoryScreen from '../../screens/OrderHistoryScreen';
import OrderDetailsScreen from '../../screens/OrderDetailsScreen';
import OrderScreen from '../../screens/OrderScreen';
import CheckoutScreen from '../../screens/CheckoutScreen';
import CheckoutScreen2 from '../../screens/CheckoutScreen2';
import AddressListScreen from '../../screens/AddressListScreen';
import AddAddressScreen from '../../screens/AddAddressScreen';
import EditAddressScreen from '../../screens/EditAddressScreen';
import CategoryScreen from '../../screens/CatetoryScreen';
import PaymentWebViewScreen from '../../screens/PaymentWebViewScreen';
import OrderConfirmationScreen from '../../screens/OrderConfirmationScreen';
import LiveTrackingMapScreen from '../../screens/LiveTrackingMapScreen';
import ChatbotScreen from '../../screens/ChatbotScreen';
import SettingsScreen from '../../screens/SettingsScreen';
import EditLocationScreen from '../../screens/EditLocationScreen';
import NotificationsScreen from '../../screens/NotificationsScreen';
import ChatScreen from '../../screens/ChatScreen';
import OrderDeliveredScreen from '../../screens/OrderDeliveredScreen';

const Stack = createNativeStackNavigator();

const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="TabNavigator" component={MainTabNavigator} />
      <Stack.Screen name={MainRoutes.Order} component={OrderScreen} />
      <Stack.Screen name={MainRoutes.Checkout} component={CheckoutScreen} />
      <Stack.Screen name={MainRoutes.Checkout2} component={CheckoutScreen2} />
      <Stack.Screen name={MainRoutes.Category} component={CategoryScreen} />
      <Stack.Screen name={MainRoutes.ProductDetails} component={ProductDetailsScreen} />
      <Stack.Screen name={MainRoutes.OrderHistory} component={OrderHistoryScreen} />
      <Stack.Screen name={MainRoutes.OrderDetails} component={OrderDetailsScreen} />
      <Stack.Screen name={MainRoutes.AddressList} component={AddressListScreen} />
      <Stack.Screen name={MainRoutes.AddAddress} component={AddAddressScreen} />
      <Stack.Screen name={MainRoutes.EditAddress} component={EditAddressScreen} />
      <Stack.Screen
        name={MainRoutes.PaymentWebView}
        component={PaymentWebViewScreen}
      />
      <Stack.Screen
        name={MainRoutes.OrderConfirmation}
        component={OrderConfirmationScreen}
      />
      <Stack.Screen
        name={MainRoutes.LiveTrackingMap}
        component={LiveTrackingMapScreen}
      />
      <Stack.Screen
        name={MainRoutes.Chatbot}
        component={ChatbotScreen}
      />
      <Stack.Screen
        name={MainRoutes.Settings}
        component={SettingsScreen}
      />
      <Stack.Screen
        name={MainRoutes.EditLocation}
        component={EditLocationScreen}
      />
      <Stack.Screen
        name={MainRoutes.Notifications}
        component={NotificationsScreen}
      />
      <Stack.Screen
        name={MainRoutes.Chat}
        component={ChatScreen}
      />
      <Stack.Screen
        name={MainRoutes.OrderDelivered}
        component={OrderDeliveredScreen}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;

// const styles = StyleSheet.create({})
