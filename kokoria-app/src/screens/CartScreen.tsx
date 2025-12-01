import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import React, {useEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCart} from '../store/useCartStore';
import Ionicons from '@react-native-vector-icons/ionicons';
import {MainRoutes} from '../navigation/Routes';
import {useNavigation} from '@react-navigation/native';

const CartScreen = () => {
  const {
    cartItems,
    isLoading,
    totalPrice,
    totalItems,
    updateItem,
    removeItem,
    loadCart,
  } = useCart();
  const navigation = useNavigation();

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleQuantityChange = async (itemId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    try {
      await updateItem(itemId, newQuantity);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật số lượng');
    }
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert('Xóa sản phẩm', 'Bạn có chắc chắn muốn xóa sản phẩm này?', [
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
            // Item removed successfully, cart will be reloaded automatically
          } catch (error: any) {
            console.error('Remove item error:', error);
            Alert.alert(
              'Lỗi',
              error?.message || 'Không thể xóa sản phẩm. Vui lòng thử lại.',
            );
          }
        },
      },
    ]);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm sản phẩm vào giỏ hàng');
      return;
    }
    (navigation as any).navigate(MainRoutes.Checkout);
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-orange-500 px-4 py-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1">Giỏ hàng</Text>
        {cartItems.length > 0 && (
          <View className="bg-red-500 rounded-full px-2 py-1">
            <Text className="text-white text-xs font-bold">{totalItems}</Text>
          </View>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
          <Text className="text-gray-500 text-lg font-semibold mt-4">
            Giỏ hàng trống
          </Text>
          <Text className="text-gray-400 text-sm text-center mt-2">
            Thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
          </Text>
          <TouchableOpacity
            onPress={() => {
              (navigation as any).navigate('MainTabs', {
                screen: MainRoutes.Home,
              });
            }}
            className="bg-orange-500 rounded-xl px-6 py-3 mt-6">
            <Text className="text-white font-semibold">Tiếp tục mua sắm</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{paddingBottom: 100}}
            showsVerticalScrollIndicator={false}>
            <View className="px-4 pt-4">
              {cartItems.map((item) => (
                <View
                  key={item.id}
                  className="bg-white rounded-xl p-4 mb-3 flex-row shadow-sm">
                  {/* Product Image/Icon */}
                  <View className="w-20 h-20 rounded-lg bg-orange-100 items-center justify-center mr-3">
                    {item.product.imageUrl ? (
                      <Image
                        source={{uri: item.product.imageUrl}}
                        className="w-full h-full rounded-lg"
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="restaurant" size={32} color="#F97316" />
                    )}
                  </View>

                  {/* Product Info */}
                  <View className="flex-1">
                    <Text className="text-gray-800 text-base font-semibold" numberOfLines={2}>
                      {item.product.name}
                    </Text>
                    {item.note && (
                      <Text className="text-orange-600 text-xs font-medium mt-1" numberOfLines={2}>
                        {item.note}
                      </Text>
                    )}
                    {item.product.description && (
                      <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
                        {item.product.description}
                      </Text>
                    )}
                    <Text className="text-orange-500 font-bold text-base mt-2">
                      {formatPrice(item.price)}
                    </Text>

                    {/* Quantity Controls */}
                    <View className="flex-row items-center mt-3">
                      <TouchableOpacity
                        onPress={() => handleQuantityChange(item.id, item.quantity, -1)}
                        className="bg-gray-100 rounded-full w-8 h-8 items-center justify-center">
                        <Ionicons name="remove" size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <Text className="text-gray-800 font-semibold mx-4 min-w-[30px] text-center">
                        {item.quantity}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleQuantityChange(item.id, item.quantity, 1)}
                        className="bg-orange-100 rounded-full w-8 h-8 items-center justify-center">
                        <Ionicons name="add" size={16} color="#F97316" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemoveItem(item.id)}
                        className="ml-auto">
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Bottom Summary */}
          <View className="bg-white border-t border-gray-200 px-4 py-4 absolute bottom-0 left-0 right-0">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-600 text-base">Tổng cộng:</Text>
              <Text className="text-orange-500 font-bold text-xl">
                {formatPrice(totalPrice)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleCheckout}
              className="bg-orange-500 rounded-xl py-4 items-center">
              <Text className="text-white font-bold text-lg">
                Thanh toán ({totalItems} sản phẩm)
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default CartScreen;

