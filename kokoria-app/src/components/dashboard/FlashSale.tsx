import {View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator} from 'react-native';
import React, {useState, useEffect, useMemo} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useQuery} from '@tanstack/react-query';
import {fetchProducts, Product} from '../../../api/apiClient';
import {useNavigation} from '@react-navigation/native';
import {MainRoutes} from '../../navigation/Routes';

interface FlashSaleItem extends Product {
  originalPrice?: number;
  discount?: number;
  salePrice?: number;
  timeLeft?: string;
}

const FlashSale = () => {
  const navigation = useNavigation();
  const [timeLeft, setTimeLeft] = useState<{[key: string]: string}>({});

  // Fetch products - có thể filter theo discount hoặc flash sale products
  const {data: productsData, isLoading} = useQuery({
    queryKey: ['flashSaleProducts'],
    queryFn: async () => {
      const response = await fetchProducts({
        limit: 10,
        page: 1,
      });
      if (response.success && response.data) {
        const productsList = Array.isArray(response.data)
          ? response.data
          : response.data.products || response.data.data || [];
        return productsList as Product[];
      }
      throw new Error(response.message || 'Failed to fetch flash sale products');
    },
  });

  // Tính toán flash sale items từ products
  const flashSaleItems: FlashSaleItem[] = useMemo(() => {
    if (!productsData) {
      return [];
    }

    // Lấy 5 sản phẩm đầu tiên và tính discount giả (10%)
    // Trong thực tế, backend nên có field discount hoặc salePrice
    return productsData.slice(0, 5).map(product => {
      const originalPrice = product.price;
      const discountPercent = 10; // Giảm 10%
      const salePrice = Math.round(originalPrice * (1 - discountPercent / 100));

      return {
        ...product,
        originalPrice,
        discount: discountPercent,
        salePrice,
      };
    });
  }, [productsData]);

  // Countdown timer - giả lập 6 giờ từ bây giờ
  useEffect(() => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 6); // Flash sale kéo dài 6 giờ

    const updateTimer = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        // Hết thời gian flash sale
        setTimeLeft(prev => {
          const updated: {[key: string]: string} = {};
          Object.keys(prev).forEach(key => {
            updated[key] = 'Đã kết thúc';
          });
          return updated;
        });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const timeString = `${hours}h ${minutes}m`;

      // Cập nhật time left cho tất cả sản phẩm hiện có
      setTimeLeft(prev => {
        const updated = {...prev};
        flashSaleItems.forEach(item => {
          updated[item.id] = timeString;
        });
        return updated;
      });
    };

    // Khởi tạo timeLeft cho tất cả items
    if (flashSaleItems.length > 0) {
      const initialTime: {[key: string]: string} = {};
      flashSaleItems.forEach(item => {
        initialTime[item.id] = '6h 0m';
      });
      setTimeLeft(initialTime);
    }

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Cập nhật mỗi phút

    return () => clearInterval(interval);
  }, [flashSaleItems]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const renderItem = ({item}: {item: FlashSaleItem}) => {
    const currentTimeLeft = timeLeft[item.id] || '6h 0m';
    const displayPrice = item.salePrice || item.price;
    const displayOriginalPrice = item.originalPrice || item.price;
    const discountPercent = item.discount || 10;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          (navigation as any).navigate(MainRoutes.ProductDetails, {
            productId: item.id,
          })
        }
        className="bg-white rounded-xl mr-3 overflow-hidden shadow-md"
        style={{
          width: 160,
          elevation: 3,
        }}>
        {/* Product Image */}
        <View className="bg-gray-200 h-[120px] relative">
          {item.imageUrl ? (
            <Image
              source={{uri: item.imageUrl}}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="items-center justify-center h-full">
              <Ionicons name="fast-food" size={50} color="#9CA3AF" />
            </View>
          )}

          {/* Discount badge */}
          <View className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded-md">
            <Text className="text-white text-xs font-bold">-{discountPercent}%</Text>
          </View>
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
              {formatPrice(displayPrice)}
            </Text>
            {displayOriginalPrice !== displayPrice && (
              <Text className="text-gray-400 text-xs line-through ml-2" numberOfLines={1}>
                {formatPrice(displayOriginalPrice)}
              </Text>
            )}
          </View>

          {/* Time left */}
          <View className="flex-row items-center bg-red-50 px-2 py-1 rounded">
            <Ionicons name="time-outline" size={12} color="#EF4444" />
            <Text className="text-red-500 text-xs ml-1 font-medium" numberOfLines={1}>
              Còn {currentTimeLeft}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="pt-4 px-4">
        <View className="flex-row items-center justify-center py-8">
          <ActivityIndicator size="small" color="#F97316" />
        </View>
      </View>
    );
  }

  if (flashSaleItems.length === 0) {
    return null;
  }

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

