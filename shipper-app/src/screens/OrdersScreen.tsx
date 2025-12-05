import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchAvailableOrders } from '../api/apiClient';

const OrdersScreen = () => {
  const navigation = useNavigation();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['availableOrders'],
    queryFn: () => fetchAvailableOrders({ page: 1, limit: 20 }),
    refetchInterval: 10000, // Refresh mỗi 10 giây
  });

  const orders = data?.data || [];

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

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Đang tải đơn hàng...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-red-500 text-center mt-4 text-lg font-semibold">
          Không thể tải đơn hàng
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          Vui lòng kiểm tra kết nối và thử lại
        </Text>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-lg mt-4"
          onPress={() => refetch()}
        >
          <Text className="text-white font-semibold">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-900">Đơn hàng sẵn sàng</Text>
        <Text className="text-gray-600 text-sm mt-1">
          {orders.length} đơn hàng đang chờ shipper
        </Text>
      </View>

      {orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cube-outline" size={80} color="#9CA3AF" />
          <Text className="text-gray-600 text-lg font-semibold mt-4 text-center">
            Không có đơn hàng nào
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Hiện tại không có đơn hàng nào sẵn sàng để giao
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {orders.map((order: any) => (
            <TouchableOpacity
              key={order.id}
              className="bg-white mx-4 my-2 rounded-xl p-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
              onPress={() => navigation.navigate('OrderDetail' as never, { orderId: order.id } as never)}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-900">Đơn #{order.id.slice(-6)}</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    {formatCurrency(order.totalAmount)}
                  </Text>
                </View>
                <View className="bg-blue-100 px-3 py-1 rounded-full">
                  <Text className="text-blue-600 font-semibold text-xs">Sẵn sàng</Text>
                </View>
              </View>

              <View className="border-t border-gray-100 pt-3 mt-3">
                <View className="flex-row items-start mb-2">
                  <Ionicons name="location-outline" size={18} color="#6B7280" />
                  <View className="flex-1 ml-2">
                    <Text className="text-gray-500 text-xs">Địa chỉ giao hàng</Text>
                    <Text className="text-gray-900 text-sm mt-1" numberOfLines={2}>
                      {getAddressString(order.address)}
                    </Text>
                  </View>
                </View>

                {order.shippingDistance && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="navigate-outline" size={18} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-2">
                      Khoảng cách: {order.shippingDistance.toFixed(1)} km
                    </Text>
                  </View>
                )}

                {order.shippingFee && (
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="cash-outline" size={18} color="#6B7280" />
                    <Text className="text-gray-600 text-sm ml-2">
                      Phí ship: {formatCurrency(order.shippingFee)}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                className="bg-blue-500 rounded-lg py-3 mt-4"
                onPress={() => navigation.navigate('OrderDetail' as never, { orderId: order.id } as never)}
              >
                <Text className="text-white font-semibold text-center">Xem chi tiết</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default OrdersScreen;
