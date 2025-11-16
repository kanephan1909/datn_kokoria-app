// import { Text, View } from 'react-native'
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AuthRoutes} from '../Routes';
import LoginScreen from '../../screens/LoginScreen';
import RegisterScreen from '../../screens/RegisterScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown:false}}>
      <Stack.Screen
        name={AuthRoutes.Login}
        component={LoginScreen}
        options={{}}
      />
      <Stack.Screen name={AuthRoutes.Register} component={RegisterScreen} options={{}} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

// const styles = StyleSheet.create({})
