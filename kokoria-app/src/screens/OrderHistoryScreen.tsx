import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fetchOrders} from '../../api/apiClient';
import {MainRoutes} from '../navigation/Routes';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  total: number;
  items: Array<{
    product: {
      id: string;
      name: string;
      imageUrl?: string;
      description?: string;
    };
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  address?: {
    address: string;
    ward: string;
    district: string;
    city: string;
  };
  restaurant?: {
    name: string;
  };
}

const OrderHistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Luôn hiển thị nút back nếu có thể quay lại
  const canGoBack = navigation.canGoBack();

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchOrders({
        limit: 10,
      });
      if (response.success && response.data) {
        let ordersList = Array.isArray(response.data)
          ? response.data
          : response.data.orders || response.data.data || [];

        // Lọc chỉ hiển thị đơn hàng đã thanh toán thành công hoặc đã được xác nhận
        ordersList = ordersList.filter((order: Order) => {
          const paymentStatus = order.paymentStatus?.toUpperCase();
          const paymentMethod = order.paymentMethod?.toUpperCase();
          const orderStatus = order.status?.toUpperCase();

          // Đơn COD/CASH: hiển thị nếu đã được xác nhận (status không phải PENDING)
          if (paymentMethod === 'COD' || paymentMethod === 'CASH') {
            // COD được xác nhận khi status không phải PENDING
            if (orderStatus &&
                orderStatus !== 'PENDING' &&
                orderStatus !== 'CANCELED' &&
                orderStatus !== 'CANCELLED') {
              return true;
            }
            return false;
          }

          // Đơn ONLINE: chỉ hiển thị nếu đã thanh toán thành công
          // Bỏ qua đơn ONLINE đang chờ thanh toán
          if (paymentStatus === 'PAYMENT_PENDING' || paymentStatus === 'PENDING') {
            return false;
          }

          // Hiển thị đơn ONLINE đã thanh toán thành công
          if (paymentStatus === 'PAYMENT_SUCCESS' || paymentStatus === 'SUCCESS') {
            return true;
          }

          return false;
        });

        setOrders(ordersList);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);


  const getStatusText = (status: string) => {
    const statusMap: {[key: string]: string} = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
      ready: 'Sẵn sàng',
      ready_for_pickup: 'Sẵn sàng lấy hàng',
      picked_up: 'Shipper đã lấy hàng',
      delivering: 'Đang giao hàng',
      completed: 'Đã giao hàng',
      cancelled: 'Đã hủy',
      canceled: 'Đã hủy',
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const getStatusColor = (status: string) => {
    if (status.toLowerCase() === 'completed') {
      return '#EF4444';
    }
    return '#EF4444';
  };



  return (
    <SafeAreaView edges={[]} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: statusBarHeight + 16}]}>
        {canGoBack ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
        <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
          <Ionicons name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Ordered Items Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Đơn hàng đã đặt</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#EA580C" />
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có đơn hàng</Text>
            </View>
          ) : (
            orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    (navigation as any).navigate(MainRoutes.OrderDetails, {
                      orderId: order.id,
                    });
                  }}
                  style={styles.orderCardContent}>
                  <View style={styles.orderImageContainer}>
                    {order.items[0]?.product?.imageUrl ? (
                      <Image
                        source={{uri: order.items[0].product.imageUrl}}
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
                      {order.items[0]?.product?.name || 'Đơn hàng'}
                    </Text>
                    <Text style={styles.orderDetail}>
                      Giao hàng ·{' '}
                      {order.address
                        ? (() => {
                            const addressParts = [
                              order.address.address,
                              order.address.ward,
                              order.address.district,
                              order.address.city,
                            ].filter(Boolean);
                            return addressParts.length > 0
                              ? addressParts.join(', ')
                              : 'Chưa có địa chỉ';
                          })()
                        : 'Chưa có địa chỉ'}
                    </Text>
                    <Text style={styles.orderDetail}>
                      Từ {order.restaurant?.name || 'Nhà hàng'}
                    </Text>
                    <View style={styles.orderFooter}>
                      <Text
                        style={[
                          styles.orderStatus,
                          {color: getStatusColor(order.status)},
                        ]}>
                        {getStatusText(order.status)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.trackButton}
                  activeOpacity={0.7}
                  onPress={() => {
                    (navigation as any).navigate(MainRoutes.LiveTrackingMap, {
                      orderId: order.id,
                    });
                  }}>
                  <Text style={styles.trackButtonText}>Theo dõi</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  backButton: {
    marginRight: 12,
  },
  placeholder: {
    width: 40,
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
  scrollContent: {
    paddingBottom: 100, // Tăng padding để button không bị che
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginRight: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
    position: 'relative',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
    zIndex: 1,
  },
  itemDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  itemNote: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quantityButton: {
    padding: 4,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    marginBottom: 16,
  },
  totalItemsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  totalPriceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  placeOrderButton: {
    backgroundColor: '#EA580C',
    borderRadius: 50,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 45,
    width: '100%',
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  orderCardContent: {
    flexDirection: 'row',
    flex: 1,
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
    marginLeft: 12,
    alignSelf: 'flex-start',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default OrderHistoryScreen;
