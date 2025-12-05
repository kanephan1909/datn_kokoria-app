import {Text, View, StyleSheet} from 'react-native';
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

interface Address {
  name: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
}

interface DeliveryAddressCardProps {
  address: Address;
}

const DeliveryAddressCard = ({address}: DeliveryAddressCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="location-outline" size={24} color="#EA580C" />
        <Text style={styles.title}>Địa chỉ giao hàng</Text>
      </View>
      <Text style={styles.name}>{address.name}</Text>
      <Text style={styles.phone}>{address.phone}</Text>
      <Text style={styles.addressText}>
        {address.address}, {address.ward}, {address.district}, {address.city}
      </Text>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});

export default DeliveryAddressCard;

