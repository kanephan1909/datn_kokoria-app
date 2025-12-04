import {
  ScrollView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import React, {useState} from 'react';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useQuery} from '@tanstack/react-query';
import {fetchProducts, fetchCategories} from '../../api/apiClient';
import {useCart} from '../store/useCartStore';
import {useNavigation} from '@react-navigation/native';
import {MainRoutes} from '../navigation/Routes';
import CartBottomBar from '../components/CartBottomBar';

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

const MenuScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const {addItem} = useCart();
  const navigation = useNavigation();

  // Fetch categories
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

  // Fetch products
  const {data: productsData, isLoading} = useQuery({
    queryKey: ['menuProducts', selectedCategory],
    queryFn: async () => {
      const response = await fetchProducts({
        categoryId: selectedCategory || undefined,
        limit: 20,
        page: 1,
      });
      if (response.success && response.data) {
        const productsList = Array.isArray(response.data)
          ? response.data
          : response.data.products || response.data.data || [];
        return productsList as Product[];
      }
      throw new Error(response.message || 'Failed to fetch products');
    },
  });

  const categories = categoriesData || [];
  const products = productsData || [];

  // Set first category as selected by default
  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(product.id, 1);
      // Alert.alert('Thành công', 'Đã thêm sản phẩm vào giỏ hàng');
    } catch (error: any) {
      // Alert.alert('Lỗi', error.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    }
  };

  const renderProduct = ({item}: {item: Product}) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        (navigation as any).navigate(MainRoutes.ProductDetails, {
          productId: item.id,
        });
      }}
      style={styles.productCard}>
      <View style={styles.productImageContainer}>
        {item.imageUrl ? (
          <Image
            source={{uri: item.imageUrl}}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.addButton}
            onPress={() => handleAddToCart(item)}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        <TouchableOpacity style={styles.searchButton} activeOpacity={0.7}>
          <Ionicons name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Category Filters */}
        <View style={styles.categoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(category.id)}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                ]}>
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive,
                  ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Promotional Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <View>
              <Text style={styles.bannerTitle}>20% OFF</Text>
              <Text style={styles.bannerSubtitle}>
                On all {categories.find(c => c.id === selectedCategory)?.name || 'items'} sets
              </Text>
            </View>
            <View style={styles.bannerImagePlaceholder}>
              <Ionicons name="restaurant" size={60} color="#fff" />
            </View>
          </View>
        </View>

        {/* Popular Dishes Section */}
        <View style={styles.popularSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Món phổ biến</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : products.length > 0 ? (
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có sản phẩm</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cart Bottom Bar */}
      <CartBottomBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  categoryContainer: {
    paddingVertical: 16,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  categoryButtonActive: {
    backgroundColor: '#EA580C',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  banner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: '#FED7AA',
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  bannerImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  productImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 16,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default MenuScreen;
