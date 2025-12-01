import { Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView, RefreshControl } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery , useQueryClient } from '@tanstack/react-query';
import { deleteCategory, fetchCategories } from '../api/apiClient';

const CategoriesScreen = () => {
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const { data: categoriesData, isLoading: isLoadingCategories, error: errorCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
    });

    const { mutate: deleteCategoryMutation } = useMutation({
      mutationFn: deleteCategory,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        Alert.alert('Thành công', 'Danh mục đã được xóa');
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.errors?.[0]?.message || 
                           error?.message || 
                           'Không thể xóa danh mục';
        Alert.alert('Lỗi', errorMessage);
      }
    })

    const handleDeleteCategory = (id: string) => {
      deleteCategoryMutation(id)
    }

  if (isLoadingCategories) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (errorCategories) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-4">
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text className="text-red-500 text-center mt-4">
          Có lỗi xảy ra khi tải danh mục
        </Text>
      </View>
    );
  }

  const categories = categoriesData?.data || [];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-4 pt-4 pb-4 border-b border-gray-200"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Danh Mục Sản Phẩm</Text>
            <Text className="text-sm text-gray-500 mt-1">
              {categories.length} danh mục
            </Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center bg-blue-500 rounded-xl px-4 py-2.5"
            onPress={() => (navigation as any).navigate('AddCategory')}
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text className="text-white font-semibold ml-1.5 text-sm">Thêm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {categories.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <View 
            className="bg-gray-100 rounded-full p-6 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="folder-open-outline" size={64} color="#9CA3AF" />
          </View>
          <Text className="text-gray-700 text-center mt-2 text-xl font-bold">
            Chưa có danh mục nào
          </Text>
          <Text className="text-gray-500 text-center mt-2 text-sm">
            Tạo danh mục đầu tiên để bắt đầu
          </Text>
          <TouchableOpacity
            className="bg-blue-500 rounded-xl px-6 py-3.5 mt-6"
            onPress={() => (navigation as any).navigate('AddCategory')}
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Text className="text-white font-bold">Tạo danh mục đầu tiên</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => {}} />
          }
        >
          <View className="p-4">
            {categories.map((category: any) => (
              <View
                key={category.id}
                className="bg-white rounded-2xl p-4 mb-4 border border-gray-100"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {category.name}
                    </Text>
                    <View className="flex-row items-center bg-gray-50 px-2.5 py-1 rounded-lg self-start">
                      <Ionicons name="cube-outline" size={14} color="#6B7280" />
                      <Text className="text-gray-600 text-sm font-medium ml-1.5">
                        {category.products?.length || 0} sản phẩm
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center ml-3">
                    <TouchableOpacity
                      className="bg-blue-50 rounded-xl p-2.5 border border-blue-200 mr-2"
                      onPress={() => {
                        (navigation as any).navigate('EditCategory', { categoryId: category.id });
                      }}
                      style={{
                        shadowColor: '#3B82F6',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 2,
                      }}
                    >
                      <Ionicons name="pencil" size={20} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-red-50 rounded-xl p-2.5 border border-red-200"
                      onPress={() => {
                        Alert.alert(
                          'Xác nhận',
                          'Bạn có chắc muốn xóa danh mục này?',
                          [
                            { text: 'Hủy', style: 'cancel' },
                            {
                              text: 'Xóa',
                              style: 'destructive',
                              onPress: () => handleDeleteCategory(category.id),
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
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
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
}

export default CategoriesScreen

const styles = StyleSheet.create({})