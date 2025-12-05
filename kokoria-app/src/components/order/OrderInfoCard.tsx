import {Text, View, StyleSheet} from 'react-native';
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

interface OrderInfoCardProps {
  orderNumber: string;
  createdAt: string;
  total: number;
  formatPrice: (price: number) => string;
  formatDate: (dateString: string) => string;
}

const OrderInfoCard = ({
  orderNumber,
  createdAt,
  total,
  formatPrice,
  formatDate,
}: OrderInfoCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="receipt-outline" size={24} color="#EA580C" />
        <Text style={styles.title}>Thông tin đơn hàng</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Mã đơn hàng</Text>
        <Text style={styles.value}>#{orderNumber}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Ngày đặt</Text>
        <Text style={styles.value}>{formatDate(createdAt)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Tổng tiền</Text>
        <Text style={styles.totalValue}>{formatPrice(total)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EA580C',
  },
});

export default OrderInfoCard;

