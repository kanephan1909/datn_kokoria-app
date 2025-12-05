import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {fetchOrderById} from '../../api/apiClient';
import {MainRoutes} from '../navigation/Routes';
import {formatPrice, formatDate} from '../utils/formatters';
import {useCart} from '../store/useCartStore';

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

const OrderConfirmationScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {orderId} = route.params as {orderId: string};
  const {clear: clearCart} = useCart();
  const cartClearedRef = useRef(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        setOrder(response.data);

        // Xóa giỏ hàng sau khi load order thành công (chỉ xóa một lần)
        if (!cartClearedRef.current) {
          try {
            await clearCart();
            cartClearedRef.current = true;
            console.log('✅ Cart cleared after successful order');
          } catch (error) {
            console.error('Error clearing cart:', error);
            // Không block UI nếu xóa giỏ hàng lỗi
          }
        }
      } else {
        (navigation as any).goBack();
      }
    } catch (error) {
      console.error('Error loading order:', error);
      (navigation as any).goBack();
    } finally {
      setIsLoading(false);
    }
  }, [orderId, navigation, clearCart]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleTrackOrder = () => {
    if (order) {
      (navigation as any).navigate(MainRoutes.LiveTrackingMap, {
        orderId: order.id,
      });
    }
  };

  const handleViewOrderDetails = () => {
    if (order) {
      (navigation as any).navigate(MainRoutes.OrderDetails, {
        orderId: order.id,
      });
    }
  };

  const handleGoHome = () => {
    (navigation as any).navigate('TabNavigator', {
      screen: MainRoutes.Home,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return null;
  }

  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  const total = order.total || order.totalAmount || 0;

  const fullAddress = order.address
    ? [
        order.address.address,
        order.address.ward,
        order.address.district,
        order.address.city,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER SUCCESS */}
      <View style={styles.header}>
        <View style={styles.checkWrapper}>
          <Ionicons name="checkmark" size={30} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Đặt hàng thành công!</Text>
        <Text style={styles.headerSubtitle}>
          Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
        </Text>
      </View>

      {/* MAIN CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ORDER INFO */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons
                name="receipt-outline"
                size={18}
                color="#F97316"
                style={{marginRight: 6}}
              />
              <Text style={styles.cardTitle}>Thông tin đơn hàng</Text>
            </View>
            <Text style={styles.orderCode}>#{orderNumber}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Ngày đặt</Text>
            <Text style={styles.value}>{formatDate(order.createdAt)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Tổng tiền</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* DELIVERY ADDRESS */}
        {order.address && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color="#F97316"
                  style={{marginRight: 6}}
                />
                <Text style={styles.cardTitle}>Địa chỉ giao hàng</Text>
              </View>
            </View>

            <Text style={styles.addressName}>{order.address.name}</Text>
            <Text style={styles.addressPhone}>{order.address.phone}</Text>
            {!!fullAddress && (
              <Text style={styles.addressText} numberOfLines={2}>
                {fullAddress}
              </Text>
            )}
          </View>
        )}

        {/* ITEMS PREVIEW */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons
                name="fast-food-outline"
                size={18}
                color="#F97316"
                style={{marginRight: 6}}
              />
              <Text style={styles.cardTitle}>Sản phẩm đã đặt</Text>
            </View>
            <Text style={styles.itemsCount}>{order.items.length} món</Text>
          </View>

          {order.items.slice(0, 3).map(item => (
            <View
              key={item.id || item.productId}
              style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.product?.name || 'Món ăn'}
                </Text>
                <Text style={styles.itemMeta}>
                  x{item.quantity} · {formatPrice(item.price)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}

          {order.items.length > 3 && (
            <Text style={styles.moreItemsText}>
              +{order.items.length - 3} món khác
            </Text>
          )}
        </View>

        {/* NOTE (OPTIONAL) */}
        {order.note ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={18}
                  color="#F97316"
                  style={{marginRight: 6}}
                />
                <Text style={styles.cardTitle}>Ghi chú cho cửa hàng</Text>
              </View>
            </View>
            <Text style={styles.noteText}>{order.note}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ACTIONS BOTTOM SHEET */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleTrackOrder}>
          <Ionicons
            name="navigate-outline"
            size={18}
            color="#fff"
            style={{marginRight: 6}}
          />
          <Text style={styles.primaryButtonText}>Theo dõi đơn hàng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={handleViewOrderDetails}>
          <Text style={styles.secondaryButtonText}>
            Xem chi tiết đơn hàng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ghostButton}
          activeOpacity={0.85}
          onPress={handleGoHome}>
          <Text style={styles.ghostButtonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 18,
    backgroundColor: '#FFE4CC', // cam nhạt
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  checkWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  orderCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
  },
  value: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F97316',
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#4B5563',
  },
  itemsCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 12,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemTotal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  moreItemsText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  noteText: {
    fontSize: 13,
    color: '#4B5563',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    paddingVertical: 12,
    borderRadius: 999,
    marginBottom: 10,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
  },
  ghostButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  ghostButtonText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default OrderConfirmationScreen;
