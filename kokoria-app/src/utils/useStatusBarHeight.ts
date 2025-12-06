import {Platform, StatusBar} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

/**
 * Hook để lấy chiều cao của status bar
 * @returns Chiều cao status bar (bao gồm safe area top inset)
 */
export const useStatusBarHeight = (): number => {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight || 0;
  }
  return insets.top;
};
