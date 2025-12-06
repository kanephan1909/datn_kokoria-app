import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import React, {useEffect, useState, useCallback} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import LinearGradient from 'react-native-linear-gradient';
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
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;

  const parseAddress = (addressData: any) => {
    if (!addressData) {
      return null;
    }

    if (typeof addressData === 'string') {
      try {
        addressData = JSON.parse(addressData);
      } catch (e) {
        console.log('Failed to parse address string:', e);
        return null;
      }
    }

    if (typeof addressData === 'object') {
      const result: any = {
        name: addressData.name || '',
        phone: addressData.phone || addressData.mobile || '',
        address: addressData.address || addressData.street || '',
        ward: addressData.ward || '',
        district: addressData.district || '',
        city: addressData.city || '',
      };

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

        if (orderData.address) {
          const addressObj =
            typeof orderData.address === 'string'
              ? JSON.parse(orderData.address)
              : orderData.address;
          const parsedAddress = parseAddress(addressObj);
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
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return null;
  }

  const canCancel =
    order.status.toLowerCase() === 'pending' ||
    order.status.toLowerCase() === 'confirmed';
  const statusColor = getStatusColor(order.status);
  const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();
  const total = order.totalAmount || order.total || 0;

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
    <SafeAreaView style={styles.safeArea} edges={[]}>
      {/* Header */}
      <LinearGradient
        colors={['#F97316', '#EA580C']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={[styles.header, {paddingTop: statusBarHeight + 16}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={styles.headerRight} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Order Status Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="receipt-outline" size={20} color="#F97316" />
              </View>
              <Text style={styles.cardTitle}>Thông tin đơn hàng</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã đơn hàng</Text>
            <Text style={styles.orderCodeText}>#{orderNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái</Text>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: `${statusColor}15`},
              ]}>
              <View
                style={[styles.statusDot, {backgroundColor: statusColor}]}
              />
              <Text style={[styles.statusText, {color: statusColor}]}>
                {getStatusText(order.status)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color="#9CA3AF"
                style={styles.infoIcon}
              />
              <Text style={styles.infoLabel}>Ngày đặt</Text>
            </View>
            <Text style={styles.infoValue}>{formatDate(order.createdAt)}</Text>
          </View>
        </View>

        {/* Delivery Address Card */}
        {order.address && order.address.name && (
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

              {order.address.phone && (
                <View style={styles.addressRow}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color="#6B7280"
                    style={styles.addressIcon}
                  />
                  <Text style={styles.addressPhone}>{order.address.phone}</Text>
                </View>
              )}

              {fullAddress ? (
                <View style={styles.addressRow}>
                  <Ionicons
                    name="map-outline"
                    size={18}
                    color="#6B7280"
                    style={styles.addressIcon}
                  />
                  <Text style={styles.addressText} numberOfLines={3}>
                    {fullAddress}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Order Items Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="fast-food" size={20} color="#F97316" />
              </View>
              <Text style={styles.cardTitle}>Sản phẩm ({order.items.length})</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {order.items.map((item, index) => {
            const product = item.product;
            const itemId = item.id || item.productId || `item-${index}`;
            const productName = product?.name || 'Sản phẩm';
            const productImageUrl = product?.imageUrl;

            return (
              <View key={itemId}>
                <View style={styles.productItem}>
                  <View style={styles.productImageContainer}>
                    {productImageUrl ? (
                      <Image
                        source={{uri: productImageUrl}}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.productImagePlaceholder}>
                        <Ionicons name="restaurant" size={24} color="#F97316" />
                      </View>
                    )}
                  </View>

                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {productName}
                    </Text>
                    <Text style={styles.productMeta}>
                      {formatPrice(item.price)} × {item.quantity}
                    </Text>
                  </View>

                  <Text style={styles.productTotal}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
                {index < order.items.length - 1 && (
                  <View style={styles.productDivider} />
                )}
              </View>
            );
          })}
        </View>

        {/* Note Card */}
        {order.note && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <View style={styles.iconBadge}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={20}
                    color="#F97316"
                  />
                </View>
                <Text style={styles.cardTitle}>Ghi chú</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>{order.note}</Text>
            </View>
          </View>
        )}

        {/* Total Card */}
        <View style={styles.card}>
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Cancel Button */}
      {canCancel && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={handleCancelOrder}
            style={styles.cancelButton}
            activeOpacity={0.8}>
            <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
            <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  orderCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
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
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  productImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF4E6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4E6',
  },
  productInfo: {
    flex: 1,
    paddingRight: 12,
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
    marginLeft: 76,
  },
  noteContainer: {
    marginTop: 0,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F97316',
  },
  noteText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F97316',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 8,
  },
});

export default OrderDetailsScreen;
