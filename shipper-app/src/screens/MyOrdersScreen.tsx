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
      CONFIRMED: { text: 'Đã xác nhận', color: '#10B981', bgColor: '#D1FAE5' },
      PREPARING: { text: 'Đang chuẩn bị', color: '#F59E0B', bgColor: '#FEF3C7' },
      READY_FOR_PICKUP: { text: 'Sẵn sàng lấy', color: '#3B82F6', bgColor: '#DBEAFE' },
      PICKED_UP: { text: 'Đã lấy hàng', color: '#F59E0B', bgColor: '#FEF3C7' },
      DELIVERING: { text: 'Đang giao', color: '#3B82F6', bgColor: '#DBEAFE' },
      COMPLETED: { text: 'Đã giao', color: '#10B981', bgColor: '#D1FAE5' },
    };
    return statusMap[status] || { text: status, color: '#6B7280', bgColor: '#F3F4F6' };
  };

  const getAddressString = (address: any) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address) {
      // Format mới: name, phone, address, ward, district, city
      if (address.address || address.ward || address.district || address.city) {
        const parts = [
          address.address,
          address.ward,
          address.district,
          address.city,
        ].filter(Boolean);
        return parts.join(', ') || 'Địa chỉ không xác định';
      }
      
      // Format cũ: flatNo, street, buildingName, locality
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
            <Text className="text-2xl font-bold text-white">Đơn của tôi</Text>
            <Text className="text-blue-100 text-sm mt-1">
              {orders.length} đơn hàng
            </Text>
          </View>
          <View 
            className="rounded-full p-3"
            style={{ 
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <Ionicons name="list" size={24} color="white" />
          </View>
        </View>
      </View>

      {/* Filter tabs */}
      <View 
        className="bg-white"
        style={{
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingHorizontal: 16, 
            paddingVertical: 12,
            alignItems: 'center',
          }}
        >
        <TouchableOpacity
          className={`px-5 py-2.5 mx-1 h-10 rounded-full ${
            selectedStatus === null 
              ? 'bg-blue-500' 
              : 'bg-gray-100'
          }`}
          onPress={() => setSelectedStatus(null)}
          style={{
            shadowColor: selectedStatus === null ? '#3B82F6' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: selectedStatus === null ? 0.3 : 0,
            shadowRadius: 4,
            elevation: selectedStatus === null ? 4 : 0,
          }}
        >
          <Text className={`font-bold text-sm ${
            selectedStatus === null ? 'text-white' : 'text-gray-600'
          }`}>
            Tất cả
          </Text>
        </TouchableOpacity>
        {['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERING', 'COMPLETED'].map((status) => {
          const info = getStatusInfo(status);
          const isSelected = selectedStatus === status;
          return (
            <TouchableOpacity
              key={status}
              className={`px-5 py-2.5 mx-1 rounded-full h-10`}
              style={{
                backgroundColor: isSelected ? info.color : '#F3F4F6',
                shadowColor: isSelected ? info.color : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isSelected ? 0.3 : 0,
                shadowRadius: 4,
                elevation: isSelected ? 4 : 0,
              }}
              onPress={() => setSelectedStatus(status)}
            >
              <Text className={`font-bold text-sm ${
                isSelected ? 'text-white' : 'text-gray-600'
              }`}>
                {info.text}
              </Text>
            </TouchableOpacity>
          );
        })}
        </ScrollView>
      </View>

      {orders.length === 0 ? (
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ 
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 40,
          }}
        >
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
            <Ionicons name="list-outline" size={64} color="#9CA3AF" />
          </View>
          <Text className="text-gray-800 text-xl font-bold mt-4 text-center">
            Không có đơn hàng nào
          </Text>
          <Text className="text-gray-500 text-center mt-2 text-base leading-6">
            {selectedStatus 
              ? 'Không có đơn hàng với trạng thái này'
              : 'Bạn chưa nhận đơn hàng nào'}
          </Text>
        </ScrollView>
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
            {orders.map((order: any) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <TouchableOpacity
                  key={order.id}
                  className="bg-white rounded-2xl p-5 mb-4"
                  style={{
                    shadowColor: statusInfo.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 6,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                  onPress={() => (navigation as any).navigate('OrderDetail', { orderId: order.id })}
                >
                  {/* Header */}
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <View className="bg-gray-100 rounded-lg px-3 py-1 mr-2">
                          <Text className="text-gray-700 font-bold text-xs">#{order.id.slice(-6)}</Text>
                        </View>
                        <View 
                          className="rounded-full px-3 py-1"
                          style={{ backgroundColor: statusInfo.bgColor }}
                        >
                          <Text 
                            className="font-bold text-xs"
                            style={{ color: statusInfo.color }}
                          >
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-2xl font-bold text-gray-900 mt-2">
                        {formatCurrency(order.totalAmount)}
                      </Text>
                    </View>
                    <View 
                      className="rounded-full p-3"
                      style={{ 
                        backgroundColor: statusInfo.bgColor,
                        shadowColor: statusInfo.color,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 4,
                      }}
                    >
                      <Ionicons name="cube" size={24} color={statusInfo.color} />
                    </View>
                  </View>

                  {/* Địa chỉ */}
                  <View className="bg-gray-50 rounded-xl p-4 mb-4">
                    <View className="flex-row items-start">
                      <View 
                        className="rounded-full p-2 mr-3"
                        style={{ 
                          backgroundColor: statusInfo.bgColor,
                          marginTop: 2 
                        }}
                      >
                        <Ionicons name="location" size={18} color={statusInfo.color} />
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

                  {/* Button */}
                  <TouchableOpacity
                    className="rounded-xl py-4"
                    style={{
                      backgroundColor: statusInfo.color,
                      shadowColor: statusInfo.color,
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
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default MyOrdersScreen;
