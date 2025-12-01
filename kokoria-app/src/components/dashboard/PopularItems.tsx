import {View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert} from 'react-native';
import React, {useMemo} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useQuery} from '@tanstack/react-query';
import {fetchProducts, fetchCategories} from '../../../api/apiClient';
import {useCart} from '../../store/useCartStore';
import {useNavigation} from '@react-navigation/native';
import {MainRoutes} from '../../navigation/Routes';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

interface PopularItemsProps {
  searchQuery?: string;
}

const PopularItems = ({searchQuery = ''}: PopularItemsProps) => {
  const {addItem} = useCart();
  const navigation = useNavigation();

  // Lấy danh sách categories để tìm category "Gà"
  const {data: categoriesData} = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetchCategories();
      if (response.success && response.data) {
        return response.data as Category[];
      }
      throw new Error(response.message || 'Failed to fetch categories');
    },
  });

  // Tìm category "Gà" hoặc "Gà rán"
  const chickenCategoryId = useMemo(() => {
    if (!categoriesData) {
      return null;
    }
    const chickenCategory = categoriesData.find(
      cat =>
        cat.name.toLowerCase().includes('gà') ||
        cat.name.toLowerCase().includes('ga') ||
        cat.name.toLowerCase().includes('chicken') ||
        cat.name.toLowerCase().includes('gà rán') ||
        cat.name.toLowerCase().includes('ga ran')
    );
    return chickenCategory?.id || null;
  }, [categoriesData]);

  const {
    data: productsData,
    isLoading,
  } = useQuery({
    queryKey: ['popularProducts', searchQuery, chickenCategoryId],
    queryFn: async () => {
      // Nếu có search query, search bình thường
      if (searchQuery) {
        const response = await fetchProducts({
          limit: 20,
          page: 1,
          search: searchQuery,
        });
        if (response.success && response.data) {
          const productsList = Array.isArray(response.data)
            ? response.data
            : response.data.products || response.data.data || [];
          return productsList as Product[];
        }
        throw new Error(response.message || 'Failed to fetch products');
      }

      // Nếu không có search query, lấy sản phẩm từ category "Gà"
      if (chickenCategoryId) {
        const response = await fetchProducts({
          categoryId: chickenCategoryId,
          limit: 6,
          page: 1,
        });
        if (response.success && response.data) {
          const productsList = Array.isArray(response.data)
            ? response.data
            : response.data.products || response.data.data || [];
          return productsList as Product[];
        }
        throw new Error(response.message || 'Failed to fetch products');
      }

      // Nếu không tìm thấy category gà, lấy tất cả và filter theo tên
      const response = await fetchProducts({
        limit: 50,
        page: 1,
      });
      if (response.success && response.data) {
        const productsList = Array.isArray(response.data)
          ? response.data
          : response.data.products || response.data.data || [];
        // Filter các sản phẩm có tên chứa "gà" hoặc "chicken"
        const filteredProducts = productsList.filter((product: Product) => {
          const nameLower = product.name.toLowerCase();
          return (
            nameLower.includes('gà') ||
            nameLower.includes('ga') ||
            nameLower.includes('chicken')
          );
        });
        return filteredProducts.slice(0, 6) as Product[];
      }
      throw new Error(response.message || 'Failed to fetch products');
    },
    enabled: searchQuery ? true : categoriesData !== undefined,
  });

  const products = productsData || [];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getProductIcon = (name: string): string => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('combo')) {
      return 'basket';
    }
    if (nameLower.includes('hot') || nameLower.includes('plate')) {
      return 'flame';
    }
    if (nameLower.includes('tokbokki')) {
      return 'disc';
    }
    if (nameLower.includes('gà') || nameLower.includes('chicken')) {
      return 'restaurant';
    }
    return 'layers';
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(product.id, 1);
      Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng');
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    }
  };

  const renderItem = ({item}: {item: Product}) => {
    const icon = getProductIcon(item.name);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          (navigation as any).navigate(MainRoutes.ProductDetails, {productId: item.id});
        }}
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
            <Ionicons name={icon as any} size={28} color="#F97316" />
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-base font-bold text-gray-800 flex-1" numberOfLines={1}>
                {item.name}
              </Text>
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
            className="bg-orange-500 rounded-full w-10 h-10 items-center justify-center ml-2"
            onPress={() => handleAddToCart(item)}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="pt-2">
        <View className="flex-row items-center justify-center py-8">
          <ActivityIndicator size="small" color="#F97316" />
        </View>
      </View>
    );
  }

  if (products.length === 0 && !isLoading) {
    return (
      <View className="pt-2">
        <Text className="text-center text-gray-500 py-4">
          {searchQuery ? 'Không tìm thấy sản phẩm nào' : 'Chưa có sản phẩm nào'}
        </Text>
      </View>
    );
  }

  return (
    <View className="pt-2">
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
      />
    </View>
  );
};

export default PopularItems;
