import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  StyleSheet,
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

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      PENDING: 'Arriving',
      CONFIRMED: 'Arriving',
      PREPARING: 'Arriving',
      READY_FOR_PICKUP: 'Arriving',
      PICKED_UP: 'Arriving',
      DELIVERING: 'Arriving',
      COMPLETED: 'Delivered',
      CANCELED: 'Cancelled',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'COMPLETED') {
      return '#EF4444';
    }
    if (status === 'CANCELED') {
      return '#EF4444';
    }
    return '#EF4444';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getOrderImage = (order: any) => {
    if (order.items && order.items.length > 0 && order.items[0].product?.imageUrl) {
      return order.items[0].product.imageUrl;
    }
    return null;
  };

  const getOrderName = (order: any) => {
    if (order.items && order.items.length > 0) {
      return order.items[0].product?.name || 'Order';
    }
    return 'Order';
  };

  const getDeliveryAddress = (order: any) => {
    if (order.address) {
      return `${order.address.address || ''}, ${order.address.ward || ''}`.trim();
    }
    return '123 Tokyo Lane';
  };

  const getRestaurantName = (order: any) => {
    return order.restaurant?.name || 'Sushi World';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Có lỗi xảy ra khi tải đơn hàng</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
          <Ionicons name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Ordered Items Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đơn hàng đã đặt</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy đơn hàng' : 'Chưa có đơn hàng nào'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Đơn hàng sẽ hiển thị ở đây'}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }>
            {filteredOrders.map((order: any) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() =>
                  (navigation as any).navigate('OrderDetail', { orderId: order.id })
                }>
                <View style={styles.orderImageContainer}>
                  {getOrderImage(order) ? (
                    <Image
                      source={{ uri: getOrderImage(order) }}
                      style={styles.orderImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Ionicons name="restaurant" size={24} color="#9CA3AF" />
                    </View>
                  )}
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderName} numberOfLines={1}>
                    {getOrderName(order)}
                  </Text>
                  <Text style={styles.orderDetail}>
                    Delivery · {getDeliveryAddress(order)}
                  </Text>
                  <Text style={styles.orderDetail}>From {getRestaurantName(order)}</Text>
                  <View style={styles.orderFooter}>
                    <Text
                      style={[
                        styles.orderStatus,
                        { color: getStatusColor(order.status) },
                      ]}>
                      {getStatusText(order.status)}
                    </Text>
                    <TouchableOpacity
                      style={styles.trackButton}
                      activeOpacity={0.7}
                      onPress={() =>
                        (navigation as any).navigate('OrderDetail', { orderId: order.id })
                      }>
                      <Text style={styles.trackButtonText}>Track</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  section: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginRight: 12,
  },
  orderImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  orderDetail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  trackButton: {
    backgroundColor: '#EA580C',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default OrdersScreen;
