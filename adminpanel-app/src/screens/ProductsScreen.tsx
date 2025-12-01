import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, fetchCategories, deleteProduct } from '../api/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'react-native';

const ProductsScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories để filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // Fetch products
  const {
    data: productsData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => fetchProducts({ categoryId: selectedCategory || undefined }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Thành công', 'Sản phẩm đã được xóa');
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể xóa sản phẩm');
    },
  });

  const categories = categoriesData?.data || [];
  const products = productsData?.data || [];

  // Filter products by search query
  const filteredProducts = products.filter((product: any) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header với gradient effect */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-200 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Danh sách sản phẩm</Text>
            <Text className="text-sm text-gray-500 mt-1">
              {filteredProducts.length} sản phẩm
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center gap-2 mb-4">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-xl py-2.5"
            onPress={() => (navigation as any).navigate('Vouchers')}
            style={{
              backgroundColor: '#10B981',
              shadowColor: '#10B981',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Ionicons name="ticket" size={18} color="white" />
            <Text 
              className="text-white font-semibold ml-1.5 text-sm"
              numberOfLines={1}
            >
              Vouchers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-blue-500 rounded-xl py-2.5"
            onPress={() => (navigation as any).navigate('AddProduct')}
            style={{
              backgroundColor: '#3B82F6',
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text 
              className="text-white font-semibold ml-1.5 text-sm"
              numberOfLines={1}
            >
              Thêm
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View 
          className="flex-row items-center bg-gray-50 rounded-xl px-4 py-2 border border-gray-200"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800"
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          <TouchableOpacity
            className={`px-5 py-2.5 rounded-full mr-3 ${
              selectedCategory === null ? 'bg-blue-500' : 'bg-white border border-gray-300'
            }`}
            onPress={() => setSelectedCategory(null)}
            style={
              selectedCategory === null
                ? {
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    elevation: 3,
                  }
                : {}
            }
          >
            <Text
              className={`font-semibold text-sm ${
                selectedCategory === null ? 'text-white' : 'text-gray-700'
              }`}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          {categories.map((category: any) => (
            <TouchableOpacity
              key={category.id}
              className={`px-5 py-2.5 rounded-full mr-3 ${
                selectedCategory === category.id ? 'bg-blue-500' : 'bg-white border border-gray-300'
              }`}
              onPress={() => setSelectedCategory(category.id)}
              style={
                selectedCategory === category.id
                  ? {
                      shadowColor: '#3B82F6',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 3,
                      elevation: 3,
                    }
                  : {}
              }
            >
              <Text
                className={`font-semibold text-sm ${
                  selectedCategory === category.id ? 'text-white' : 'text-gray-700'
                }`}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
          <Text className="text-gray-500 text-center mt-4 text-lg">
            {searchQuery ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              className="bg-blue-500 rounded-lg px-6 py-3 mt-4"
              onPress={() => (navigation as any).navigate('AddProduct')}
            >
              <Text className="text-white font-semibold">Tạo sản phẩm đầu tiên</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          <View className="p-4">
            {filteredProducts.map((product: any) => (
              <View
                key={product.id}
                className="bg-white rounded-2xl p-4 mb-4 border border-gray-100"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View className="flex-row">
                  {product.imageUrl ? (
                    <View 
                      className="w-24 h-24 rounded-xl bg-gray-200 mr-4 overflow-hidden"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Image
                        source={{ uri: product.imageUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                  ) : (
                    <View 
                      className="w-24 h-24 rounded-xl bg-gray-200 mr-4 items-center justify-center"
                      style={{
                        backgroundColor: '#E5E7EB',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Ionicons name="cube-outline" size={36} color="#9CA3AF" />
                    </View>
                  )}

                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {product.name}
                    </Text>
                    <Text className="text-2xl font-bold text-blue-600 mb-2">
                      {formatCurrency(product.price)}
                    </Text>
                    <View className="flex-row items-center flex-wrap gap-2">
                      <View className="flex-row items-center bg-gray-50 px-2.5 py-1 rounded-lg">
                        <Ionicons name="cube" size={14} color="#6B7280" />
                        <Text className="text-gray-700 text-xs font-medium ml-1.5">
                          Tồn: {product.stock || 0}
                        </Text>
                      </View>
                      <View
                        className={`px-3 py-1 rounded-lg ${
                          product.isActive
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            product.isActive ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {product.isActive ? 'Đang bán' : 'Tạm ngưng'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-col justify-between ml-2">
                    <TouchableOpacity
                      className="bg-blue-50 rounded-xl p-2.5 mb-2 border border-blue-200"
                      onPress={() => (navigation as any).navigate('EditProduct', { productId: product.id })}
                      style={{
                        shadowColor: '#3B82F6',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                    >
                      <Ionicons name="pencil" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-red-50 rounded-xl p-2.5 border border-red-200"
                      onPress={() => {
                        Alert.alert(
                          'Xác nhận',
                          'Bạn có chắc muốn xóa sản phẩm này?',
                          [
                            { text: 'Hủy', style: 'cancel' },
                            {
                              text: 'Xóa',
                              style: 'destructive',
                              onPress: () => deleteProductMutation.mutate(product.id),
                            },
                          ]
                        );
                      }}
                      style={{
                        shadowColor: '#EF4444',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default ProductsScreen;

