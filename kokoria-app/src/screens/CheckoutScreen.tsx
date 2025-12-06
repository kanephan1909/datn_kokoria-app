import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useCart} from '../store/useCartStore';
import {fetchAddresses, fetchVouchers, fetchVoucherByCode} from '../../api/apiClient';
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
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;
  const navigation = useNavigation();
  const {cartItems, totalPrice, updateItem} = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Kiểm tra voucher có khả dụng không
  const isVoucherAvailable = (voucher: Voucher): {available: boolean; reason?: string} => {
    const now = new Date();
    const expiryDate = new Date(voucher.expiry);

    if (expiryDate < now) {
      return {available: false, reason: 'Voucher đã hết hạn'};
    }

    if (voucher.minOrder && totalPrice < voucher.minOrder) {
      return {
        available: false,
        reason: `Đơn tối thiểu ${formatPrice(voucher.minOrder)}`,
      };
    }

    return {available: true};
  };

  // Lọc các voucher khả dụng
  const availableVouchers = vouchers.filter(v => isVoucherAvailable(v).available);
  const unavailableVouchers = vouchers.filter(v => !isVoucherAvailable(v).available);

  const selectedVoucher = vouchers.find(v => v.id === selectedVoucherId);
  const deliveryFee = 34000;

  // Validate và tính discount
  let discount = 0;
  if (selectedVoucher) {
    const validation = isVoucherAvailable(selectedVoucher);
    if (validation.available) {
      discount = Math.min(
        (totalPrice * selectedVoucher.discount) / 100,
        selectedVoucher.maxDeduct || Infinity,
      );
    } else {
      // Nếu voucher đã không khả dụng, bỏ chọn
      setSelectedVoucherId(null);
    }
  }

  const finalTotal = totalPrice + deliveryFee - discount;

  // Xử lý nhập mã voucher
  const handleApplyVoucherCode = async () => {
    if (!voucherCodeInput.trim()) {
      setVoucherError('Vui lòng nhập mã voucher');
      return;
    }

    setIsApplyingCode(true);
    setVoucherError(null);

    try {
      const response = await fetchVoucherByCode(voucherCodeInput.trim().toUpperCase());
      if (response.success && response.data) {
        const voucher = response.data;
        const validation = isVoucherAvailable(voucher);

        if (validation.available) {
          // Kiểm tra xem voucher đã có trong danh sách chưa
          const existingVoucher = vouchers.find(v => v.id === voucher.id);
          if (!existingVoucher) {
            setVouchers([...vouchers, voucher]);
          }
          setSelectedVoucherId(voucher.id);
          setVoucherCodeInput('');
          setShowVoucherModal(false);
          Alert.alert('Thành công', `Đã áp dụng voucher ${voucher.code}`);
        } else {
          setVoucherError(validation.reason || 'Voucher không khả dụng');
        }
      } else {
        setVoucherError('Mã voucher không tồn tại');
      }
    } catch (error: any) {
      console.error('Error applying voucher code:', error);
      setVoucherError(
        error?.response?.data?.message || 'Không thể áp dụng voucher. Vui lòng thử lại.',
      );
    } finally {
      setIsApplyingCode(false);
    }
  };

  const handleVoucherSelect = (voucherId: string | null) => {
    if (voucherId) {
      const voucher = vouchers.find(v => v.id === voucherId);
      if (voucher) {
        const validation = isVoucherAvailable(voucher);
        if (!validation.available) {
          Alert.alert('Lỗi', validation.reason || 'Voucher không khả dụng');
          return;
        }
      }
    }
    setSelectedVoucherId(voucherId);
    setShowVoucherModal(false);
  };

  const handleRemoveVoucher = () => {
    setSelectedVoucherId(null);
    setShowVoucherModal(false);
  };

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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      {/* Header */}
      <View style={[styles.header, {paddingTop: statusBarHeight + 16}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
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
              <Text style={styles.detailLabel}>Giao đến:</Text>
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
            onPress={() => setShowVoucherModal(true)}>
            <View style={styles.voucherIcon}>
              <Text style={styles.voucherIconText}>%</Text>
            </View>
            <View style={styles.detailContent}>
              {selectedVoucher ? (
                <>
                  <Text style={[styles.detailValue, styles.voucherApplied]}>
                    {selectedVoucher.code} - Giảm {selectedVoucher.discount}%
                  </Text>
                  <Text style={styles.voucherDiscountText}>
                    Tiết kiệm {formatPrice(discount)}
                  </Text>
                </>
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
            <Text style={styles.sectionTitle}>Thanh toán</Text>
            <Text style={styles.deliveryTime}>30-45 phút</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính:</Text>
              <Text style={styles.summaryValue}>{formatPrice(totalPrice)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí giao hàng:</Text>
              <Text style={styles.summaryValue}>{formatPrice(deliveryFee)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá:</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatPrice(discount)}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng cộng:</Text>
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
          <Text style={styles.continueButtonText}>Tiếp tục</Text>
        </TouchableOpacity>
      </View>

      {/* Voucher Selection Modal */}
      <Modal
        visible={showVoucherModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoucherModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn Voucher</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowVoucherModal(false);
                  setVoucherCodeInput('');
                  setVoucherError(null);
                }}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Nhập mã voucher */}
            <View style={styles.voucherInputContainer}>
              <TextInput
                style={styles.voucherInput}
                placeholder="Nhập mã voucher"
                value={voucherCodeInput}
                onChangeText={text => {
                  setVoucherCodeInput(text.toUpperCase());
                  setVoucherError(null);
                }}
                autoCapitalize="characters"
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  isApplyingCode && styles.applyButtonDisabled,
                ]}
                onPress={handleApplyVoucherCode}
                disabled={isApplyingCode}>
                <Text style={styles.applyButtonText}>
                  {isApplyingCode ? 'Đang áp dụng...' : 'Áp dụng'}
                </Text>
              </TouchableOpacity>
            </View>
            {voucherError && (
              <Text style={styles.errorText}>{voucherError}</Text>
            )}

            {/* Voucher đã chọn */}
            {selectedVoucher && (
              <View style={styles.selectedVoucherCard}>
                <View style={styles.selectedVoucherHeader}>
                  <View style={styles.selectedVoucherInfo}>
                    <Text style={styles.selectedVoucherCode}>
                      {selectedVoucher.code}
                    </Text>
                    <Text style={styles.selectedVoucherDiscount}>
                      Giảm {selectedVoucher.discount}%
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleRemoveVoucher}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.selectedVoucherDetail}>
                  Đang được áp dụng
                </Text>
              </View>
            )}

            <ScrollView
              style={styles.voucherList}
              showsVerticalScrollIndicator={false}>
              {/* Voucher khả dụng */}
              {availableVouchers.length > 0 && (
                <>
                  <Text style={styles.voucherSectionTitle}>
                    Voucher khả dụng ({availableVouchers.length})
                  </Text>
                  {availableVouchers.map(voucher => (
                    <TouchableOpacity
                      key={voucher.id}
                      style={[
                        styles.voucherCard,
                        selectedVoucherId === voucher.id &&
                          styles.voucherCardSelected,
                      ]}
                      onPress={() => handleVoucherSelect(voucher.id)}>
                      <View style={styles.voucherCardLeft}>
                        <View style={styles.voucherCardHeader}>
                          <Text style={styles.voucherCardCode}>
                            {voucher.code}
                          </Text>
                          <View style={styles.voucherBadge}>
                            <Text style={styles.voucherBadgeText}>
                              -{voucher.discount}%
                            </Text>
                          </View>
                        </View>
                        <View style={styles.voucherCardDetails}>
                          {voucher.minOrder && (
                            <Text style={styles.voucherDetailText}>
                              Đơn tối thiểu: {formatPrice(voucher.minOrder)}
                            </Text>
                          )}
                          {voucher.maxDeduct && (
                            <Text style={styles.voucherDetailText}>
                              Giảm tối đa: {formatPrice(voucher.maxDeduct)}
                            </Text>
                          )}
                          <Text style={styles.voucherDetailText}>
                            HSD: {formatDate(voucher.expiry)}
                          </Text>
                        </View>
                      </View>
                      {selectedVoucherId === voucher.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#10B981"
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Voucher không khả dụng */}
              {unavailableVouchers.length > 0 && (
                <>
                  <Text style={styles.voucherSectionTitle}>
                    Voucher không khả dụng ({unavailableVouchers.length})
                  </Text>
                  {unavailableVouchers.map(voucher => {
                    const validation = isVoucherAvailable(voucher);
                    return (
                      <View
                        key={voucher.id}
                        style={[styles.voucherCard, styles.voucherCardDisabled]}>
                        <View style={styles.voucherCardLeft}>
                          <View style={styles.voucherCardHeader}>
                            <Text
                              style={[
                                styles.voucherCardCode,
                                styles.voucherCardCodeDisabled,
                              ]}>
                              {voucher.code}
                            </Text>
                            <View
                              style={[
                                styles.voucherBadge,
                                styles.voucherBadgeDisabled,
                              ]}>
                              <Text style={styles.voucherBadgeText}>
                                -{voucher.discount}%
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.voucherDisabledReason}>
                            {validation.reason}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}

              {vouchers.length === 0 && (
                <View style={styles.emptyVoucherContainer}>
                  <Ionicons name="ticket-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyVoucherText}>
                    Không có voucher nào
                  </Text>
                  <Text style={styles.emptyVoucherSubtext}>
                    Nhập mã voucher ở trên để áp dụng
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
  voucherDiscountText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  voucherInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  voucherInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
  },
  applyButton: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    paddingHorizontal: 20,
    marginTop: -8,
    marginBottom: 8,
  },
  selectedVoucherCard: {
    backgroundColor: '#ECFDF5',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  selectedVoucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedVoucherInfo: {
    flex: 1,
  },
  selectedVoucherCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  selectedVoucherDiscount: {
    fontSize: 14,
    color: '#059669',
  },
  selectedVoucherDetail: {
    fontSize: 12,
    color: '#059669',
    marginTop: 8,
  },
  voucherList: {
    paddingHorizontal: 20,
  },
  voucherSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginTop: 8,
  },
  voucherCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  voucherCardSelected: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  voucherCardDisabled: {
    opacity: 0.5,
  },
  voucherCardLeft: {
    flex: 1,
  },
  voucherCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  voucherCardCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  voucherCardCodeDisabled: {
    color: '#9CA3AF',
  },
  voucherBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  voucherBadgeDisabled: {
    backgroundColor: '#9CA3AF',
  },
  voucherBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  voucherCardDetails: {
    gap: 4,
  },
  voucherDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  voucherDisabledReason: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyVoucherContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyVoucherText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyVoucherSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
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
    marginBottom: 10,
    borderRadius: 50,
    paddingVertical: 12,
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

