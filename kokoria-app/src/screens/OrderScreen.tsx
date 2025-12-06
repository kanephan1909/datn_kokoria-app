import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import React, {useState, useCallback} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useCart} from '../store/useCartStore';
import {fetchAddresses} from '../../api/apiClient';
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

// Map backend format to frontend format
const mapBackendToFrontend = (backendAddress: any): Address => {
  // Backend trả về: mobile, street, locality
  // Frontend cần: phone, address, ward, district, city
  const localityParts = backendAddress.locality
    ? backendAddress.locality.split(',').map((s: string) => s.trim())
    : [];
  return {
    id: backendAddress.id,
    name: backendAddress.name || '',
    phone: backendAddress.mobile || backendAddress.phone || '',
    address: backendAddress.street || backendAddress.address || '',
    ward: localityParts[0] || '',
    district: localityParts[1] || '',
    city: localityParts[2] || localityParts.slice(2).join(', ') || '',
    isDefault: backendAddress.isDefault || false,
  };
};

const OrderScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {cartItems, totalPrice, updateItem, removeItem} = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;

  // Kiểm tra xem có phải là tab screen không
  const isTabScreen = route.name === MainRoutes.Order;
  // Chỉ hiển thị back button nếu không phải tab screen và có thể quay lại
  const canGoBack = !isTabScreen && navigation.canGoBack();

  const loadAddresses = useCallback(async () => {
    try {
      setIsLoadingAddresses(true);
      const response = await fetchAddresses();
      if (response.success && response.data) {
        const addressesList = Array.isArray(response.data)
          ? response.data
          : response.data.addresses || response.data.data || [];
        // Map từ backend format sang frontend format
        const mappedAddresses = addressesList.map(mapBackendToFrontend);
        setAddresses(mappedAddresses);
        const defaultAddress = mappedAddresses.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        } else if (mappedAddresses.length > 0) {
          setSelectedAddressId(mappedAddresses[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

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

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // Nếu số lượng về 0 hoặc nhỏ hơn 1, xóa sản phẩm khỏi giỏ hàng
      handleRemoveItem(itemId);
      return;
    }
    await updateItem(itemId, newQuantity);
  };

  const handleRemoveItem = async (itemId: string) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItem(itemId);
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm');
            }
          },
        },
      ]
    );
  };

  const handlePlaceOrder = () => {
    if (cartItems.length === 0) {
      Alert.alert('Lỗi', 'Giỏ hàng trống');
      return;
    }
    // Navigate đến CheckoutScreen (chọn địa chỉ và voucher)
    (navigation as any).navigate(MainRoutes.Checkout);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (isLoadingAddresses) {
    return (
      <SafeAreaView edges={[]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView edges={[]} style={styles.container}>
        <View style={[styles.header, {paddingTop: statusBarHeight + 16}]}>
          {canGoBack && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          )}
          {!canGoBack && <View style={styles.placeholder} />}
          <Text style={styles.headerTitle}>Đơn hàng của bạn</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
          <Text style={styles.emptyText}>Giỏ hàng trống</Text>
          <Text style={styles.emptySubtext}>
            Vui lòng thêm sản phẩm vào giỏ hàng để đặt hàng
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {canGoBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        {!canGoBack && <View style={styles.placeholder} />}
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        <TouchableOpacity
          style={styles.searchButton}
          activeOpacity={0.7}
          onPress={() => {
            (navigation as any).navigate(MainRoutes.OrderHistory);
          }}>
          <Ionicons name="time-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Order Summary Card */}
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
                <TouchableOpacity
                  onPress={() => handleRemoveItem(item.id)}
                  style={styles.deleteButton}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                </View>
                {item.product.description && (
                  <Text style={styles.itemDescription} numberOfLines={1}>
                    {item.product.description}
                  </Text>
                )}
                {item.note && (
                  <Text style={styles.itemNote} numberOfLines={1}>
                    {item.note}
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
                  <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Total */}
          <View style={styles.summaryTotal}>
            <Text style={styles.totalItemsText}>Tổng {totalItems} sản phẩm</Text>
            <Text style={styles.totalPriceText}>{formatPrice(totalPrice)}</Text>
          </View>
        </View>

        {/* Address Selection */}
        {addresses.length > 0 && (
          <View style={styles.addressSection}>
            <Text style={styles.addressTitle}>Địa chỉ giao hàng</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {addresses.map((address) => {
                // Tạo địa chỉ đầy đủ từ các phần
                const fullAddressParts = [
                  address.address,
                  address.ward,
                  address.district,
                  address.city,
                ].filter(Boolean); // Loại bỏ các phần rỗng
                const fullAddress = fullAddressParts.length > 0
                  ? fullAddressParts.join(', ')
                  : address.address || 'Chưa có địa chỉ';

                return (
                  <TouchableOpacity
                    key={address.id}
                    onPress={() => setSelectedAddressId(address.id)}
                    style={[
                      styles.addressCard,
                      selectedAddressId === address.id && styles.addressCardSelected,
                    ]}>
                    <Text style={styles.addressName}>{address.name || 'Chưa có tên'}</Text>
                    {address.phone && (
                      <Text style={styles.addressText}>{address.phone}</Text>
                    )}
                    <Text style={styles.addressText} numberOfLines={3}>
                      {fullAddress}
                    </Text>
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Mặc định</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.changeAddressButton}
              onPress={() => {
                (navigation as any).navigate(MainRoutes.AddressList);
              }}>
              <Text style={styles.changeAddressText}>Thay đổi địa chỉ</Text>
            </TouchableOpacity>
          </View>
        )}

        {addresses.length === 0 && (
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => {
              (navigation as any).navigate(MainRoutes.AddAddress);
            }}>
            <Ionicons name="add-circle-outline" size={24} color="#EA580C" />
            <Text style={styles.addAddressText}>Thêm địa chỉ giao hàng</Text>
          </TouchableOpacity>
        )}

        {/* Place Order Button */}
        <View style={styles.placeOrderContainer}>
          <TouchableOpacity
            style={styles.placeOrderButton}
            onPress={handlePlaceOrder}>
            <Text style={styles.placeOrderText}>Thanh toán</Text>
          </TouchableOpacity>
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
  placeholder: {
    width: 40,
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  summaryCard: {
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
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 4,
    zIndex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  itemDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  itemNote: {
    fontSize: 11,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
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
  placeOrderContainer: {
    marginTop: 24,
    paddingHorizontal: 0,
  },
  placeOrderButton: {
    backgroundColor: '#EA580C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  placeOrderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addressSection: {
    marginTop: 24,
  },
  addressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  addressCard: {
    width: 280,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  addressCardSelected: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  addressName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EA580C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  changeAddressButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  changeAddressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EA580C',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 2,
    borderColor: '#EA580C',
    borderStyle: 'dashed',
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EA580C',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default OrderScreen;
