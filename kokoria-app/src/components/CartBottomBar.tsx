import {Text, View, TouchableOpacity, StyleSheet} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useCart} from '../store/useCartStore';
import {MainRoutes} from '../navigation/Routes';

const CartBottomBar = () => {
  const navigation = useNavigation();
  const {cartItems, totalPrice} = useCart();
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleCartPress = () => {
    (navigation as any).navigate(MainRoutes.Cart);
  };

  const handleCheckoutPress = () => {
    if (cartItems.length === 0) {
      return;
    }
    (navigation as any).navigate(MainRoutes.Checkout);
  };

  // Chỉ hiển thị khi có sản phẩm trong giỏ
  if (cartItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleCartPress}
        style={styles.cartButton}
        activeOpacity={0.7}>
        <Ionicons name="basket" size={24} color="#EF4444" />
        {totalItems > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {totalItems > 99 ? '99+' : totalItems}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleCartPress}
        style={styles.priceContainer}
        activeOpacity={0.7}>
        <Text style={styles.priceText}>{formatPrice(totalPrice)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleCheckoutPress}
        style={styles.checkoutButton}
        activeOpacity={0.8}>
        <Text style={styles.checkoutText}>Giao hàng</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  cartButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceContainer: {
    flex: 1,
    marginLeft: 12,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  checkoutButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CartBottomBar;

