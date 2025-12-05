// import { Text, View } from 'react-native'
import React from 'react';
import {RootRoutes} from '../Routes';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MainNavigator from './MainNavigator';
import AuthNavigator from './AuthNavigator';
import {useAuth} from '../../context/AuthContext';
import {View, ActivityIndicator} from 'react-native';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const {isAuthenticated, isLoading} = useAuth();

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {isAuthenticated ? (
        <Stack.Screen 
          name={RootRoutes.MainTabs} 
          component={MainNavigator}
          key="main"
        />
      ) : (
        <Stack.Screen 
          name={RootRoutes.AuthStack} 
          component={AuthNavigator}
          key="auth"
        />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
