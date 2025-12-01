import {Pressable, StatusBar, Text, View, ScrollView} from 'react-native';
import React, {useMemo} from 'react';
import {useRoute} from '@react-navigation/native';
import {RouteProp} from '@react-navigation/native';
import {fetchCategories, fetchProducts, Product} from '../../api/apiClient';
import {useQuery} from '@tanstack/react-query';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useNavigation} from '@react-navigation/native';
import ProductCard from '../components/ProductCard';
import {MainRoutes} from '../navigation/Routes';

type Route = RouteProp<{params: {categoryId: string}}, 'params'>;

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

// Hàm phân loại sản phẩm theo loại sốt
const getSauceType = (productName: string): string => {
  const nameLower = productName.toLowerCase();

  // Kiểm tra sốt mù tạt mật ong (phải kiểm tra trước sốt mật ong)
  if (
    nameLower.includes('sốt mù tạt mật ong') ||
    nameLower.includes('sot mu tat mat ong') ||
    nameLower.includes('mù tạt mật ong') ||
    nameLower.includes('mu tat mat ong')
  ) {
    return 'Sốt mù tạt mật ong';
  }

  // Kiểm tra sốt KOKO (phải kiểm tra trước các loại khác có "koko")
  if (
    nameLower.includes('sốt koko') ||
    nameLower.includes('sot koko') ||
    nameLower.includes('koko chicken') ||
    nameLower.includes('koko')
  ) {
    return 'Sốt KOKO';
  }

  // Kiểm tra sốt mật ong
  if (
    nameLower.includes('sốt mật ong') ||
    nameLower.includes('sot mat ong') ||
    nameLower.includes('mật ong') ||
    nameLower.includes('mat ong')
  ) {
    return 'Sốt mật ong';
  }

  // Kiểm tra MIX 2 VỊ
  if (
    nameLower.includes('mix 2 vị') ||
    nameLower.includes('mix 2 vi') ||
    nameLower.includes('mix hai vị') ||
    nameLower.includes('mix hai vi') ||
    nameLower.includes('2 vị') ||
    nameLower.includes('2 vi')
  ) {
    return 'MIX 2 VỊ';
  }

  // Kiểm tra gà chiên giòn
  if (
    nameLower.includes('gà chiên giòn') ||
    nameLower.includes('ga chien gion') ||
    nameLower.includes('chiên giòn') ||
    nameLower.includes('chien gion')
  ) {
    return 'Gà chiên giòn';
  }

  // Kiểm tra sốt tỏi
  if (nameLower.includes('sốt tỏi') || nameLower.includes('sot toi')) {
    return 'Sốt tỏi';
  }

  // Kiểm tra sốt phô mai (bao gồm cả sốt phủ bột phô mai, sốt bột phô mai)
  if (
    nameLower.includes('sốt phô mai') ||
    nameLower.includes('sốt phủ bột phô mai') ||
    nameLower.includes('sốt bột phô mai') ||
    nameLower.includes('sot pho mai') ||
    nameLower.includes('phủ bột phô mai') ||
    nameLower.includes('bột phô mai')
  ) {
    return 'Sốt phô mai';
  }

  // Kiểm tra sốt cay
  if (nameLower.includes('sốt cay') || nameLower.includes('sot cay')) {
    return 'Sốt cay';
  }

  // Kiểm tra sốt kem hành
  if (nameLower.includes('sốt kem hành') || nameLower.includes('sot kem hanh')) {
    return 'Sốt kem hành';
  }

  // Mặc định không phân loại
  return 'Khác';
};

const CatetoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const categoryId = route.params.categoryId;

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

  const categories = categoriesData || [];
  const selectedCategory = categories.find(cat => cat.id === categoryId);

  const {data: productsData} = useQuery({
    queryKey: ['products', categoryId],
    queryFn: async () => {
      const response = await fetchProducts({
        categoryId: categoryId,
        limit: 50,
      });
      if (response.success && response.data) {
        const productsList = Array.isArray(response.data)
          ? response.data
          : response.data.products || response.data.data || [];
        return productsList as Product[];
      }
      throw new Error(response.message || 'Failed to fetch products');
    },
    enabled: !!categoryId,
  });

  // Kiểm tra xem category có nên phân loại theo sốt không
  const shouldGroupBySauce = useMemo(() => {
    if (!selectedCategory?.name) {
      return false;
    }
    const categoryName = selectedCategory.name.toLowerCase();
    // Chỉ áp dụng phân loại sốt cho các category liên quan đến gà/chicken
    return (
      categoryName.includes('gà') ||
      categoryName.includes('ga') ||
      categoryName.includes('chicken') ||
      categoryName.includes('gà rán') ||
      categoryName.includes('ga ran')
    );
  }, [selectedCategory]);

  // Nhóm sản phẩm theo loại sốt (chỉ khi cần)
  const groupedProducts = useMemo(() => {
    const productsList = productsData || [];

    // Nếu không cần phân loại, trả về một nhóm duy nhất
    if (!shouldGroupBySauce) {
      return {
        'Tất cả': productsList,
      };
    }

    const groups: {[key: string]: Product[]} = {};

    productsList.forEach(product => {
      const sauceType = getSauceType(product.name);
      if (!groups[sauceType]) {
        groups[sauceType] = [];
      }
      groups[sauceType].push(product);
    });

    // Sắp xếp các nhóm theo thứ tự ưu tiên
    const orderedGroups: {[key: string]: Product[]} = {};
    const order = [
      'Sốt mù tạt mật ong',
      'Sốt KOKO',
      'Sốt mật ong',
      'MIX 2 VỊ',
      'Gà chiên giòn',
      'Sốt tỏi',
      'Sốt phô mai',
      'Sốt cay',
      'Sốt kem hành',
      'Khác',
    ];

    order.forEach(key => {
      if (groups[key]) {
        orderedGroups[key] = groups[key];
      }
    });

    // Thêm các nhóm khác nếu có
    Object.keys(groups).forEach(key => {
      if (!order.includes(key)) {
        orderedGroups[key] = groups[key];
      }
    });

    return orderedGroups;
  }, [productsData, shouldGroupBySauce]);

  const products = productsData || [];

  const renderProductSection = (sauceType: string, sectionProducts: Product[]) => {
    // Nếu không phân loại (section "Tất cả"), không hiển thị header
    if (sauceType === 'Tất cả') {
      return (
        <View key={sauceType} className="flex-row flex-wrap justify-between">
          {sectionProducts.map(item => (
            <ProductCard
              key={item.id}
              product={item}
              onPress={() =>
                (navigation as any).navigate(MainRoutes.ProductDetails, {
                  productId: item.id,
                })
              }
            />
          ))}
        </View>
      );
    }

    // Bỏ qua section "Khác" nếu không có sản phẩm hoặc chỉ có 1-2 sản phẩm
    if (sauceType === 'Khác' && sectionProducts.length <= 2) {
      return null;
    }

    return (
      <View key={sauceType} className="mb-6">
        <View className="flex-row items-center mb-3">
          <View className="h-px flex-1 bg-gray-300" />
          <Text className="text-lg font-bold text-gray-800 mx-3">
            {sauceType}
          </Text>
          <View className="h-px flex-1 bg-gray-300" />
        </View>
        <View className="flex-row flex-wrap justify-between">
          {sectionProducts.map(item => (
            <ProductCard
              key={item.id}
              product={item}
              onPress={() =>
                (navigation as any).navigate(MainRoutes.ProductDetails, {
                  productId: item.id,
                })
              }
            />
          ))}
        </View>
      </View>
    );
  };

  if (products.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View className="px-4 pt-3 pb-2 bg-white">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Pressable className="p-1" onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
              </Pressable>
              <Pressable className="flex-row items-center gap-1">
                <Text>{selectedCategory?.name}</Text>
                <Ionicons name="chevron-down-outline" size={24} color="black" />
              </Pressable>
            </View>
          </View>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500 text-center">Không có sản phẩm</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View className="px-4 pt-3 pb-2 bg-white">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable className="p-1" onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </Pressable>

            <Pressable className="flex-row items-center gap-1">
              <Text className="text-lg font-semibold">
                {selectedCategory?.name}
              </Text>
              <Ionicons name="chevron-down-outline" size={24} color="black" />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40}}
        showsVerticalScrollIndicator={false}>
        {Object.entries(groupedProducts).map(([sauceType, sectionProducts]) =>
          renderProductSection(sauceType, sectionProducts),
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CatetoryScreen;
