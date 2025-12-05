import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useCart} from '../store/useCartStore';
import {useAuth} from '../context/AuthContext';
import {
  fetchAddresses,
  createOrder,
  createMoMoPayment,
  createVNPayPayment,
} from '../../api/apiClient';
import {MainRoutes} from '../navigation/Routes';

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

type PaymentMethod = 'CASH' | 'MOMO' | 'VNPAY';

const CheckoutScreen2 = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {addressId} = (route.params as any) || {};
  const {cartItems, totalPrice, clear, loadCart} = useCart();
  const {user} = useAuth();
  const [, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const isProcessingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const orderRequestIdRef = useRef<string | null>(null); // Unique ID cho mỗi request đặt hàng

  // Reset processing state khi component unmount
  useEffect(() => {
    return () => {
      isProcessingRef.current = false;
      setIsLoading(false);
      setIsSubmitting(false);
      orderRequestIdRef.current = null;
    };
  }, []);

  // Reset processing state khi quay lại màn hình (nếu bị stuck)
  useFocusEffect(
    useCallback(() => {
      // Nếu đã quá 30 giây mà vẫn đang processing, reset lại
      const timeoutId = setTimeout(() => {
        if (isProcessingRef.current) {
          console.warn('⚠️ Processing state đã quá lâu, tự động reset');
          isProcessingRef.current = false;
          setIsLoading(false);
          setIsSubmitting(false);
          orderRequestIdRef.current = null;
        }
      }, 30000); // 30 giây

      return () => clearTimeout(timeoutId);
    }, []),
  );

  const loadAddresses = useCallback(async () => {
    try {
      setIsLoadingAddresses(true);
      const response = await fetchAddresses();
      if (response.success && response.data) {
        const addressesList = Array.isArray(response.data)
          ? response.data
          : response.data.addresses || response.data.data || [];
        setAddresses(addressesList);
        if (addressId) {
          const addr = addressesList.find((a: Address) => a.id === addressId);
          if (addr) {
            setSelectedAddress(addr);
          }
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [addressId]);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();

      // Reset processing state nếu bị stuck từ lần trước (sau 5 giây)
      const resetTimeout = setTimeout(() => {
        if (isProcessingRef.current) {
          console.warn('⚠️ Phát hiện stuck state khi vào màn hình, reset lại...');
          isProcessingRef.current = false;
          setIsLoading(false);
          setIsSubmitting(false);
          orderRequestIdRef.current = null;
        }
      }, 5000); // 5 giây sau khi vào màn hình

      return () => clearTimeout(resetTimeout);
    }, [loadAddresses]),
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const deliveryFee = 34000;
  const finalTotal = totalPrice + deliveryFee;

  const handlePlaceOrder = async () => {
    // Prevent multiple submissions - kiểm tra ngay từ đầu
    if (isProcessingRef.current || isLoading || isSubmitting) {
      console.warn('⚠️ Đã có request đang xử lý, bỏ qua', {
        isProcessingRef: isProcessingRef.current,
        isLoading,
        isSubmitting,
      });
      return;
    }

    if (!selectedAddress) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Lỗi', 'Giỏ hàng trống');
      return;
    }

    if (!user || !user.id) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập để đặt hàng');
      return;
    }

    // Tạo unique ID cho request này
    const requestId = `${Date.now()}-${Math.random()}`;
    orderRequestIdRef.current = requestId;
    isProcessingRef.current = true;
    setIsSubmitting(true);

    Alert.alert(
      'Xác nhận đặt hàng',
      `Bạn có chắc chắn muốn đặt hàng với tổng tiền ${formatPrice(finalTotal)}?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
          onPress: () => {
            // Chỉ reset nếu đây vẫn là request hiện tại
            if (orderRequestIdRef.current === requestId) {
              isProcessingRef.current = false;
              setIsSubmitting(false);
              orderRequestIdRef.current = null;
            }
          },
        },
        {
          text: 'Đặt hàng',
          onPress: async () => {
            // Kiểm tra xem request này có còn hợp lệ không
            if (orderRequestIdRef.current !== requestId) {
              console.warn('⚠️ Request đã bị hủy hoặc có request mới hơn, bỏ qua');
              return;
            }

            // Kiểm tra lại một lần nữa để đảm bảo không có request nào khác đang xử lý
            if (orderRequestIdRef.current !== requestId) {
              console.warn('⚠️ Request đã bị hủy hoặc có request mới hơn, bỏ qua');
              return;
            }

            console.log('=== BẮT ĐẦU ĐẶT HÀNG ===', {requestId});
            setIsLoading(true);
            console.log('✅ Đã set loading state');

            try {
              console.log('📦 Bắt đầu tạo order data...');
              const addressObject = {
                name: selectedAddress.name,
                phone: selectedAddress.phone,
                address: selectedAddress.address,
                ward: selectedAddress.ward,
                district: selectedAddress.district,
                city: selectedAddress.city,
              };

              // Map payment method để gửi đúng format cho backend
              const backendPaymentMethod =
                paymentMethod === 'CASH' ? 'COD' : 'ONLINE';

              const orderData = {
                userId: user.id,
                items: cartItems.map(item => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.price,
                })),
                totalAmount: finalTotal,
                address: addressObject,
                paymentMethod: backendPaymentMethod,
              };

              console.log('📤 Gửi request createOrder...', {
                userId: user.id,
                itemsCount: orderData.items.length,
                totalAmount: orderData.totalAmount,
                paymentMethod: orderData.paymentMethod,
              });

              const response = await createOrder(orderData);
              console.log('📥 Nhận response từ createOrder:', {
                success: response.success,
                hasOrderId: !!response.data?.id,
              });
              if (response.success) {
                const orderId = response.data.id;
                console.log('✅ Order created successfully! OrderId:', orderId);

                // Nếu là thanh toán online, tạo payment link
                if (paymentMethod !== 'CASH' && backendPaymentMethod === 'ONLINE') {
                  console.log('💳 Bắt đầu tạo payment link...', {
                    paymentMethod,
                    orderId,
                  });
                  try {
                    console.log('Creating payment for method:', paymentMethod);
                    let paymentResponse;
                    const returnUrl = `kokoriaapp://payment/return?orderId=${orderId}`;

                    switch (paymentMethod) {
                      case 'MOMO':
                        console.log('📞 Calling createMoMoPayment API...', {
                          orderId,
                          amount: finalTotal,
                          returnUrl,
                        });
                        console.log('⏳ Đang đợi response từ backend...');
                        paymentResponse = await createMoMoPayment({
                          orderId,
                          amount: finalTotal,
                          orderInfo: `Thanh toan don hang ${orderId}`,
                          returnUrl,
                        });
                        console.log('✅ Received MoMo payment response:', JSON.stringify(paymentResponse, null, 2));
                        console.log('Has payUrl:', !!paymentResponse.data?.payUrl);
                        console.log('Has deeplink:', !!paymentResponse.data?.deeplink);
                        break;
                      case 'VNPAY':
                        paymentResponse = await createVNPayPayment({
                          orderId,
                          amount: finalTotal,
                          orderInfo: `Thanh toan don hang ${orderId}`,
                          returnUrl,
                        });
                        break;
                      default:
                        throw new Error('Phương thức thanh toán không hợp lệ');
                    }

                    // MoMo có thể trả về payUrl hoặc deeplink
                    const paymentUrl =
                      paymentResponse.data?.payUrl ||
                      paymentResponse.data?.deeplink ||
                      null;

                    if (paymentResponse.success && paymentUrl) {
                      console.log('Navigating to PaymentWebView with URL:', paymentUrl);
                      // Kiểm tra request vẫn hợp lệ trước khi reset
                      if (orderRequestIdRef.current === requestId) {
                        isProcessingRef.current = false;
                        setIsLoading(false);
                        setIsSubmitting(false);
                        orderRequestIdRef.current = null;
                      }

                      // Navigate đến PaymentWebView
                      setTimeout(() => {
                        (navigation as any).navigate(MainRoutes.PaymentWebView, {
                          paymentUrl,
                          orderId,
                          paymentMethod,
                        });
                      }, 100);
                    } else {
                      // Kiểm tra request vẫn hợp lệ trước khi reset
                      if (orderRequestIdRef.current === requestId) {
                        isProcessingRef.current = false;
                        setIsLoading(false);
                        setIsSubmitting(false);
                        orderRequestIdRef.current = null;
                      }
                      console.error('Payment response error:', paymentResponse);
                      Alert.alert(
                        'Lỗi',
                        paymentResponse.message ||
                          'Không thể tạo link thanh toán. Vui lòng thử lại.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              // Quay lại màn hình checkout
                            },
                          },
                        ],
                      );
                    }
                  } catch (paymentError: any) {
                    console.error('Error creating payment:', paymentError);

                    // Xử lý lỗi 404 - endpoint chưa tồn tại
                    if (paymentError.response?.status === 404) {
                      Alert.alert(
                        'Chức năng chưa sẵn sàng',
                        `Chức năng thanh toán ${paymentMethod} chưa được triển khai trên server.\n\nVui lòng:\n• Liên hệ admin để kích hoạt\n• Hoặc chọn phương thức thanh toán khác`,
                        [
                          {
                            text: 'Quay lại',
                            onPress: () => {
                              // Kiểm tra request vẫn hợp lệ trước khi reset
                              if (orderRequestIdRef.current === requestId) {
                                isProcessingRef.current = false;
                                setIsLoading(false);
                                setIsSubmitting(false);
                                orderRequestIdRef.current = null;
                              }
                              navigation.goBack();
                            },
                          },
                          {
                            text: 'Thanh toán tiền mặt',
                            onPress: async () => {
                              // Kiểm tra request vẫn hợp lệ trước khi reset
                              if (orderRequestIdRef.current === requestId) {
                                isProcessingRef.current = false;
                                setIsLoading(false);
                                setIsSubmitting(false);
                                orderRequestIdRef.current = null;
                              }
                              Alert.alert(
                                'Thông báo',
                                'Đơn hàng đã được tạo với phương thức thanh toán online. Vui lòng quay lại và chọn thanh toán tiền mặt ngay từ đầu.',
                                [
                                  {
                                    text: 'OK',
                                    onPress: () => navigation.goBack(),
                                  },
                                ]
                              );
                            },
                          },
                        ]
                      );
                    } else {
                      // Kiểm tra request vẫn hợp lệ trước khi reset
                      if (orderRequestIdRef.current === requestId) {
                        isProcessingRef.current = false;
                        setIsLoading(false);
                        setIsSubmitting(false);
                        orderRequestIdRef.current = null;
                      }

                      // Kiểm tra nếu là timeout hoặc network error
                      if (paymentError.code === 'ECONNABORTED' || paymentError.message?.includes('timeout')) {
                        Alert.alert(
                          'Lỗi kết nối',
                          'Kết nối đến server bị timeout. Vui lòng kiểm tra kết nối mạng và thử lại.',
                        );
                      } else if (!paymentError.response) {
                        Alert.alert(
                          'Lỗi kết nối',
                          'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.',
                        );
                      } else {
                        Alert.alert(
                          'Lỗi',
                          paymentError.response?.data?.message ||
                            paymentError.message ||
                            'Không thể tạo link thanh toán. Vui lòng thử lại.',
                        );
                      }
                    }
                  }
                } else {
                  // Thanh toán tiền mặt - chuyển đến OrderDetails
                  Alert.alert('Thành công', 'Đơn hàng đã được tạo thành công', [
                    {
                      text: 'OK',
                      onPress: async () => {
                        // Kiểm tra request vẫn hợp lệ trước khi reset
                        if (orderRequestIdRef.current === requestId) {
                          isProcessingRef.current = false;
                          setIsLoading(false);
                          setIsSubmitting(false);
                          orderRequestIdRef.current = null;
                        }
                        await clear();
                        await loadCart();
                        (navigation as any).navigate(MainRoutes.OrderDetails, {
                          orderId,
                        });
                      },
                    },
                  ]);
                }
              } else {
                // Kiểm tra request vẫn hợp lệ trước khi reset
                if (orderRequestIdRef.current === requestId) {
                  isProcessingRef.current = false;
                  setIsLoading(false);
                  setIsSubmitting(false);
                  orderRequestIdRef.current = null;
                }
                Alert.alert('Lỗi', response.message || 'Không thể tạo đơn hàng');
              }
            } catch (error: any) {
              console.error('❌ ERROR creating order:', error);
              console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                code: error.code,
              });
              // Kiểm tra request vẫn hợp lệ trước khi reset
              if (orderRequestIdRef.current === requestId) {
                isProcessingRef.current = false;
                setIsLoading(false);
                setIsSubmitting(false);
                orderRequestIdRef.current = null;
              }

              Alert.alert(
                'Lỗi',
                error.response?.data?.message || error.message || 'Không thể tạo đơn hàng',
              );
            }
          },
        },
      ],
    );
  };

  if (isLoadingAddresses) {
    return (
      <SafeAreaView edges={['top']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={20} color="#000000" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Delivery Map Placeholder */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            {/* Map background with buildings */}
            <View style={styles.mapBackground}>
              <View style={styles.mapBuilding} />
              <View style={[styles.mapBuilding, styles.mapBuildingRight]} />
              <View style={[styles.mapBuilding, styles.mapBuildingLeft]} />
            </View>
            {/* Red pin in center */}
            <View style={styles.redPinWrapper}>
              <Ionicons name="location" size={32} color="#EF4444" />
            </View>
            <TouchableOpacity style={styles.editPinButton}>
              <Text style={styles.editPinText}>Chỉnh sửa vị trí</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Information Card */}
        <View style={styles.deliveryCard}>
          <TouchableOpacity
            style={styles.deliveryItem}
            onPress={() => {
              (navigation as any).navigate(MainRoutes.AddressList);
            }}>
            <View style={styles.iconCircle}>
              <Ionicons name="home-outline" size={20} color="#000" />
            </View>
            <View style={styles.deliveryContent}>
              <Text style={styles.deliveryLabel}>Nhà</Text>
              {selectedAddress ? (
                <Text style={styles.deliveryValue}>
                  {selectedAddress.address}
                </Text>
              ) : (
                <Text style={styles.deliveryValue}>Chọn địa chỉ</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.deliveryDivider} />

          <TouchableOpacity style={styles.deliveryItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="call-outline" size={20} color="#000" />
            </View>
            <View style={styles.deliveryContent}>
              <Text style={styles.deliveryLabel}>Điện thoại</Text>
              {selectedAddress ? (
                <Text style={styles.deliveryValue}>{selectedAddress.phone}</Text>
              ) : (
                <Text style={styles.deliveryValue}>Chọn địa chỉ</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.deliveryDivider} />

          <TouchableOpacity style={styles.deliveryItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={20} color="#000" />
            </View>
            <View style={styles.deliveryContent}>
              <Text style={styles.deliveryLabel}>Thời gian giao hàng</Text>
              <Text style={styles.deliveryValue}>30-45 phút</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <View style={styles.paymentCard}>
            <TouchableOpacity
              style={styles.paymentItem}
              onPress={() => setPaymentMethod('CASH')}>
              <View style={styles.paymentIconCircle}>
                <Ionicons name="cash-outline" size={20} color="#000" />
              </View>
              <View style={styles.paymentContent}>
                <Text style={styles.paymentLabel}>Tiền mặt</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  paymentMethod === 'CASH' && styles.radioButtonSelected,
                ]}>
                {paymentMethod === 'CASH' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.paymentDivider} />

            <TouchableOpacity
              style={styles.paymentItem}
              onPress={() => setPaymentMethod('MOMO')}>
              <View style={styles.paymentIconCircle}>
                <View style={styles.momoLogo}>
                  <Text style={styles.momoText}>MoMo</Text>
                </View>
              </View>
              <View style={styles.paymentContent}>
                <Text style={styles.paymentLabel}>MoMo</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  paymentMethod === 'MOMO' && styles.radioButtonSelected,
                ]}>
                {paymentMethod === 'MOMO' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.paymentDivider} />

            <TouchableOpacity
              style={styles.paymentItem}
              onPress={() => setPaymentMethod('VNPAY')}>
              <View style={styles.paymentIconCircle}>
                <View style={styles.vnpayLogo}>
                  <Text style={styles.vnpayText}>VNPay</Text>
                </View>
              </View>
              <View style={styles.paymentContent}>
                <Text style={styles.paymentLabel}>VNPay</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  paymentMethod === 'VNPAY' && styles.radioButtonSelected,
                ]}>
                {paymentMethod === 'VNPAY' && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>

      {/* Total and Place Order Button */}
      <View style={styles.bottomContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{formatPrice(finalTotal)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, (isLoading || isSubmitting || !selectedAddress) && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isProcessingRef.current || isLoading || isSubmitting || !selectedAddress}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.placeOrderText}>Đặt hàng</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  mapContainer: {
    marginTop: 24,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    position: 'relative',
    overflow: 'hidden',
  },
  mapBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  mapBuilding: {
    width: 35,
    height: 55,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    marginHorizontal: 6,
  },
  mapBuildingRight: {
    height: 70,
  },
  mapBuildingLeft: {
    height: 45,
  },
  redPinWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPinButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  editPinText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  deliveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deliveryContent: {
    flex: 1,
  },
  deliveryLabel: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  deliveryValue: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  deliveryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  paymentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentContent: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  momoLogo: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: '#A50064',
    alignItems: 'center',
    justifyContent: 'center',
  },
  momoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vnpayLogo: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#E50112',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vnpayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: '#EF4444',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  placeOrderButton: {
    backgroundColor: '#EA580C',
    marginBottom: 10,
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default CheckoutScreen2;


