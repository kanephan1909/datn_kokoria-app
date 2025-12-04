import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fetchOrders} from '../../api/apiClient';
import {useCart} from '../store/useCartStore';
import {MainRoutes} from '../navigation/Routes';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
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
  const navigation = useNavigation();
  const route = useRoute();
  const {cartItems, totalPrice, updateItem} = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isTabScreen = route.name === MainRoutes.Order;
  const canGoBack = !isTabScreen && navigation.canGoBack();

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchOrders({
        limit: 10,
      });
      if (response.success && response.data) {
        const ordersList = Array.isArray(response.data)
          ? response.data
          : response.data.orders || response.data.data || [];
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusText = (status: string) => {
    const statusMap: {[key: string]: string} = {
      pending: 'Đang đến',
      confirmed: 'Đang đến',
      preparing: 'Đang đến',
      ready: 'Đang đến',
      delivering: 'Đang đến',
      completed: 'Đã giao',
      cancelled: 'Đã hủy',
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const getStatusColor = (status: string) => {
    if (status.toLowerCase() === 'completed') {
      return '#EF4444';
    }
    return '#EF4444';
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      return;
    }
    await updateItem(itemId, newQuantity);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {canGoBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
          <Ionicons name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Order Summary Section */}
        {cartItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
            <View style={styles.summaryCard}>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <View style={styles.itemImageContainer}>
                    {item.product.imageUrl ? (
                      <Image
                        source={{uri: item.product.imageUrl}}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Ionicons name="restaurant" size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    {item.product.description && (
                      <Text style={styles.itemDescription} numberOfLines={1}>
                        {item.product.description}
                      </Text>
                    )}
                    <View style={styles.itemFooter}>
                      <View style={styles.quantitySelector}>
                        <TouchableOpacity
                          onPress={() =>
                            handleQuantityChange(item.id, item.quantity - 1)
                          }
                          style={styles.quantityButton}>
                          <Ionicons name="remove" size={16} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{item.quantity}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            handleQuantityChange(item.id, item.quantity + 1)
                          }
                          style={styles.quantityButton}>
                          <Ionicons name="add" size={16} color="#000" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>
                    {formatPrice(item.price)}
                  </Text>
                </View>
              ))}
              <View style={styles.summaryTotal}>
                <Text style={styles.totalItemsText}>
                  Tổng {totalItems} sản phẩm
                </Text>
                <Text style={styles.totalPriceText}>
                  {formatPrice(totalPrice)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.placeOrderButton}
                activeOpacity={0.7}
                onPress={() => {
                  console.log('Place Order button pressed');
                  // Navigate to OrderScreen (Checkout screen) để đặt hàng
                  (navigation as any).navigate(MainRoutes.Checkout);
                }}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Text style={styles.placeOrderText}>Đặt hàng</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
              <TouchableOpacity
                key={order.id}
                activeOpacity={0.7}
                onPress={() => {
                  (navigation as any).navigate(MainRoutes.OrderDetails, {
                    orderId: order.id,
                  });
                }}
                style={styles.orderCard}>
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
                      ? `${order.address.address}, ${order.address.ward}`
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
                    <TouchableOpacity
                      style={styles.trackButton}
                      activeOpacity={0.7}
                      onPress={() => {
                        (navigation as any).navigate(MainRoutes.OrderDetails, {
                          orderId: order.id,
                        });
                      }}>
                      <Text style={styles.trackButtonText}>Theo dõi</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
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
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignSelf: 'flex-start',
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
