import {Text, View, Image, Pressable} from 'react-native';
import React from 'react';
import {Product} from '../../api/apiClient';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

const ProductCard = ({product, onPress}: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl overflow-hidden shadow-sm mb-2"
      style={{width: '48%'}}>
      <View className="bg-gray-200 h-32 items-center justify-center">
        {product.imageUrl ? (
          <Image
            source={{uri: product.imageUrl}}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className="text-gray-400">No Image</Text>
        )}
      </View>
      <View className="p-3">
        <Text className="text-sm font-semibold text-gray-800 mb-1" numberOfLines={2}>
          {product.name}
        </Text>
        <Text className="text-orange-500 font-bold text-base">
          {formatPrice(product.price)}
        </Text>
      </View>
    </Pressable>
  );
};

export default ProductCard;
