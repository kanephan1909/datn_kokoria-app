import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { fetchOrderById, acceptOrder, updateOrderStatus } from '../api/apiClient';
import { useSocketContext } from '../context/SocketContext';
import { useDriverLocation } from '../hooks/useDriverLocation';
import { useDistanceMatrix } from '../hooks/useDistanceMatrix';

const OrderDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { orderId } = route.params as { orderId: string };
  const { isConnected } = useSocketContext();

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId),
    refetchInterval: isConnected ? false : 5000, // Nếu có socket thì không cần polling
  });

  const order = data?.data;

  // Bật tracking vị trí khi đang giao hàng (status = DELIVERING)
  const isDelivering = order?.status === 'DELIVERING';
  const { location: driverLocation, error: locationError } = useDriverLocation({
    enabled: isDelivering,
    interval: 5000, // Cập nhật mỗi 5 giây
    orderId: orderId,
  });

  // Tính toán khoảng cách và thời gian từ shipper đến khách hàng
  // Sử dụng vị trí driver nếu có, nếu không thì dùng vị trí quán (restaurant)
  const origin = useMemo(() => {
    if (driverLocation?.coords) {
      return {
        latitude: driverLocation.coords.latitude,
        longitude: driverLocation.coords.longitude,
      };
    }
    // Nếu chưa có vị trí driver, có thể dùng vị trí quán hoặc null
    // (Có thể lấy từ order.restaurantLat, order.restaurantLng nếu có)
    if (order?.restaurantLat && order?.restaurantLng) {
      return {
        latitude: order.restaurantLat,
        longitude: order.restaurantLng,
      };
    }
    return null;
  }, [driverLocation, order?.restaurantLat, order?.restaurantLng]);

  const destination = useMemo(() => {
    if (order?.address?.latitude && order?.address?.longitude) {
      return {
        latitude: order.address.latitude,
        longitude: order.address.longitude,
      };
    }
    return null;
  }, [order?.address]);

  // Bật tính toán khoảng cách khi:
  // - Đang giao hàng (DELIVERING) và có vị trí driver
  // - Hoặc đã nhận đơn (PICKED_UP) để xem khoảng cách ban đầu
  const shouldCalculateDistance = (isDelivering || order?.status === 'PICKED_UP') && !!origin && !!destination;
  
  const {result: distanceResult, isLoading: isCalculatingDistance, error: distanceError} = useDistanceMatrix({
    origin,
    destination,
    enabled: shouldCalculateDistance,
    updateInterval: isDelivering ? 10000 : 0, // Chỉ tự động update khi đang giao hàng
  });

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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['availableOrders'] });
      
      // Emit qua socket để thông báo cho customer
      if (isConnected) {
        // SocketContext sẽ tự động handle order:statusUpdate event
      }
      
      if (variables.status === 'DELIVERING') {
        Alert.alert('Thành công', 'Đã bắt đầu giao hàng! Vị trí của bạn sẽ được cập nhật real-time.');
      } else if (variables.status === 'COMPLETED') {
        Alert.alert('Thành công', 'Đã hoàn thành giao hàng!');
        navigation.goBack();
      } else {
        Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng!');
      }
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
        <Text className="text-gray-700 mt-4 font-semibold text-base">Đang tải...</Text>
      </View>
    );
  }

  if (error || !order) {
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
      </View>
    );
  }

  const isAvailable = order.status === 'READY_FOR_PICKUP' && !order.driverId;
  const isMyOrder = order.driverId && ['PICKED_UP', 'DELIVERING'].includes(order.status);

  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string; bgColor: string } } = {
      READY_FOR_PICKUP: { text: 'Sẵn sàng', color: '#10B981', bgColor: '#D1FAE5' },
      PICKED_UP: { text: 'Đã lấy hàng', color: '#F59E0B', bgColor: '#FEF3C7' },
      DELIVERING: { text: 'Đang giao', color: '#3B82F6', bgColor: '#DBEAFE' },
      COMPLETED: { text: 'Đã giao', color: '#10B981', bgColor: '#D1FAE5' },
    };
    return statusMap[status] || { text: status, color: '#6B7280', bgColor: '#F3F4F6' };
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: '#F0F9FF' }}>
      {/* Order Info */}
      <View className="bg-white mx-4 my-4 rounded-2xl p-5" style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
      }}>
        <View className="flex-row justify-between items-start mb-5">
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
            <Text className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Address */}
        <View className="border-t border-gray-100 pt-5 mt-5">
          <Text className="text-gray-500 text-xs font-semibold mb-3 uppercase tracking-wide">
            Địa chỉ giao hàng
          </Text>
          <View className="bg-gray-50 rounded-xl p-4 mb-4">
            <Text className="text-gray-900 text-base leading-6">
              {getAddressString(order.address)}
            </Text>
          </View>
          
          {order.address?.latitude && order.address?.longitude && (
            <TouchableOpacity
              className="flex-row items-center justify-center bg-blue-500 px-6 py-4 rounded-xl"
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
              onPress={() => openGoogleMaps(order.address.latitude, order.address.longitude)}
            >
              <Ionicons name="navigate" size={22} color="white" />
              <Text className="text-white font-bold ml-2 text-base">Mở Google Maps</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Items */}
        {order.items && Array.isArray(order.items) && order.items.length > 0 && (
          <View className="border-t border-gray-100 pt-5 mt-5">
            <Text className="text-gray-500 text-xs font-semibold mb-3 uppercase tracking-wide">
              Sản phẩm
            </Text>
            {order.items.map((item: any, index: number) => (
              <View 
                key={index} 
                className="flex-row justify-between items-center py-3 px-4 bg-gray-50 rounded-xl mb-2"
              >
                <View className="flex-1 mr-3">
                  <Text className="text-gray-900 font-semibold text-base">
                    {item.name || item.productName}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    Số lượng: {item.quantity || 1}
                  </Text>
                </View>
                <Text className="text-gray-900 font-bold text-base">
                  {formatCurrency((item.price || 0) * (item.quantity || 1))}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Note */}
        {order.note && (
          <View className="border-t border-gray-100 pt-5 mt-5">
            <Text className="text-gray-500 text-xs font-semibold mb-3 uppercase tracking-wide">
              Ghi chú
            </Text>
            <View className="bg-yellow-50 rounded-xl p-4 border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
              <Text className="text-gray-900 text-base leading-6">{order.note}</Text>
            </View>
          </View>
        )}

        {/* Customer Info & Chat */}
        {order.user && (
          <View className="border-t border-gray-100 pt-5 mt-5">
            <Text className="text-gray-500 text-xs font-semibold mb-3 uppercase tracking-wide">
              Khách hàng
            </Text>
            <View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-4">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center mr-3">
                  <Text className="text-white font-bold text-lg">
                    {order.user.name
                      ?.split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) || 'KH'}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-base">
                    {order.user.name || 'Khách hàng'}
                  </Text>
                  {order.user.phone && (
                    <Text className="text-gray-500 text-sm mt-1">
                      {order.user.phone}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center ml-3"
                style={{
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
                onPress={() => (navigation as any).navigate('Chat', {
                  orderId: orderId,
                  recipientName: order.user?.name,
                  recipientId: order.userId,
                })}
              >
                <Ionicons name="chatbubble" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      {isAvailable && (
        <View className="px-4 pb-6">
          <TouchableOpacity
            className="bg-green-500 rounded-2xl py-5"
            style={{
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}
            onPress={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <ActivityIndicator color="white" size="large" />
            ) : (
              <View className="flex-row items-center justify-center">
                <Ionicons name="checkmark-circle" size={24} color="white" />
                <Text className="text-white font-bold text-center text-lg ml-2">
                  Nhận đơn hàng
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isMyOrder && (
        <View className="px-4 pb-6">
          {/* Hiển thị khoảng cách khi đã nhận đơn (PICKED_UP) */}
          {order.status === 'PICKED_UP' && distanceResult && (
            <View className="bg-green-50 rounded-xl p-4 mb-3 border-l-4" style={{ borderLeftColor: '#10B981' }}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Ionicons name="navigate" size={20} color="#10B981" />
                  <Text className="text-green-700 font-semibold ml-2 text-sm">
                    Khoảng cách đến khách hàng
                  </Text>
                </View>
              </View>
              <Text className="text-green-800 font-bold text-lg mb-1">
                {distanceResult.distance.text}
              </Text>
              <Text className="text-green-600 text-sm">
                Thời gian ước tính: {distanceResult.duration.text}
              </Text>
            </View>
          )}

          {order.status === 'PICKED_UP' && (
            <TouchableOpacity
              className="bg-blue-500 rounded-2xl py-5 mb-3"
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
              onPress={() => updateStatusMutation.mutate({ status: 'DELIVERING' })}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <ActivityIndicator color="white" size="large" />
              ) : (
                <View className="flex-row items-center justify-center">
                  <Ionicons name="bicycle" size={24} color="white" />
                  <Text className="text-white font-bold text-center text-lg ml-2">
                    Bắt đầu giao hàng
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {order.status === 'DELIVERING' && (
            <>
              {/* Thông tin khoảng cách và thời gian */}
              {distanceResult && (
                <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 mb-3" style={{
                  backgroundColor: '#3B82F6',
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="navigate" size={24} color="white" />
                        <Text className="text-white font-bold text-lg ml-2">
                          Khoảng cách còn lại
                        </Text>
                      </View>
                      <Text className="text-blue-100 text-sm mb-3">
                        {distanceResult.distance.text}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name="time" size={20} color="white" />
                        <Text className="text-white font-semibold text-base ml-2">
                          Thời gian ước tính: {distanceResult.duration.text}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {isCalculatingDistance && !distanceResult && (
                <View className="bg-blue-50 rounded-xl p-4 mb-3 border-l-4" style={{ borderLeftColor: '#3B82F6' }}>
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text className="text-blue-700 font-semibold ml-2 text-sm">
                      Đang tính toán khoảng cách...
                    </Text>
                  </View>
                </View>
              )}

              {distanceError && (
                <View className="bg-yellow-50 rounded-xl p-4 mb-3 border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
                  <Text className="text-yellow-700 text-xs">
                    ⚠️ {distanceError}
                  </Text>
                </View>
              )}

              {driverLocation && (
                <View className="bg-blue-50 rounded-xl p-4 mb-3 border-l-4" style={{ borderLeftColor: '#3B82F6' }}>
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="location" size={20} color="#3B82F6" />
                    <Text className="text-blue-700 font-semibold ml-2 text-sm">
                      Đang cập nhật vị trí real-time
                    </Text>
                  </View>
                  <Text className="text-blue-600 text-xs">
                    Vị trí của bạn đang được gửi đến khách hàng
                  </Text>
                </View>
              )}
              {locationError && (
                <View className="bg-yellow-50 rounded-xl p-4 mb-3 border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
                  <Text className="text-yellow-700 text-xs">
                    ⚠️ {locationError}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                className="bg-green-500 rounded-2xl py-5"
                style={{
                  shadowColor: '#10B981',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 8,
                }}
                onPress={() => updateStatusMutation.mutate({ status: 'COMPLETED' })}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <ActivityIndicator color="white" size="large" />
                ) : (
                  <View className="flex-row items-center justify-center">
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                    <Text className="text-white font-bold text-center text-lg ml-2">
                      Hoàn thành giao hàng
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default OrderDetailScreen;
