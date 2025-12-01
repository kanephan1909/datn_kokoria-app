import {
  View,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import {useQuery} from '@tanstack/react-query';
import {fetchCategories} from '../../../api/apiClient';
import CategoryCard from './CategoryCard';
import {MainStackParamList, MainRoutes} from '../../navigation/Routes';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

const Categories = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const {data: categoriesData, isLoading} = useQuery({
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

  if (isLoading) {
    return (
      <View className="pt-4 px-4">
        <View className="flex-row items-center justify-center py-4">
          <ActivityIndicator size="small" color="#F97316" />
        </View>
      </View>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <View className="pt-4 px-4">
      <FlatList
        data={categories}
        renderItem={({item}) => (
          <CategoryCard
            name={item?.name}
            image={item?.imageUrl || ''}
            onPress={() =>
              navigation.navigate(MainRoutes.Category, {categoryId: item?.id})
            }
          />
        )}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default Categories;
