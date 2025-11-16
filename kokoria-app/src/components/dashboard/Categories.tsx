import {View, Text, TouchableOpacity, FlatList} from 'react-native';
import React from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const categories: Category[] = [
  {id: '1', name: 'Gà rán', icon: 'restaurant', color: '#F97316'},
  {id: '2', name: 'Món ăn kèm', icon: 'layers', color: '#EF4444'},
  {id: '3', name: 'Đồ uống', icon: 'cafe', color: '#3B82F6'},
  {id: '4', name: 'Combo', icon: 'basket', color: '#10B981'},
  {id: '5', name: 'Hot Plate', icon: 'flame', color: '#F59E0B'},
  {id: '6', name: 'Lẩu', icon: 'nutrition', color: '#8B5CF6'},
  {id: '7', name: 'Tokbokki', icon: 'disc', color: '#EC4899'},
  {id: '8', name: 'Mì & Cơm', icon: 'fast-food', color: '#14B8A6'},
];

const Categories = () => {
  const renderCategory = ({item}: {item: Category}) => {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className="items-center mr-4 w-[70px]">
        <View
          className="rounded-full items-center justify-center mb-2 w-[60px] h-[60px]"
          style={{
            backgroundColor: `${item.color}20`,
          }}>
          <Ionicons name={item.icon as any} size={28} color={item.color} />
        </View>
        <Text className="text-xs text-gray-700 text-center" numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View className="pt-4 px-4">
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default Categories;

