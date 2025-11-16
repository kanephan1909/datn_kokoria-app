import 'react-native-reanimated';
import React from 'react';
// import {Text, View} from 'react-native';
import './global.css';
import './src/utils/nativewind-setup'; // Cấu hình NativeWind
import {navigationRef, setIsNavigationReady} from './src/navigation/Navigation';
import {NavigationContainer} from '@react-navigation/native';
import RootNavigator from './src/navigation/navigators/RootNavigator';

export default function App() {
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={setIsNavigationReady}>
        <RootNavigator />
      </NavigationContainer>
  );
}
