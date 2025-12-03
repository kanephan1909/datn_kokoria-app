import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useCart} from '../store/useCartStore';
import {useAuth} from '../context/AuthContext';
import {fetchAddresses, createOrder} from '../../api/apiClient';
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

type PaymentMethod = 'CASH' | 'MOMO' | 'ZALOPAY' | 'VNPAY';

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

    Alert.alert(
      'Xác nhận đặt hàng',
      `Bạn có chắc chắn muốn đặt hàng với tổng tiền ${formatPrice(finalTotal)}?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đặt hàng',
          onPress: async () => {
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

              const orderData = {
                userId: user.id,
                items: cartItems.map(item => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.price,
                })),
                totalAmount: finalTotal,
                address: addressObject,
                paymentMethod: paymentMethod === 'CASH' ? 'COD' : paymentMethod,
              };

              const response = await createOrder(orderData);
              if (response.success) {
                Alert.alert('Thành công', 'Đơn hàng đã được tạo thành công', [
                  {
                    text: 'OK',
                    onPress: async () => {
                      await clear();
                      await loadCart();
                      (navigation as any).navigate(MainRoutes.OrderDetails, {
                        orderId: response.data.id,
                      });
                    },
                  },
                ]);
              } else {
                Alert.alert('Lỗi', response.message || 'Không thể tạo đơn hàng');
              }
            } catch (error: any) {
              console.error('Error creating order:', error);
              Alert.alert(
                'Lỗi',
                error.response?.data?.message || 'Không thể tạo đơn hàng',
              );
            } finally {
              setIsLoading(false);
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
        <Text style={styles.headerTitle}>Checkout</Text>
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
              <Text style={styles.editPinText}>Edit Pin</Text>
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
              <Text style={styles.deliveryLabel}>Home</Text>
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
              <Text style={styles.deliveryLabel}>Phone</Text>
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
              <Text style={styles.deliveryLabel}>Delivery Time</Text>
              <Text style={styles.deliveryValue}>30-45 mins</Text>
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
              onPress={() => setPaymentMethod('ZALOPAY')}>
              <View style={styles.paymentIconCircle}>
                <View style={styles.zalopayLogo}>
                  <Text style={styles.zalopayText}>Zalo</Text>
                </View>
              </View>
              <View style={styles.paymentContent}>
                <Text style={styles.paymentLabel}>ZaloPay</Text>
              </View>
              <View
                style={[
                  styles.radioButton,
                  paymentMethod === 'ZALOPAY' && styles.radioButtonSelected,
                ]}>
                {paymentMethod === 'ZALOPAY' && (
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
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(finalTotal)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, isLoading && styles.placeOrderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isLoading || !selectedAddress}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
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
    backgroundColor: '#F3F4F6',
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
  zalopayLogo: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: '#0068FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zalopayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vnpayLogo: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#E50112',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vnpayText: {
    color: '#FFFFFF',
    fontSize: 8,
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
    borderRadius: 12,
    paddingVertical: 16,
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


