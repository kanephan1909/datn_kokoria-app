import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useCart} from '../store/useCartStore';
import {fetchAddresses, fetchVouchers} from '../../api/apiClient';
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

interface Voucher {
  id: string;
  code: string;
  discount: number;
  minOrder?: number;
  maxDeduct?: number;
  expiry: string;
}

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const {cartItems, totalPrice, updateItem} = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);

  const handleVoucherSelect = (voucherId: string | null) => {
    setSelectedVoucherId(voucherId);
  };

  const loadAddresses = useCallback(async () => {
    try {
      const response = await fetchAddresses();
      if (response.success && response.data) {
        const addressesList = Array.isArray(response.data)
          ? response.data
          : response.data.addresses || response.data.data || [];
        setAddresses(addressesList);
        const defaultAddress = addressesList.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (addressesList.length > 0) {
          setSelectedAddressId(addressesList[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  }, []);

  const loadVouchers = useCallback(async () => {
    try {
      const response = await fetchVouchers();
      if (response.success && response.data) {
        const vouchersList = Array.isArray(response.data)
          ? response.data
          : response.data.vouchers || response.data.data || [];
        setVouchers(vouchersList);
      }
    } catch (error) {
      console.error('Error loading vouchers:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
      loadVouchers();
    }, [loadAddresses, loadVouchers]),
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const selectedVoucher = vouchers.find(v => v.id === selectedVoucherId);
  const deliveryFee = 34000;
  const discount = selectedVoucher
    ? Math.min(
        (totalPrice * selectedVoucher.discount) / 100,
        selectedVoucher.maxDeduct || Infinity,
      )
    : 0;
  const finalTotal = totalPrice + deliveryFee - discount;

  const handleQuantityChange = async (itemId: string, change: number) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) {
      return;
    }
    const newQuantity = item.quantity + change;
    if (newQuantity < 1) {
      return;
    }
    try {
      await updateItem(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleContinue = () => {
    if (!selectedAddressId) {
      Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ giao hàng');
      return;
    }
    // Navigate đến CheckoutScreen2 với selectedAddressId và selectedVoucherId
    (navigation as any).navigate(MainRoutes.Checkout2, {
      addressId: selectedAddressId,
      voucherId: selectedVoucherId,
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Order Items Card - Tất cả trong một card trắng */}
        <View style={styles.orderCard}>
          {cartItems.map((item, index) => (
            <View key={item.id}>
              <View style={styles.orderItem}>
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
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                  <View style={styles.quantitySelector}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item.id, -1)}>
                      <Ionicons name="remove" size={16} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => handleQuantityChange(item.id, 1)}>
                      <Ionicons name="add" size={16} color="#000" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              {index < cartItems.length - 1 && <View style={styles.divider} />}
            </View>
          ))}

          {/* Delivery Details trong cùng card */}
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => {
              (navigation as any).navigate(MainRoutes.AddressList);
            }}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="person-outline" size={20} color="#6B7280" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Deliver to:</Text>
              {selectedAddressId ? (
                <Text style={styles.detailValue}>
                  {addresses.find(a => a.id === selectedAddressId)?.name || 'Chọn địa chỉ'}
                </Text>
              ) : (
                <Text style={styles.detailValue}>Chọn địa chỉ</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => {
              // Hiển thị danh sách voucher để chọn
              if (vouchers.length > 0) {
                Alert.alert(
                  'Chọn Voucher',
                  vouchers.map(v => `${v.code} - ${v.discount}% OFF`).join('\n'),
                  [
                    {text: 'Hủy', style: 'cancel'},
                    ...vouchers.map(v => ({
                      text: `${v.code} - ${v.discount}%`,
                      onPress: () => handleVoucherSelect(v.id),
                    })),
                    {
                      text: 'Xóa voucher',
                      style: 'destructive',
                      onPress: () => handleVoucherSelect(null),
                    },
                  ],
                );
              } else {
                Alert.alert('Thông báo', 'Không có voucher khả dụng');
              }
            }}>
            <View style={styles.voucherIcon}>
              <Text style={styles.voucherIconText}>%</Text>
            </View>
            <View style={styles.detailContent}>
              {selectedVoucher ? (
                <Text style={[styles.detailValue, styles.voucherApplied]}>
                  {selectedVoucher.discount}% OFF Applied
                </Text>
              ) : (
                <Text style={styles.detailValue}>Chọn voucher</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Checkout Summary */}
        <View style={styles.section}>
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionTitle}>Checkout</Text>
            <Text style={styles.deliveryTime}>30-45 mins</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>{formatPrice(totalPrice)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee:</Text>
              <Text style={styles.summaryValue}>{formatPrice(deliveryFee)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount:</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatPrice(discount)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>{formatPrice(finalTotal)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={!selectedAddressId}>
          <Text style={styles.continueButtonText}>Continue</Text>
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
  editButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
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
  itemRight: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
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
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  voucherIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  voucherIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  voucherApplied: {
    color: '#10B981',
  },
  section: {
    marginTop: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  deliveryTime: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  discountValue: {
    color: '#10B981',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
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
  continueButton: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default CheckoutScreen;

