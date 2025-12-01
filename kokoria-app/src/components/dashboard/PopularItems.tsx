import {View, Text, TouchableOpacity, FlatList} from 'react-native';
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useQuery} from '@tanstack/react-query';
import {fetchProducts, fetchCategories} from '../../../api/apiClient';
import {useCart} from '../../store/useCartStore';
import {useNavigation} from '@react-navigation/native';
import {MainRoutes} from '../../navigation/Routes';

interface PopularItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  badge?: string;
  icon: string;
}

const popularItems: PopularItem[] = [
  {
    id: '1',
    name: 'Mix 3 vị',
    price: 380000,
    description: 'Đùi rút xương - Boneless chicken',
    badge: 'BEST',
    icon: 'layers',
  },
  {
    id: '2',
    name: 'Chảo sườn phô mai',
    price: 320000,
    description: 'Sốt BBQ/Cay - One Size',
    badge: 'HOT',
    icon: 'flame',
  },
  {
    id: '3',
    name: 'Hot Plate',
    price: 209000,
    description: 'Vừa - Sốt Koko/Cay',
    icon: 'flame',
  },
  {
    id: '4',
    name: 'Gà rút xương - M',
    price: 129000,
    description: 'Sốt Koko (Ngọt, cay)',
    icon: 'restaurant',
  },
  {
    id: '5',
    name: 'Combo Mix 2 vị',
    price: 345000,
    description: '3-4 người',
    badge: 'HOT',
    icon: 'basket',
  },
  {
    id: '6',
    name: 'Tokbokki',
    price: 59000,
    description: 'Bánh gạo cay Hàn Quốc',
    icon: 'disc',
  },
];

const PopularItems = () => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const renderItem = ({item}: {item: PopularItem}) => {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        className="bg-white rounded-xl mb-3 overflow-hidden shadow-sm"
        style={{
          elevation: 2,
        }}>
        <View className="flex-row p-4">
          {/* Icon */}
          <View
            className="rounded-full items-center justify-center mr-3"
            style={{
              width: 60,
              height: 60,
              backgroundColor: '#F9731620',
            }}>
            <Ionicons name={item.icon as any} size={28} color="#F97316" />
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-base font-bold text-gray-800 flex-1" numberOfLines={1}>
                {item.name}
              </Text>
              {item.badge && (
                <View
                  className={`px-2 py-0.5 rounded-full ml-2 ${
                    item.badge === 'BEST'
                      ? 'bg-orange-500'
                      : item.badge === 'HOT'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}>
                  <Text className="text-white text-xs font-bold">{item.badge}</Text>
                </View>
              )}
            </View>
            {item.description && (
              <Text className="text-xs text-gray-500 mb-2" numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <Text className="text-orange-500 font-bold text-lg">
              {formatPrice(item.price)}
            </Text>
          </View>

          {/* Add button */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="bg-orange-500 rounded-full w-10 h-10 items-center justify-center ml-2">
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="pt-2">
      <FlatList
        data={popularItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

export default PopularItems;

