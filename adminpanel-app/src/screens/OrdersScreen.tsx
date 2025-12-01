import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../api/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const OrdersScreen = () => {
  const navigation = useNavigation();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['orders', selectedStatus],
    queryFn: () => fetchOrders({ page: 1, limit: 20, status: selectedStatus || undefined }),
  });

  const orders = ordersData?.data || [];
  const filteredOrders = orders.filter((order: any) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PREPARING: 'bg-purple-100 text-purple-800',
      READY_FOR_PICKUP: 'bg-indigo-100 text-indigo-800',
      PICKED_UP: 'bg-pink-100 text-pink-800',
      DELIVERING: 'bg-cyan-100 text-cyan-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-4">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-red-500 text-lg font-semibold mt-4 text-center">
          Có lỗi xảy ra khi tải đơn hàng
        </Text>
        <TouchableOpacity
          className="bg-blue-500 rounded-lg px-6 py-3 mt-4"
          onPress={() => refetch()}
        >
          <Text className="text-white font-semibold">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header với gradient effect */}
      <View 
        className="bg-white px-4 pt-4 pb-4 border-b border-gray-200"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900 mb-1">Danh sách đơn hàng</Text>
          <Text className="text-sm text-gray-500">
            {filteredOrders.length} đơn hàng
          </Text>
        </View>

        {/* Search Bar */}
        <View 
          className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 mb-3 border border-gray-200"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800"
            placeholder="Tìm kiếm đơn hàng..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1">
          <TouchableOpacity
            className={`px-5 py-2.5 rounded-full mr-3 ${
              selectedStatus === null ? 'bg-blue-500' : 'bg-white border border-gray-300'
            }`}
            onPress={() => setSelectedStatus(null)}
            style={
              selectedStatus === null
                ? {
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    elevation: 3,
                  }
                : {}
            }
          >
            <Text
              className={`font-semibold text-sm ${
                selectedStatus === null ? 'text-white' : 'text-gray-700'
              }`}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          {['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING', 'COMPLETED', 'CANCELED'].map(
            (status) => (
              <TouchableOpacity
                key={status}
                className={`px-5 py-2.5 rounded-full mr-3 ${
                  selectedStatus === status ? 'bg-blue-500' : 'bg-white border border-gray-300'
                }`}
                onPress={() => setSelectedStatus(status)}
                style={
                  selectedStatus === status
                    ? {
                        shadowColor: '#3B82F6',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 3,
                      }
                    : {}
                }
              >
                <Text
                  className={`font-semibold text-sm ${
                    selectedStatus === status ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {filteredOrders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <View 
            className="bg-gray-100 rounded-full p-6 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
          </View>
          <Text className="text-gray-700 text-center mt-2 text-xl font-bold">
            {searchQuery ? 'Không tìm thấy đơn hàng' : 'Chưa có đơn hàng nào'}
          </Text>
          <Text className="text-gray-500 text-center mt-2 text-sm">
            {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Đơn hàng sẽ hiển thị ở đây'}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          <View className="p-4">
            {filteredOrders.map((order: any) => (
              <TouchableOpacity
                key={order.id}
                className="bg-white rounded-2xl p-4 mb-4 border border-gray-100"
                onPress={() => (navigation as any).navigate('OrderDetail', { orderId: order.id })}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      Đơn #{order.id.slice(-8).toUpperCase()}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View 
                    className={`px-3 py-1.5 rounded-lg ${getStatusColor(order.status)} border`}
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <Text className="text-xs font-bold">{order.status}</Text>
                  </View>
                </View>

                <View className="space-y-2 mb-3">
                  <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
                    <Ionicons name="person-outline" size={18} color="#6B7280" />
                    <Text className="text-gray-700 ml-2 text-sm font-medium">
                      {order.user?.name || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                    <View className="flex-row items-center">
                      <Ionicons name="cash-outline" size={18} color="#3B82F6" />
                      <Text className="text-gray-700 ml-2 text-sm font-medium">Tổng tiền:</Text>
                    </View>
                    <Text className="text-blue-600 font-bold text-base">
                      {formatCurrency(order.totalAmount)}
                    </Text>
                  </View>
                  {order.driver && (
                    <View className="flex-row items-center bg-green-50 px-3 py-2 rounded-lg">
                      <Ionicons name="car-outline" size={18} color="#10B981" />
                      <Text className="text-gray-700 ml-2 text-sm font-medium">
                        Tài xế: {order.driver.name}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row items-center justify-end pt-2 border-t border-gray-100">
                  <Text className="text-blue-600 text-xs font-semibold mr-1">Xem chi tiết</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default OrdersScreen;

