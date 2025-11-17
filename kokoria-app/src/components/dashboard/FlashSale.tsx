import {View, Text, TouchableOpacity, FlatList} from 'react-native';
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

interface FlashSaleItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  image?: any;
  timeLeft: string;
}

const flashSaleItems: FlashSaleItem[] = [
  {
    id: '1',
    name: 'Mix 3 vị',
    price: 342000,
    originalPrice: 380000,
    discount: 10,
    timeLeft: '2h 30m',
  },
  {
    id: '2',
    name: 'Chảo sườn phô mai',
    price: 288000,
    originalPrice: 320000,
    discount: 10,
    timeLeft: '1h 15m',
  },
  {
    id: '3',
    name: 'Hot Plate (Vừa)',
    price: 188000,
    originalPrice: 209000,
    discount: 10,
    timeLeft: '3h 45m',
  },
  {
    id: '4',
    name: 'Combo Mix 2 vị (3-4 người)',
    price: 310000,
    originalPrice: 345000,
    discount: 10,
    timeLeft: '4h 20m',
  },
  {
    id: '5',
    name: 'Gà rút xương - M (Sốt Koko)',
    price: 116000,
    originalPrice: 129000,
    discount: 10,
    timeLeft: '5h 00m',
  },
];

const FlashSale = () => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const renderItem = ({item}: {item: FlashSaleItem}) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        className="bg-white rounded-xl mr-3 overflow-hidden shadow-md"
        style={{
          width: 160,
          elevation: 3,
        }}>
        {/* Image placeholder */}
        <View className="bg-gray-200 items-center justify-center h-[120px]">
          <Ionicons name="fast-food" size={50} color="#9CA3AF" />
        </View>

        {/* Discount badge */}
        <View className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded-md">
          <Text className="text-white text-xs font-bold">-{item.discount}%</Text>
        </View>

        {/* Content */}
        <View className="p-3">
          <Text
            className="text-sm font-semibold text-gray-800 mb-1"
            numberOfLines={2}
            ellipsizeMode="tail">
            {item.name}
          </Text>

          {/* Price */}
          <View className="flex-row items-center mb-2 flex-wrap">
            <Text className="text-orange-500 font-bold text-base" numberOfLines={1}>
              {formatPrice(item.price)}
            </Text>
            <Text className="text-gray-400 text-xs line-through ml-2" numberOfLines={1}>
              {formatPrice(item.originalPrice)}
            </Text>
          </View>

          {/* Time left */}
          <View className="flex-row items-center bg-red-50 px-2 py-1 rounded">
            <Ionicons name="time-outline" size={12} color="#EF4444" />
            <Text className="text-red-500 text-xs ml-1 font-medium" numberOfLines={1}>
              Còn {item.timeLeft}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="pt-4">
      <FlatList
        data={flashSaleItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingHorizontal: 16}}
        snapToInterval={176}
        decelerationRate="fast"
      />
    </View>
  );
};

export default FlashSale;

