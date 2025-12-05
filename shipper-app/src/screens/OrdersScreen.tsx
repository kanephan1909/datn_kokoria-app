import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchAvailableOrders } from '../api/apiClient';
import { useSocketContext } from '../context/SocketContext';

const OrdersScreen = () => {
  const navigation = useNavigation();
  const { isConnected } = useSocketContext();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['availableOrders'],
    queryFn: () => fetchAvailableOrders({ page: 1, limit: 20 }),
    refetchInterval: isConnected ? false : 10000, // Nếu có socket thì không cần polling
    onError: (err: any) => {
      console.error('❌ Error fetching orders:', err);
      console.error('Error details:', err?.response?.data || err?.message);
    },
    onSuccess: (response) => {
      console.log('✅ Orders fetched:', response);
      console.log('Orders count:', response?.data?.length || 0);
    },
  });

  // Khi socket nhận đơn hàng mới, tự động refetch
  useEffect(() => {
    if (isConnected) {
      // Socket sẽ tự động invalidate queries thông qua SocketContext
      // Chỉ cần refetch khi cần
    }
  }, [isConnected]);

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
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#F0F9FF' }}>
        <View 
          className="bg-white rounded-full p-6 mb-4"
          style={{
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
        <Text className="text-gray-700 mt-4 font-semibold text-base">Đang tải đơn hàng...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: '#F0F9FF' }}>
        <View 
          className="bg-white rounded-full p-6 mb-4"
          style={{
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
        </View>
        <Text className="text-gray-900 text-center mt-4 text-xl font-bold">
          Không thể tải đơn hàng
        </Text>
        <Text className="text-gray-600 text-center mt-2 text-base leading-6">
          Vui lòng kiểm tra kết nối và thử lại
        </Text>
        <TouchableOpacity
          className="bg-blue-500 px-8 py-4 rounded-xl mt-6"
          style={{
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          onPress={() => refetch()}
        >
          <View className="flex-row items-center">
            <Ionicons name="refresh" size={20} color="white" />
            <Text className="text-white font-bold ml-2 text-base">Thử lại</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#F0F9FF' }}>
      {/* Header với gradient */}
      <View 
        className="px-5 pt-12 pb-6"
        style={{
          backgroundColor: '#3B82F6',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-2xl font-bold text-white">Đơn hàng sẵn sàng</Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-blue-100 text-sm">
                {orders.length} đơn hàng đang chờ
              </Text>
              {isConnected && (
                <View className="ml-2 flex-row items-center">
                  <View className="w-2 h-2 bg-green-400 rounded-full mr-1" />
                  <Text className="text-green-200 text-xs">Real-time</Text>
                </View>
              )}
            </View>
          </View>
          <View 
            className="rounded-full p-3"
            style={{ 
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <Ionicons name="cube" size={24} color="white" />
          </View>
        </View>
      </View>

      {orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View 
            className="bg-white rounded-full p-8 mb-6"
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
          </View>
          <Text className="text-gray-800 text-xl font-bold mt-4 text-center">
            Không có đơn hàng nào
          </Text>
          <Text className="text-gray-500 text-center mt-2 text-base leading-6">
            Hiện tại không có đơn hàng nào sẵn sàng để giao{'\n'}
            Vui lòng quay lại sau
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl 
              refreshing={isRefetching} 
              onRefresh={refetch}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
        >
          <View className="px-4 pt-4 pb-6">
            {orders.map((order: any, index: number) => (
              <TouchableOpacity
                key={order.id}
                className="bg-white rounded-2xl p-5 mb-4"
                style={{
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 6,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
                onPress={() => (navigation as any).navigate('OrderDetail', { orderId: order.id })}
              >
                {/* Header với badge */}
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View className="bg-blue-100 rounded-lg px-3 py-1 mr-2">
                        <Text className="text-blue-600 font-bold text-xs">#{order.id.slice(-6)}</Text>
                      </View>
                      <View 
                        className="bg-green-100 rounded-full px-3 py-1"
                        style={{ backgroundColor: '#D1FAE5' }}
                      >
                        <Text className="text-green-700 font-bold text-xs">Sẵn sàng</Text>
                      </View>
                    </View>
                    <Text className="text-2xl font-bold text-gray-900 mt-2">
                      {formatCurrency(order.totalAmount)}
                    </Text>
                  </View>
                  <View 
                    className="bg-blue-500 rounded-full p-3"
                    style={{
                      shadowColor: '#3B82F6',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <Ionicons name="cube" size={24} color="white" />
                  </View>
                </View>

                {/* Địa chỉ */}
                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                  <View className="flex-row items-start">
                    <View 
                      className="bg-blue-500 rounded-full p-2 mr-3"
                      style={{ marginTop: 2 }}
                    >
                      <Ionicons name="location" size={18} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wide">
                        Địa chỉ giao hàng
                      </Text>
                      <Text className="text-gray-900 text-sm leading-5" numberOfLines={2}>
                        {getAddressString(order.address)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Thông tin bổ sung */}
                <View className="flex-row justify-between items-center mb-4">
                  {order.shippingDistance && (
                    <View className="flex-row items-center bg-blue-50 rounded-lg px-3 py-2 flex-1 mr-2">
                      <Ionicons name="navigate" size={16} color="#3B82F6" />
                      <Text className="text-blue-700 font-semibold text-xs ml-2">
                        {order.shippingDistance.toFixed(1)} km
                      </Text>
                    </View>
                  )}
                  {order.shippingFee && (
                    <View className="flex-row items-center bg-green-50 rounded-lg px-3 py-2 flex-1">
                      <Ionicons name="cash" size={16} color="#10B981" />
                      <Text className="text-green-700 font-semibold text-xs ml-2">
                        {formatCurrency(order.shippingFee)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Button */}
                <TouchableOpacity
                  className="bg-blue-500 rounded-xl py-4"
                  style={{
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                  onPress={() => (navigation as any).navigate('OrderDetail', { orderId: order.id })}
                >
                  <View className="flex-row items-center justify-center">
                    <Text className="text-white font-bold text-base mr-2">Xem chi tiết</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </View>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default OrdersScreen;
