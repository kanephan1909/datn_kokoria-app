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
import Ionicons from '@react-native-vector-icons/ionicons';
import LinearGradient from 'react-native-linear-gradient';

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

        if (!cartClearedRef.current) {
          try {
            await clearCart();
            cartClearedRef.current = true;
            console.log('✅ Cart cleared after successful order');
          } catch (error) {
            console.error('Error clearing cart:', error);
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Success Header */}
      <LinearGradient
        colors={['#FFF4E6', '#FFE4CC', '#FFFFFF']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        locations={[0, 0.5, 1]}
        style={styles.headerGradient}>
        <View style={styles.headerContent}>
          {/* Success Icon với decorative circles */}
          <View style={styles.successIconWrapper}>
            {/* Outer decorative circle */}
            <View style={styles.decorativeCircleOuter} />
            {/* Middle decorative circle */}
            <View style={styles.decorativeCircleMiddle} />
            {/* Main icon circle */}
            <View style={styles.successIconCircle}>
              <View style={styles.successIconSquare}>
                <Ionicons name="receipt" size={32} color="#FFFFFF" />
              </View>
            </View>
          </View>

          <Text style={styles.headerTitle}>Đặt hàng thành công!</Text>
          <Text style={styles.headerSubtitle}>
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
          </Text>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="receipt-outline" size={20} color="#F97316" />
              </View>
              <Text style={styles.cardTitle}>Thông tin đơn hàng</Text>
            </View>
            <Text style={styles.orderCodeText}>#{orderNumber}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color="#9CA3AF"
                style={styles.infoIcon}
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày đặt</Text>
                <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Tổng tiền</Text>
            <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Delivery Address Card */}
        {order.address && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={styles.iconBadge}>
                  <Ionicons name="location" size={20} color="#F97316" />
                </View>
                <Text style={styles.cardTitle}>Địa chỉ giao hàng</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.addressSection}>
              <View style={styles.addressRow}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color="#6B7280"
                  style={styles.addressIcon}
                />
                <Text style={styles.addressName}>{order.address.name}</Text>
              </View>

              <View style={styles.addressRow}>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color="#6B7280"
                  style={styles.addressIcon}
                />
                <Text style={styles.addressPhone}>{order.address.phone}</Text>
              </View>

              {fullAddress ? (
                <View style={styles.addressRow}>
                  <Ionicons
                    name="map-outline"
                    size={18}
                    color="#6B7280"
                    style={styles.addressIcon}
                  />
                  <Text style={styles.addressText} numberOfLines={2}>
                    {fullAddress}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Ordered Products Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="fast-food" size={20} color="#F97316" />
              </View>
              <Text style={styles.cardTitle}>Sản phẩm đã đặt</Text>
            </View>
            <Text style={styles.itemsCountText}>{order.items.length} món</Text>
          </View>

          <View style={styles.cardDivider} />

          {order.items.slice(0, 3).map((item, index) => (
            <View key={item.id || item.productId || index}>
              <View style={styles.productItem}>
                <View style={styles.productLeft}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.product?.name || 'Món ăn'}
                  </Text>
                  <Text style={styles.productMeta}>
                    x{item.quantity} · {formatPrice(item.price)}
                  </Text>
                </View>
                <Text style={styles.productTotal}>
                  {formatPrice(item.price * item.quantity)}
                </Text>
              </View>
              {index < Math.min(order.items.length, 3) - 1 && (
                <View style={styles.productDivider} />
              )}
            </View>
          ))}

          {order.items.length > 3 && (
            <Text style={styles.moreItemsText}>
              +{order.items.length - 3} món khác
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={handleTrackOrder}>
          <View style={styles.primaryButtonContent}>
            <Ionicons name="navigate" size={22} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Theo dõi đơn hàng</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={handleViewOrderDetails}>
          <View style={styles.secondaryButtonContent}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color="#F97316"
              style={styles.secondaryButtonIcon}
            />
            <Text style={styles.secondaryButtonText}>Xem chi tiết đơn hàng</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ghostButton}
          activeOpacity={0.7}
          onPress={handleGoHome}>
          <Ionicons
            name="home-outline"
            size={18}
            color="#6B7280"
            style={styles.ghostButtonIcon}
          />
          <Text style={styles.ghostButtonText}>Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  successIconWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  decorativeCircleOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.1)',
  },
  decorativeCircleMiddle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  successIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  orderCodeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemsCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  infoSection: {
    marginTop: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginTop: 3,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 20,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F97316',
  },
  addressSection: {
    marginTop: 0,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  addressIcon: {
    marginTop: 3,
    marginRight: 12,
    width: 20,
  },
  addressName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 22,
  },
  addressPhone: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  productLeft: {
    flex: 1,
    paddingRight: 16,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 20,
  },
  productMeta: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  productTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
  },
  productDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 52,
  },
  moreItemsText: {
    marginTop: 12,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  primaryButton: {
    backgroundColor: '#F97316',
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#F97316',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F97316',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  secondaryButtonIcon: {
    marginRight: 10,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F97316',
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  ghostButtonIcon: {
    marginRight: 8,
  },
  ghostButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default OrderConfirmationScreen;
