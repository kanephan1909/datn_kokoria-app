import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchOrderById, acceptOrder, updateOrderStatus } from '../api/apiClient';

const OrderDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { orderId } = route.params as { orderId: string };

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId),
  });

  const order = data?.data;

  const acceptMutation = useMutation({
    mutationFn: () => acceptOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableOrders'] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      Alert.alert('Thành công', 'Đã nhận đơn hàng thành công!');
      navigation.goBack();
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể nhận đơn hàng');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng!');
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật trạng thái');
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getAddressString = (address: any) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address) {
      const parts = [
        address.flatNo,
        address.street,
        address.buildingName,
        address.locality,
      ].filter(Boolean);
      return parts.join(', ') || 'Địa chỉ không xác định';
    }
    return 'Địa chỉ không xác định';
  };

  const openGoogleMaps = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Lỗi', 'Không thể mở Google Maps');
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Đang tải...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-red-500 text-center mt-4 text-lg font-semibold">
          Không thể tải đơn hàng
        </Text>
      </View>
    );
  }

  const isAvailable = order.status === 'READY_FOR_PICKUP' && !order.driverId;
  const isMyOrder = order.driverId && ['PICKED_UP', 'DELIVERING'].includes(order.status);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Order Info */}
      <View className="bg-white mx-4 my-4 rounded-xl p-4">
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="text-lg font-bold text-gray-900">Đơn #{order.id.slice(-6)}</Text>
            <Text className="text-gray-600 text-sm mt-1">
              {formatCurrency(order.totalAmount)}
            </Text>
          </View>
          <View className="bg-blue-100 px-3 py-1 rounded-full">
            <Text className="text-blue-600 font-semibold text-xs">{order.status}</Text>
          </View>
        </View>

        {/* Address */}
        <View className="border-t border-gray-100 pt-4 mt-4">
          <Text className="text-gray-700 font-semibold mb-2">Địa chỉ giao hàng</Text>
          <Text className="text-gray-900">{getAddressString(order.address)}</Text>
          
          {order.address?.latitude && order.address?.longitude && (
            <TouchableOpacity
              className="flex-row items-center mt-3 bg-blue-50 px-4 py-2 rounded-lg"
              onPress={() => openGoogleMaps(order.address.latitude, order.address.longitude)}
            >
              <Ionicons name="navigate" size={20} color="#3B82F6" />
              <Text className="text-blue-600 font-semibold ml-2">Mở Google Maps</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Items */}
        {order.items && Array.isArray(order.items) && order.items.length > 0 && (
          <View className="border-t border-gray-100 pt-4 mt-4">
            <Text className="text-gray-700 font-semibold mb-2">Sản phẩm</Text>
            {order.items.map((item: any, index: number) => (
              <View key={index} className="flex-row justify-between py-2">
                <Text className="text-gray-900 flex-1">
                  {item.name || item.productName} x{item.quantity || 1}
                </Text>
                <Text className="text-gray-600">
                  {formatCurrency((item.price || 0) * (item.quantity || 1))}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Note */}
        {order.note && (
          <View className="border-t border-gray-100 pt-4 mt-4">
            <Text className="text-gray-700 font-semibold mb-2">Ghi chú</Text>
            <Text className="text-gray-900">{order.note}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      {isAvailable && (
        <View className="px-4 pb-4">
          <TouchableOpacity
            className="bg-green-500 rounded-xl py-4"
            onPress={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-center text-lg">Nhận đơn</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isMyOrder && (
        <View className="px-4 pb-4 space-y-3">
          {order.status === 'PICKED_UP' && (
            <TouchableOpacity
              className="bg-blue-500 rounded-xl py-4"
              onPress={() => updateStatusMutation.mutate({ status: 'DELIVERING' })}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-center text-lg">Bắt đầu giao hàng</Text>
              )}
            </TouchableOpacity>
          )}

          {order.status === 'DELIVERING' && (
            <TouchableOpacity
              className="bg-green-500 rounded-xl py-4"
              onPress={() => updateStatusMutation.mutate({ status: 'COMPLETED' })}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-center text-lg">Hoàn thành giao hàng</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default OrderDetailScreen;
