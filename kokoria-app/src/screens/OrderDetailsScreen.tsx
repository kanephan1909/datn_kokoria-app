import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fetchOrderById, cancelOrder} from '../../api/apiClient';

interface OrderItem {
  id?: string;
  productId?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total?: number;
  totalAmount?: number;
  items: OrderItem[];
  address?: {
    name: string;
    phone: string;
    address: string;
    ward: string;
    district: string;
    city: string;
  };
  createdAt: string;
  note?: string;
}

const OrderDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {orderId} = route.params as {orderId: string};
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const parseAddress = (addressData: any) => {
    if (!addressData) {
      return null;
    }

    // Nếu address là string JSON, parse nó
    if (typeof addressData === 'string') {
      try {
        addressData = JSON.parse(addressData);
      } catch (e) {
        console.log('Failed to parse address string:', e);
        return null;
      }
    }

    // Nếu address là object, xử lý các trường hợp
    if (typeof addressData === 'object') {
      // Kiểm tra tất cả các field có thể có
      const result: any = {
        name: addressData.name || '',
        phone: addressData.phone || addressData.mobile || '',
        address: addressData.address || addressData.street || '',
        ward: addressData.ward || '',
        district: addressData.district || '',
        city: addressData.city || '',
      };

      // Nếu có locality, tách nó ra
      if (addressData.locality && !result.ward && !result.district && !result.city) {
        const localityParts = addressData.locality
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (localityParts.length > 0) {
          result.ward = localityParts[0] || '';
        }
        if (localityParts.length > 1) {
          result.district = localityParts[1] || '';
        }
        if (localityParts.length > 2) {
          result.city = localityParts.slice(2).join(', ') || '';
        }
      }

      // Chỉ trả về nếu có ít nhất name
      if (result.name) {
        return result;
      }
    }

    return null;
  };

  const loadOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        const orderData = response.data;

        // Debug: Log toàn bộ order data để tìm address
        console.log('Full order data from API:', JSON.stringify(orderData, null, 2));
        console.log('Raw address from API:', JSON.stringify(orderData.address, null, 2));

        // Parse address nếu có
        if (orderData.address) {
          // Kiểm tra xem address có phải là object với các field khác không
          const addressObj = typeof orderData.address === 'string'
            ? JSON.parse(orderData.address)
            : orderData.address;

          console.log('Address object:', JSON.stringify(addressObj, null, 2));

          const parsedAddress = parseAddress(addressObj);
          console.log('Parsed address:', JSON.stringify(parsedAddress, null, 2));

          // Nếu parsed address chỉ có name, thử tìm trong toàn bộ orderData
          if (parsedAddress && parsedAddress.name && !parsedAddress.address && !parsedAddress.ward) {
            console.log('Address incomplete, checking other fields in orderData...');
            // Có thể address data nằm ở đâu đó khác
          }

          orderData.address = parsedAddress;
        }

        setOrder(orderData);
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy đơn hàng');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [orderId, navigation]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#3B82F6';
      case 'preparing':
        return '#8B5CF6';
      case 'ready':
        return '#10B981';
      case 'delivering':
        return '#06B6D4';
      case 'completed':
        return '#059669';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: {[key: string]: string} = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
      ready: 'Sẵn sàng',
      delivering: 'Đang giao',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const handleCancelOrder = () => {
    if (!order) {
      return;
    }

    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc chắn muốn hủy đơn hàng này?',
      [
        {
          text: 'Không',
          style: 'cancel',
        },
        {
          text: 'Có, hủy đơn',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await cancelOrder(order.id, 'Người dùng hủy');
              if (response.success) {
                Alert.alert('Thành công', 'Đơn hàng đã được hủy');
                loadOrder();
              }
            } catch (error: any) {
              Alert.alert('Lỗi', error.response?.data?.message || 'Không thể hủy đơn hàng');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return null;
  }

  const canCancel = order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'confirmed';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-orange-500 px-4 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1">Chi tiết đơn hàng</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4">
          {/* Order Status */}
          <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 text-xs">Mã đơn hàng</Text>
              <Text className="text-gray-800 font-bold">
                #{order.orderNumber || order.id.slice(0, 8).toUpperCase()}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-500 text-xs">Trạng thái</Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{backgroundColor: `${getStatusColor(order.status)}20`}}>
                <Text
                  className="text-sm font-semibold"
                  style={{color: getStatusColor(order.status)}}>
                  {getStatusText(order.status)}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <Text className="text-gray-500 text-xs">Ngày đặt</Text>
              <Text className="text-gray-800 text-sm">{formatDate(order.createdAt)}</Text>
            </View>
          </View>

          {/* Delivery Address */}
          {order.address && order.address.name && (
            <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-center mb-3">
                <Ionicons name="location" size={20} color="#F97316" />
                <Text className="text-gray-800 font-semibold ml-2">Địa chỉ giao hàng</Text>
              </View>
              <Text className="text-gray-800 font-semibold">{order.address.name}</Text>
              {order.address.phone && (
                <Text className="text-gray-600 text-sm mt-1">{order.address.phone}</Text>
              )}
              {(() => {
                const addressParts = [
                  order.address?.address,
                  order.address?.ward,
                  order.address?.district,
                  order.address?.city,
                ].filter(Boolean);
                return addressParts.length > 0 ? (
                  <Text className="text-gray-600 text-sm mt-1">
                    {addressParts.join(', ')}
                  </Text>
                ) : null;
              })()}
            </View>
          )}

          {/* Order Items */}
          <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <Text className="text-gray-800 font-semibold mb-3">Sản phẩm</Text>
            {order.items.map((item, index) => {
              const product = item.product;
              const itemId = item.id || item.productId || `item-${index}`;
              const productName = product?.name || 'Sản phẩm';
              const productImageUrl = product?.imageUrl;

              return (
                <View
                  key={itemId}
                  className="flex-row items-center mb-3 pb-3"
                  style={index < order.items.length - 1 ? {borderBottomWidth: 1, borderBottomColor: '#F3F4F6'} : {}}>
                  <View className="w-12 h-12 rounded-lg bg-orange-100 items-center justify-center mr-3">
                    {productImageUrl ? (
                      <Image
                        source={{uri: productImageUrl}}
                        className="w-full h-full rounded-lg"
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="restaurant" size={24} color="#F97316" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-semibold" numberOfLines={2}>
                      {productName}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {formatPrice(item.price)} x {item.quantity}
                    </Text>
                  </View>
                  <Text className="text-orange-500 font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Note */}
          {order.note && (
            <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
              <Text className="text-gray-800 font-semibold mb-2">Ghi chú</Text>
              <Text className="text-gray-600 text-sm">{order.note}</Text>
            </View>
          )}

          {/* Total */}
          <View className="bg-white rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-800 font-bold text-lg">Tổng cộng</Text>
              <Text className="text-orange-500 font-bold text-xl">
                {formatPrice(order.totalAmount || order.total || 0)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Cancel Button */}
      {canCancel && (
        <View className="bg-white border-t border-gray-200 px-4 py-4">
          <TouchableOpacity
            onPress={handleCancelOrder}
            className="bg-red-50 rounded-xl py-4 items-center border border-red-200">
            <Text className="text-red-600 font-bold text-base">Hủy đơn hàng</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default OrderDetailsScreen;

