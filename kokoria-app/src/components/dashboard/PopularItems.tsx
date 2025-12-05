import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import React, {useMemo, useState} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useQuery} from '@tanstack/react-query';
import {fetchProducts, fetchCategories} from '../../../api/apiClient';
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

// Product Card Component
const ProductCard = ({
  item,
  navigation,
  formatPrice,
}: {
  item: Product;
  navigation: any;
  formatPrice: (price: number) => string;
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  // Mock rating và delivery time (có thể lấy từ API sau)
  // Sử dụng hash của item.id để tạo stable rating và deliveryTime
  const itemHash = useMemo(
    () => item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0),
    [item.id],
  );
  const rating = useMemo(() => 4.5 + (itemHash % 50) / 100, [itemHash]); // 4.5-5.0
  const deliveryTime = useMemo(() => 20 + (itemHash % 15), [itemHash]); // 20-35 mins

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        navigation.navigate(MainRoutes.ProductDetails, {productId: item.id});
      }}
      className="bg-white rounded-2xl overflow-hidden mb-4"
      style={styles.cardContainer}>
      {/* Image Container */}
      <View className="w-full h-40 bg-gray-100 relative">
        {item.imageUrl ? (
          <Image
            source={{uri: item.imageUrl}}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center bg-gray-100">
            <Ionicons name="image-outline" size={48} color="#9CA3AF" />
          </View>
        )}

        {/* Favorite Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-2 right-2 bg-white rounded-full p-2"
          style={styles.favoriteButton}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? '#F97316' : '#6B7280'}
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="p-3">
        {/* Product Name */}
        <View className="flex-row items-start justify-between mb-2">
          <Text
            className="text-base font-bold text-gray-800 flex-1"
            numberOfLines={1}
            style={styles.productName}>
            {item.name}
          </Text>
        </View>

        {/* Rating & Delivery Time */}
        <View className="flex-row items-center mb-2">
          <Ionicons name="star" size={14} color="#F97316" />
          <Text className="text-sm text-gray-800 font-semibold ml-1">
            {rating.toFixed(1)}
          </Text>
          <View className="w-1 h-1 bg-gray-400 rounded-full mx-2" />
          <Text className="text-xs text-gray-500">{deliveryTime} mins</Text>
        </View>

        {/* Price */}
        <Text className="text-orange-500 font-bold text-base">
          {formatPrice(item.price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const PopularItems = ({searchQuery = ''}: PopularItemsProps) => {
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

  const renderItem = ({item}: {item: Product}) => {
    return (
      <ProductCard
        item={item}
        navigation={navigation}
        formatPrice={formatPrice}
      />
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
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '48%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  favoriteButton: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  productName: {
    flexShrink: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  contentContainer: {
    paddingBottom: 8,
  },
});

export default PopularItems;
