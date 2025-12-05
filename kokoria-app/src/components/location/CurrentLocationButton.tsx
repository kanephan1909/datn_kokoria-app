import React from 'react';
import {TouchableOpacity, ActivityIndicator, StyleSheet} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

interface CurrentLocationButtonProps {
  onPress: () => void;
  isLoading?: boolean;
}

const CurrentLocationButton: React.FC<CurrentLocationButtonProps> = ({
  onPress,
  isLoading = false,
}) => {
  return (
    <TouchableOpacity
      style={styles.currentLocationButton}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isLoading}>
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Ionicons name="locate" size={24} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default CurrentLocationButton;
