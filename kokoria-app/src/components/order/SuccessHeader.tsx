import {Text, View, StyleSheet} from 'react-native';
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

const SuccessHeader = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#10B981" />
      </View>
      <Text style={styles.title}>Đặt hàng thành công!</Text>
      <Text style={styles.subtitle}>
        Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default SuccessHeader;

