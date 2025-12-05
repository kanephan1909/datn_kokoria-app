import {Text, View, TouchableOpacity, StyleSheet} from 'react-native';
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

interface OrderConfirmationActionsProps {
  onTrackOrder: () => void;
  onViewDetails: () => void;
  onGoHome: () => void;
}

const OrderConfirmationActions = ({
  onTrackOrder,
  onViewDetails,
  onGoHome,
}: OrderConfirmationActionsProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.trackButton}
        onPress={onTrackOrder}
        activeOpacity={0.8}>
        <Ionicons name="map-outline" size={20} color="#FFFFFF" />
        <Text style={styles.trackButtonText}>Theo dõi đơn hàng</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.detailsButton}
        onPress={onViewDetails}
        activeOpacity={0.8}>
        <Text style={styles.detailsButtonText}>Xem chi tiết đơn hàng</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.homeButton}
        onPress={onGoHome}
        activeOpacity={0.8}>
        <Text style={styles.homeButtonText}>Về trang chủ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  trackButton: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  detailsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#EA580C',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EA580C',
  },
  homeButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default OrderConfirmationActions;

