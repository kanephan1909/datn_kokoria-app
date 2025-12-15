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
import {SearchCriteria} from './SearchBar';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  categoryId?: string;
  rating?: number;
}

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

interface PopularItemsProps {
  searchQuery?: string;
  searchCriteria?: SearchCriteria;
}

// Hàm xóa dấu tiếng Việt để tìm kiếm không dấu
const removeVietnameseAccents = (str: string): string => {
  if (!str) {
    return '';
  }
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

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

const PopularItems = ({
  searchQuery = '',
  searchCriteria,
}: PopularItemsProps) => {
  const navigation = useNavigation();

  // Sử dụng searchCriteria nếu có, nếu không thì dùng searchQuery
  const effectiveSearchText =
    searchCriteria?.text || searchQuery || '';
  const effectiveCategoryId = searchCriteria?.categoryId;

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

  // Tìm category "Gà" hoặc "Gà rán" (chỉ dùng khi không có category được chọn trong filter)
  // Hỗ trợ tìm kiếm không dấu
  const chickenCategoryId = useMemo(() => {
    if (effectiveCategoryId) {
      return null; // Nếu có category từ filter, không dùng category gà mặc định
    }
    if (!categoriesData) {
      return null;
    }
    const chickenCategory = categoriesData.find(cat => {
      const catNameNormalized = removeVietnameseAccents(cat.name);
      return (
        catNameNormalized.includes(removeVietnameseAccents('gà')) ||
        catNameNormalized.includes(removeVietnameseAccents('ga')) ||
        catNameNormalized.includes('chicken') ||
        catNameNormalized.includes(removeVietnameseAccents('gà rán')) ||
        catNameNormalized.includes(removeVietnameseAccents('ga ran'))
      );
    });
    return chickenCategory?.id || null;
  }, [categoriesData, effectiveCategoryId]);

  const {
    data: productsData,
    isLoading,
  } = useQuery({
    queryKey: [
      'popularProducts',
      effectiveSearchText,
      effectiveCategoryId,
      chickenCategoryId,
      searchCriteria?.minPrice,
      searchCriteria?.maxPrice,
      searchCriteria?.minRating,
    ],
    queryFn: async () => {
      let response;

      // Nếu có search text, lấy tất cả để filter ở frontend (hỗ trợ tìm kiếm không dấu)
      // Nếu chỉ có category, có thể dùng API filter
      if (effectiveSearchText) {
        // Lấy tất cả sản phẩm để filter ở frontend (hỗ trợ tìm kiếm không dấu tốt hơn)
        response = await fetchProducts({
          limit: 200, // Lấy nhiều để filter ở frontend
          page: 1,
          categoryId: effectiveCategoryId || undefined,
        });
      } else if (effectiveCategoryId) {
        // Chỉ có category, dùng API filter
        response = await fetchProducts({
          limit: 100,
          page: 1,
          categoryId: effectiveCategoryId,
        });
      } else if (chickenCategoryId) {
        // Nếu không có filter, lấy sản phẩm từ category "Gà"
        response = await fetchProducts({
          categoryId: chickenCategoryId,
          limit: 100,
          page: 1,
        });
      } else {
        // Nếu không có gì, lấy tất cả
        response = await fetchProducts({
          limit: 100,
          page: 1,
        });
      }

      if (response.success && response.data) {
        let productsList = Array.isArray(response.data)
          ? response.data
          : response.data.products || response.data.data || [];

        // Filter theo category ở frontend nếu API không filter đúng
        // (vì có thể API search chỉ tìm theo tên, không filter theo categoryId)
        if (effectiveCategoryId && productsList.length > 0) {
          productsList = productsList.filter((product: Product) => {
            return product.categoryId === effectiveCategoryId;
          });
        }

        // Filter theo các tiêu chí (price range, rating) ở frontend
        // vì API có thể không hỗ trợ những filter này
        if (searchCriteria) {
          productsList = productsList.filter((product: Product) => {
            // Filter theo giá
            if (searchCriteria.minPrice !== undefined && product.price < searchCriteria.minPrice) {
              return false;
            }
            if (searchCriteria.maxPrice !== undefined && product.price > searchCriteria.maxPrice) {
              return false;
            }

            // Filter theo rating (tạo mock rating nếu không có)
            if (searchCriteria.minRating !== undefined) {
              const productHash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const productRating = 4.5 + (productHash % 50) / 100; // 4.5-5.0
              if (productRating < searchCriteria.minRating) {
                return false;
              }
            }

            return true;
          });
        }

        // Nếu có search text, filter theo tên ở frontend để đảm bảo kết quả chính xác
        // Hỗ trợ tìm kiếm không dấu (luôn filter theo text search ở frontend)
        if (effectiveSearchText) {
          const searchNormalized = removeVietnameseAccents(effectiveSearchText);
          productsList = productsList.filter((product: Product) => {
            const nameNormalized = removeVietnameseAccents(product.name);
            return nameNormalized.includes(searchNormalized);
          });
        }

        // Nếu không có search criteria, giới hạn số lượng sản phẩm
        if (!effectiveSearchText && !effectiveCategoryId && !chickenCategoryId) {
          // Filter các sản phẩm có tên chứa "gà" hoặc "chicken" như mặc định
          // Hỗ trợ tìm kiếm không dấu
          const filteredProducts = productsList.filter((product: Product) => {
            const nameNormalized = removeVietnameseAccents(product.name);
            return (
              nameNormalized.includes(removeVietnameseAccents('gà')) ||
              nameNormalized.includes(removeVietnameseAccents('ga')) ||
              nameNormalized.includes('chicken')
            );
          });
          return filteredProducts.slice(0, 6) as Product[];
        }

        return productsList as Product[];
      }
      throw new Error(response.message || 'Failed to fetch products');
    },
    enabled: true, // Luôn enabled để query chạy khi có thay đổi
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
          {effectiveSearchText || searchCriteria ? 'Không tìm thấy sản phẩm nào' : 'Chưa có sản phẩm nào'}
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
