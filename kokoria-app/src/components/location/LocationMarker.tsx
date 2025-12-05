import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

const LocationMarker: React.FC = () => {
  return (
    <View style={styles.markerContainer}>
      {/* Bubble text */}
      <View style={styles.bubbleContainer}>
        <Text style={styles.bubbleText}>Đơn hàng sẽ được giao tại đây</Text>
        <View style={styles.bubbleArrow} />
      </View>
      {/* Pin icon */}
      <View style={styles.pinContainer}>
        <Ionicons name="location" size={40} color="#F97316" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  bubbleContainer: {
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
    maxWidth: 200,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F97316',
  },
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LocationMarker;
