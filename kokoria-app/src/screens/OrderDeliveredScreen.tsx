import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {fetchOrderById, submitOrderRating, getOrderRating} from '../../api/apiClient';
import {MainRoutes} from '../navigation/Routes';
import {formatPrice} from '../utils/formatters';

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
  driver?: {
    id: string;
    name: string;
    phone?: string;
  };
  restaurant?: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

const OrderDeliveredScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;
  const {orderId} = route.params as {orderId: string};

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submittedRating, setSubmittedRating] = useState<{
    rating: number;
    comment?: string;
    createdAt?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        setOrder(response.data);
        
        // Kiểm tra xem order có rating không (từ include)
        if (response.data.rating) {
          setSubmittedRating({
            rating: response.data.rating.rating,
            comment: response.data.rating.comment || undefined,
            createdAt: response.data.rating.createdAt,
          });
        } else {
          // Nếu không có trong order, thử load riêng
          try {
            const ratingResponse = await getOrderRating(orderId);
            if (ratingResponse.success && ratingResponse.data) {
              setSubmittedRating({
                rating: ratingResponse.data.rating,
                comment: ratingResponse.data.comment || undefined,
                createdAt: ratingResponse.data.createdAt,
              });
            }
          } catch (ratingError) {
            // Ignore error nếu không tìm thấy rating (có thể chưa đánh giá)
            console.log('No rating found for order:', orderId);
          }
        }
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng');
        (navigation as any).goBack();
      }
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng');
      (navigation as any).goBack();
    } finally {
      setIsLoading(false);
    }
  }, [orderId, navigation]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleClose = () => {
    (navigation as any).goBack();
  };

  const handleChat = () => {
    if (order?.driver?.id) {
      (navigation as any).navigate(MainRoutes.Chat, {
        orderId: order.id,
        recipientName: order.driver.name,
        recipientId: order.driver.id,
      });
    }
  };

  const handleCall = () => {
    if (order?.driver?.phone) {
      Linking.openURL(`tel:${order.driver.phone}`);
    } else {
      Alert.alert('Thông báo', 'Số điện thoại shipper không khả dụng');
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn số sao đánh giá');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitOrderRating(orderId, {
        rating,
        comment: feedback.trim() || undefined,
      });

      if (response.success) {
        // Lưu rating đã submit để hiển thị
        setSubmittedRating({
          rating: response.data.rating,
          comment: response.data.comment || undefined,
          createdAt: response.data.createdAt,
        });
        
        // Reset form
        setRating(0);
        setFeedback('');
        
        Alert.alert('Cảm ơn bạn!', 'Đánh giá của bạn đã được ghi nhận');
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể gửi đánh giá');
      }
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      Alert.alert(
        'Lỗi',
        error?.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewOrderDetails = () => {
    if (order) {
      (navigation as any).navigate(MainRoutes.OrderDetails, {
        orderId: order.id,
      });
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) {
      return '';
    }
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  };

  const getAddressString = () => {
    if (!order?.address) {
      return '';
    }
    return order.address.address || '';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return null;
  }

  const orderNumber = order.orderNumber || `#ORD-${order.id.slice(-4)}`;
  const total = order.total || order.totalAmount || 0;
  const deliveredTime = order.completedAt || order.updatedAt || order.createdAt;
  const restaurantName = order.restaurant?.name || 'Kokoria Cheese & Drink';
  const driverName = order.driver?.name || 'Nhat Khang';

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, {paddingTop: statusBarHeight + 16}]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="close" size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chúc bạn ngon miệng!</Text>
        </View>

        {/* Order Summary Card */}
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <View style={styles.restaurantInfo}>
              <View style={styles.restaurantLogo}>
                <Ionicons name="restaurant" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.restaurantName}>{restaurantName}</Text>
            </View>
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{orderNumber}</Text>
            </View>
          </View>

          <Text style={styles.totalPaid}>
            Tổng thanh toán: {formatPrice(total)}
          </Text>
          <Text style={styles.orderDelivered}>Đơn hàng đã giao</Text>

          {/* Order items preview */}
          {order.items && order.items.length > 0 && (
            <View style={styles.itemsPreview}>
              {order.items.slice(0, 2).map((item, index) => (
                <View key={item.id || index} style={styles.itemPreview}>
                  {item.product?.imageUrl ? (
                    <Image
                      source={{uri: item.product.imageUrl}}
                      style={styles.itemImage}
                    />
                  ) : (
                    <View style={styles.itemImagePlaceholder}>
                      <Ionicons name="fast-food" size={20} color="#FF6B35" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Delivery Details Card */}
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Địa chỉ</Text>
            <Text style={styles.detailValue}>{getAddressString()}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Giao lúc</Text>
            <Text style={styles.detailValue}>{formatTime(deliveredTime)}</Text>
          </View>

          <View style={styles.driverSection}>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverAvatarText}>
                  {driverName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </View>
              <View style={styles.driverTextContainer}>
                <Text style={styles.driverLabel}>Giao bởi</Text>
                <Text style={styles.driverName}>{driverName}</Text>
              </View>
            </View>
            <View style={styles.driverActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleChat}>
                <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCall}>
                <Ionicons name="call-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.card}>
          <Text style={styles.ratingTitle}>
            {submittedRating ? 'Đánh giá của bạn' : 'Bạn cảm thấy thế nào?'}
          </Text>

          {submittedRating ? (
            /* Hiển thị đánh giá đã gửi */
            <View style={styles.submittedRatingContainer}>
              {/* Star Rating đã submit */}
              <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Ionicons
                    key={star}
                    name={star <= submittedRating.rating ? 'star' : 'star-outline'}
                    size={36}
                    color="#FF6B35"
                  />
                ))}
              </View>

              {/* Comment đã submit */}
              {submittedRating.comment && (
                <View style={styles.submittedCommentContainer}>
                  <Text style={styles.submittedCommentLabel}>Nhận xét của bạn:</Text>
                  <Text style={styles.submittedCommentText}>
                    {submittedRating.comment}
                  </Text>
                </View>
              )}

              {/* Thời gian đánh giá */}
              {submittedRating.createdAt && (
                <Text style={styles.submittedRatingDate}>
                  Đánh giá vào: {formatTime(submittedRating.createdAt)}
                </Text>
              )}

              <View style={styles.thankYouMessage}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.thankYouText}>
                  Cảm ơn bạn đã đánh giá!
                </Text>
              </View>
            </View>
          ) : (
            /* Form đánh giá */
            <>
              {/* Star Rating */}
              <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color="#FF6B35"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Feedback Input */}
              <TextInput
                style={styles.feedbackInput}
                placeholder="Chia sẻ suy nghĩ của bạn..."
                placeholderTextColor="#9CA3AF"
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                maxLength={500}
              />

              {/* Submit Rating Button */}
              {rating > 0 && (
                <TouchableOpacity
                  style={[
                    styles.submitRatingButton,
                    isSubmitting && styles.submitRatingButtonDisabled,
                  ]}
                  onPress={handleSubmitRating}
                  disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitRatingText}>Gửi đánh giá</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Order Details Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.orderDetailsButton}
          onPress={handleViewOrderDetails}>
          <Text style={styles.orderDetailsButtonText}>Chi tiết đơn hàng</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingVertical: 12,
    position: 'relative',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  restaurantLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  orderBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  orderBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalPaid: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  orderDelivered: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  itemsPreview: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  itemPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  driverSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  driverTextContainer: {
    flex: 1,
  },
  driverLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  feedbackInput: {
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#000000',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitRatingButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitRatingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  orderDetailsButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  orderDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submittedRatingContainer: {
    alignItems: 'center',
  },
  submittedCommentContainer: {
    width: '100%',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  submittedCommentLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  submittedCommentText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  submittedRatingDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
  },
  thankYouMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  thankYouText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 8,
  },
  submitRatingButtonDisabled: {
    opacity: 0.6,
  },
});

export default OrderDeliveredScreen;
