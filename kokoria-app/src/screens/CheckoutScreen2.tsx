import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
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
import {GOOGLE_MAPS_API_KEY} from '../config/env';
import MapView, {Marker} from 'react-native-maps';

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
  latitude?: number;
  longitude?: number;
}

// Default location (Ho Chi Minh City)
const defaultLocation = {
  latitude: 10.762622,
  longitude: 106.660172,
};

// Map backend format to frontend format
const mapBackendToFrontend = (backendAddress: any): Address => {
  let localityParts: string[] = [];

  if (backendAddress.locality) {
    localityParts = backendAddress.locality
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  if (localityParts.length === 0) {
    if (backendAddress.ward) {
      localityParts.push(backendAddress.ward);
    }
    if (backendAddress.district) {
      localityParts.push(backendAddress.district);
    }
    if (backendAddress.city) {
      localityParts.push(backendAddress.city);
    }
  }

  return {
    id: backendAddress.id,
    name: backendAddress.name || '',
    phone: backendAddress.mobile || backendAddress.phone || '',
    address: backendAddress.street || backendAddress.address || '',
    ward: localityParts[0] || backendAddress.ward || '',
    district: localityParts[1] || backendAddress.district || '',
    city:
      localityParts[2] ||
      localityParts.slice(2).join(', ') ||
      backendAddress.city ||
      '',
    isDefault: backendAddress.isDefault || false,
    latitude: backendAddress.latitude,
    longitude: backendAddress.longitude,
  };
};

type PaymentMethod = 'CASH' | 'MOMO' | 'VNPAY';

const CheckoutScreen2 = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {addressId, selectedLocation} = (route.params as any) || {};
  const {cartItems, totalPrice, clear, loadCart} = useCart();
  const {user} = useAuth();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapLocation, setMapLocation] = useState<{
    latitude: number;
    longitude: number;
  }>(defaultLocation);
  const mapViewRef = useRef<any>(null);

  const isProcessingRef = useRef(false);
  const orderRequestIdRef = useRef<string | null>(null);

  // Reset processing state khi component unmount
  useEffect(() => {
    return () => {
      isProcessingRef.current = false;
      setIsLoading(false);
      setIsSubmitting(false);
      orderRequestIdRef.current = null;
    };
  }, []);

  // Geocode địa chỉ thành tọa độ
  const geocodeAddress = useCallback(async (address: Address) => {
    if (address.latitude && address.longitude) {
      setMapLocation({
        latitude: address.latitude,
        longitude: address.longitude,
      });
      return;
    }

    try {
      const addressString = [
        address.address,
        address.ward,
        address.district,
        address.city,
      ]
        .filter(Boolean)
        .join(', ');

      if (!addressString) {
        setMapLocation(defaultLocation);
        return;
      }

      // Sử dụng Google Geocoding API
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        addressString + ', Vietnam',
      )}&key=${GOOGLE_MAPS_API_KEY}&language=vi`;

      const response = await fetch(geocodeUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        setMapLocation({
          latitude: location.lat,
          longitude: location.lng,
        });
      } else {
        // Fallback về default location nếu geocode thất bại
        console.warn('Geocoding failed, using default location');
        setMapLocation(defaultLocation);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setMapLocation(defaultLocation);
    }
  }, []);

  // Reverse geocode: chuyển tọa độ thành địa chỉ
  const reverseGeocode = useCallback(
    async (latitude: number, longitude: number) => {
      try {
        const reverseGeocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&language=vi`;

        const response = await fetch(reverseGeocodeUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0];
          // Parse địa chỉ từ Google Maps response
          // Có thể cập nhật selectedAddress nếu cần
          console.log('Reverse geocoded address:', result.formatted_address);
          return result.formatted_address;
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
      }
      return null;
    },
    [],
  );

  const loadAddresses = useCallback(async () => {
    try {
      setIsLoadingAddresses(true);

      const response = await fetchAddresses();

      if (response.success && response.data) {
        const addressesList = Array.isArray(response.data)
          ? response.data
          : response.data.addresses || response.data.data || [];

        const mappedAddresses: Address[] = addressesList.map(
          mapBackendToFrontend,
        );

        let selectedAddr: Address | null = null;
        if (addressId) {
          selectedAddr = mappedAddresses.find(a => a.id === addressId) || null;
        } else {
          selectedAddr =
            mappedAddresses.find(a => a.isDefault) ||
            mappedAddresses[0] ||
            null;
        }

        setSelectedAddress(selectedAddr);
        if (selectedAddr) {
          await geocodeAddress(selectedAddr);
        } else {
          setMapLocation(defaultLocation);
        }
      } else {
        setSelectedAddress(null);
        setMapLocation(defaultLocation);
      }
    } catch {
      setSelectedAddress(null);
      setMapLocation(defaultLocation);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [addressId, geocodeAddress]);

  // Load addresses khi vào màn hình + reset nếu bị stuck
  useFocusEffect(
    useCallback(() => {
      loadAddresses();

      const resetTimeout = setTimeout(() => {
        if (isProcessingRef.current) {
          isProcessingRef.current = false;
          setIsLoading(false);
          setIsSubmitting(false);
          orderRequestIdRef.current = null;
        }
      }, 5000);

      return () => clearTimeout(resetTimeout);
    }, [loadAddresses]),
  );

  // Reload nếu route params addressId đổi
  useEffect(() => {
    if (addressId) {
      loadAddresses();
    }
  }, [addressId, loadAddresses]);

  // Xử lý khi quay lại từ EditLocationScreen với selectedLocation
  useEffect(() => {
    if (selectedLocation) {
      setMapLocation({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
      // Có thể cập nhật địa chỉ nếu cần
      console.log('Location updated from EditLocationScreen:', selectedLocation);
    }
  }, [selectedLocation]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);

  const deliveryFee = 34000;
  const finalTotal = totalPrice + deliveryFee;

  const handlePlaceOrder = async () => {
    if (isProcessingRef.current || isLoading || isSubmitting) {
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

    const requestId = `${Date.now()}-${Math.random()}`;
    orderRequestIdRef.current = requestId;
    isProcessingRef.current = true;
    setIsSubmitting(true);

    Alert.alert(
      'Xác nhận đặt hàng',
      `Bạn có chắc chắn muốn đặt hàng với tổng tiền ${formatPrice(
        finalTotal,
      )}?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
          onPress: () => {
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
            if (orderRequestIdRef.current !== requestId) {
              return;
            }

            setIsLoading(true);

            try {
              const addressObject = {
                name: selectedAddress.name,
                phone: selectedAddress.phone,
                address: selectedAddress.address,
                ward: selectedAddress.ward,
                district: selectedAddress.district,
                city: selectedAddress.city,
              };

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

              const response = await createOrder(orderData);

              if (response.success) {
                const orderId = response.data.id;

                // Thanh toán online: tạo payment link
                if (paymentMethod !== 'CASH' && backendPaymentMethod === 'ONLINE') {
                  try {
                    let paymentResponse;
                    // VNPay không chấp nhận custom URL scheme, cần dùng HTTP/HTTPS URL
                    // Backend sẽ xử lý và redirect về app
                    // Không truyền returnUrl cho VNPay, để backend dùng default
                    const returnUrl = `kokoriaapp://payment/return?orderId=${orderId}`;

                    switch (paymentMethod) {
                      case 'MOMO':
                        paymentResponse = await createMoMoPayment({
                          orderId,
                          amount: finalTotal,
                          orderInfo: `Thanh toan don hang ${orderId}`,
                          returnUrl,
                        });
                        break;
                      case 'VNPAY':
                        // Không truyền returnUrl cho VNPay - backend sẽ dùng HTTP URL
                        // và lưu orderId vào metadata để redirect về app sau
                        paymentResponse = await createVNPayPayment({
                          orderId,
                          amount: finalTotal,
                          orderInfo: `Thanh toan don hang ${orderId}`,
                          // Không truyền returnUrl - để backend dùng default HTTP URL
                        });
                        break;
                      default:
                        throw new Error('Phương thức thanh toán không hợp lệ');
                    }

                    const paymentUrl =
                      paymentResponse.data?.payUrl ||
                      paymentResponse.data?.deeplink ||
                      null;

                    if (paymentResponse.success && paymentUrl) {
                      if (orderRequestIdRef.current === requestId) {
                        isProcessingRef.current = false;
                        setIsLoading(false);
                        setIsSubmitting(false);
                        orderRequestIdRef.current = null;
                      }

                      setTimeout(() => {
                        (navigation as any).navigate(
                          MainRoutes.PaymentWebView,
                          {
                            paymentUrl,
                            orderId,
                            paymentMethod,
                            orderAmount: finalTotal, // Truyền order amount để có thể retry
                          },
                        );
                      }, 100);
                    } else {
                      if (orderRequestIdRef.current === requestId) {
                        isProcessingRef.current = false;
                        setIsLoading(false);
                        setIsSubmitting(false);
                        orderRequestIdRef.current = null;
                      }
                      Alert.alert(
                        'Lỗi',
                        paymentResponse.message ||
                          'Không thể tạo link thanh toán. Vui lòng thử lại.',
                      );
                    }
                  } catch (paymentError: any) {
                    if (orderRequestIdRef.current === requestId) {
                      isProcessingRef.current = false;
                      setIsLoading(false);
                      setIsSubmitting(false);
                      orderRequestIdRef.current = null;
                    }

                    if (paymentError.response?.status === 404) {
                      Alert.alert(
                        'Chức năng chưa sẵn sàng',
                        `Chức năng thanh toán ${paymentMethod} chưa được triển khai trên server.\n\nVui lòng chọn phương thức khác hoặc liên hệ admin.`,
                      );
                    } else if (
                      paymentError.code === 'ECONNABORTED' ||
                      paymentError.message?.includes('timeout')
                    ) {
                      Alert.alert(
                        'Lỗi kết nối',
                        'Kết nối đến server bị timeout. Vui lòng kiểm tra mạng và thử lại.',
                      );
                    } else if (!paymentError.response) {
                      Alert.alert(
                        'Lỗi kết nối',
                        'Không thể kết nối đến server. Vui lòng kiểm tra mạng và thử lại.',
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
                } else {
                  // Thanh toán tiền mặt
                  Alert.alert('Thành công', 'Đơn hàng đã được tạo thành công', [
                    {
                      text: 'OK',
                      onPress: async () => {
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
                if (orderRequestIdRef.current === requestId) {
                  isProcessingRef.current = false;
                  setIsLoading(false);
                  setIsSubmitting(false);
                  orderRequestIdRef.current = null;
                }
                Alert.alert('Lỗi', response.message || 'Không thể tạo đơn hàng');
              }
            } catch (error: any) {
              if (orderRequestIdRef.current === requestId) {
                isProcessingRef.current = false;
                setIsLoading(false);
                setIsSubmitting(false);
                orderRequestIdRef.current = null;
              }

              Alert.alert(
                'Lỗi',
                error.response?.data?.message ||
                  error.message ||
                  'Không thể tạo đơn hàng',
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
        {/* Map */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapViewRef}
            style={styles.map}
            initialRegion={{
              latitude: mapLocation.latitude,
              longitude: mapLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            region={{
              latitude: mapLocation.latitude,
              longitude: mapLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={(event: any) => {
              const {latitude, longitude} = event.nativeEvent.coordinate;
              setMapLocation({latitude, longitude});
              // Reverse geocode để lấy địa chỉ mới
              reverseGeocode(latitude, longitude);
            }}>
            <Marker
              coordinate={mapLocation}
              draggable
              onDragEnd={(event: any) => {
                const {latitude, longitude} = event.nativeEvent.coordinate;
                setMapLocation({latitude, longitude});
                // Reverse geocode để lấy địa chỉ mới khi kéo marker
                reverseGeocode(latitude, longitude);
              }}>
              <View style={styles.markerContainer}>
                <Ionicons name="location" size={32} color="#EF4444" />
              </View>
            </Marker>
          </MapView>
          <TouchableOpacity
            style={styles.editPinButton}
            onPress={() => {
              (navigation as any).navigate(MainRoutes.EditLocation, {
                initialLocation: mapLocation,
                address: selectedAddress
                  ? [
                      selectedAddress.address,
                      selectedAddress.ward,
                      selectedAddress.district,
                      selectedAddress.city,
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : '',
              });
            }}>
            <Text style={styles.editPinText}>Chỉnh sửa vị trí</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery info */}
        <View style={styles.deliveryCard}>
          <TouchableOpacity
            style={styles.deliveryItem}
            onPress={() => {
              (navigation as any).navigate(MainRoutes.AddressList, {
                returnTo: 'Checkout',
              });
            }}>
            <View style={styles.iconCircle}>
              <Ionicons name="home-outline" size={20} color="#000" />
            </View>
            <View style={styles.deliveryContent}>
              <Text style={styles.deliveryLabel}>Nhà</Text>
              {selectedAddress ? (
                <Text style={styles.deliveryValue} numberOfLines={2}>
                  {(() => {
                    const addressParts = [
                      selectedAddress.address,
                      selectedAddress.ward,
                      selectedAddress.district,
                      selectedAddress.city,
                    ].filter(Boolean);
                    const fullAddress =
                      addressParts.length > 0
                        ? addressParts.join(', ')
                        : selectedAddress.name || 'Chưa có địa chỉ';
                    return fullAddress;
                  })()}
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
                <Text style={styles.deliveryValue}>
                  {selectedAddress.phone || 'Chưa có số điện thoại'}
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
              <Ionicons name="time-outline" size={20} color="#000" />
            </View>
            <View style={styles.deliveryContent}>
              <Text style={styles.deliveryLabel}>Thời gian giao hàng</Text>
              <Text style={styles.deliveryValue}>30-45 phút</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Payment method */}
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
                  <Image
                    source={require('../assets/images/logomomo.png')}
                    style={styles.momoLogo}
                  />
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
                  <Image
                    source={require('../assets/images/logovnpay.jpg')}
                    style={styles.vnpayLogo}
                  />
                </View>
              </View>
              <View style={styles.paymentContent}>
                <Text style={styles.paymentLabel}>VNPay (Bảo trì)</Text>
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

      {/* Total & place order */}
      <View style={styles.bottomContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{formatPrice(finalTotal)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (isLoading || isSubmitting || !selectedAddress) &&
              styles.placeOrderButtonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={
            isProcessingRef.current || isLoading || isSubmitting || !selectedAddress
          }>
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
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    position: 'relative',
    overflow: 'hidden',
  },
  mapLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  vnpayLogo: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: 'grey',
    alignItems: 'center',
    justifyContent: 'center',
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
