import {
  ScrollView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import React, {useState} from 'react';
import Header from '../components/dashboard/Header';
import SearchBar from '../components/dashboard/SearchBar';
import BannerCarousel from '../components/dashboard/BannerCarousel';
import Categories from '../components/dashboard/Categories';
import FlashSale from '../components/dashboard/FlashSale';
import PopularItems from '../components/dashboard/PopularItems';
import CartBottomBar from '../components/CartBottomBar';
import Ionicons from '@react-native-vector-icons/ionicons';

const HomeScreen = () => {
  const [query, setQuery] = useState('');


  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-orange-500">
      <StatusBar
        barStyle="light-content"
        backgroundColor="#EA580C"
        translucent={false}
      />

      {/* Header + Search */}
      <View
        className="bg-orange-600 pb-4 shadow-md"
        style={styles.headerContainer}>
        <Header />
        <View className="px-4 mt-2">
          <SearchBar value={query} onChange={setQuery} />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        style={styles.scrollViewContainer} // ✅ trùng màu header
      >
        {/* White Container (Rounded Top) */}
        <View style={styles.whiteContainer}>
          {/* Banner */}
          <View className="pt-4">
            <BannerCarousel />
          </View>
          <View>
            {/* Categories */}
            <Categories />
          </View>
        </View>

        {/* Flash Sale Section */}
        <View className="pt-4" style={styles.flashSaleContainer}>
            <View className="flex-row items-center justify-between px-4 mb-3">
            <View className="flex-row items-center">
              <View className="bg-red-500 px-3 py-1 rounded-full mr-2">
                <Ionicons name="flash" size={16} color="#fff" />
              </View>
              <Text className="text-xl font-bold text-gray-800">
                Khuyến mãi
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <View className="flex-row items-center">
                <Text className="text-orange-500 font-semibold mr-1">
                  Xem tất cả
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#F97316" />
              </View>
            </TouchableOpacity>
          </View>
          <FlashSale />
        </View>

        {/* Popular Items Section */}
        <View className="pt-6 px-4 pb-6" style={styles.popularItemsContainer}>
          {!query && (
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Đồ ăn ngon
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-orange-500 font-semibold">
                  Xem tất cả
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {query && (
            <View className="mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Kết quả tìm kiếm: "{query}"
              </Text>
            </View>
          )}
          <PopularItems searchQuery={query} />
        </View>
      </ScrollView>

      {/* Cart Bottom Bar */}
      <CartBottomBar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    zIndex: 2,
  },
  scrollViewContent: {
    paddingBottom: 0,
  },
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#EA580C',
  },
  whiteContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 5, // ✅ overlap nhẹ để dính liền
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  flashSaleContainer: {
    backgroundColor: '#F9FAFB',
  },
  popularItemsContainer: {
    backgroundColor: '#F9FAFB',
  },
});

export default HomeScreen;
