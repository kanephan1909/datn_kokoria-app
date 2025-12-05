import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchMyOrders } from '../api/apiClient';

const MyOrdersScreen = () => {
  const navigation = useNavigation();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['myOrders', selectedStatus],
    queryFn: () => fetchMyOrders({ 
      page: 1, 
      limit: 20,
      status: selectedStatus || undefined 
    }),
    refetchInterval: 5000, // Refresh mỗi 5 giây
  });

  const orders = data?.data || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string; bgColor: string } } = {
      PICKED_UP: { text: 'Đã lấy hàng', color: '#F59E0B', bgColor: '#FEF3C7' },
      DELIVERING: { text: 'Đang giao', color: '#3B82F6', bgColor: '#DBEAFE' },
      COMPLETED: { text: 'Đã giao', color: '#10B981', bgColor: '#D1FAE5' },
    };
    return statusMap[status] || { text: status, color: '#6B7280', bgColor: '#F3F4F6' };
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

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-900">Đơn của tôi</Text>
        <Text className="text-gray-600 text-sm mt-1">
          {orders.length} đơn hàng
        </Text>
      </View>

      {/* Filter tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-200"
      >
        <TouchableOpacity
          className={`px-4 py-3 mx-2 ${selectedStatus === null ? 'border-b-2 border-blue-500' : ''}`}
          onPress={() => setSelectedStatus(null)}
        >
          <Text className={`font-semibold ${selectedStatus === null ? 'text-blue-500' : 'text-gray-600'}`}>
            Tất cả
          </Text>
        </TouchableOpacity>
        {['PICKED_UP', 'DELIVERING', 'COMPLETED'].map((status) => {
          const info = getStatusInfo(status);
          return (
            <TouchableOpacity
              key={status}
              className={`px-4 py-3 mx-2 ${selectedStatus === status ? 'border-b-2 border-blue-500' : ''}`}
              onPress={() => setSelectedStatus(status)}
            >
              <Text className={`font-semibold ${selectedStatus === status ? 'text-blue-500' : 'text-gray-600'}`}>
                {info.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="list-outline" size={80} color="#9CA3AF" />
          <Text className="text-gray-600 text-lg font-semibold mt-4 text-center">
            Không có đơn hàng nào
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            {selectedStatus 
              ? 'Không có đơn hàng với trạng thái này'
              : 'Bạn chưa nhận đơn hàng nào'}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {orders.map((order: any) => {
            const statusInfo = getStatusInfo(order.status);
            return (
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
                  <View 
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: statusInfo.bgColor }}
                  >
                    <Text 
                      className="font-semibold text-xs"
                      style={{ color: statusInfo.color }}
                    >
                      {statusInfo.text}
                    </Text>
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
                </View>

                <TouchableOpacity
                  className="bg-blue-500 rounded-lg py-3 mt-4"
                  onPress={() => navigation.navigate('OrderDetail' as never, { orderId: order.id } as never)}
                >
                  <Text className="text-white font-semibold text-center">Xem chi tiết</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

export default MyOrdersScreen;
