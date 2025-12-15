import {
  ScrollView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import React, {useState, useEffect, useRef} from 'react';
import Header from '../components/dashboard/Header';
import SearchBar, {SearchCriteria} from '../components/dashboard/SearchBar';
import BannerCarousel from '../components/dashboard/BannerCarousel';
import Categories from '../components/dashboard/Categories';
import FlashSale from '../components/dashboard/FlashSale';
import PopularItems from '../components/dashboard/PopularItems';
import CartBottomBar from '../components/CartBottomBar';
import ChatbotButton from '../components/ChatbotButton';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useSocket} from '../hooks/useSocket';
import {useNavigation} from '@react-navigation/native';
import {MainRoutes} from '../navigation/Routes';

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({});
  const [flashSaleTimeLeft, setFlashSaleTimeLeft] = useState<number | null>(
    null,
  );
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;
  const [notifications, setNotifications] = useState<
    Array<{id: string; message: string; type: string; timestamp: number}>
  >([]);
  const [newProductsCount, setNewProductsCount] = useState(0);
  const notificationOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const searchResultsMarkerRef = useRef<View>(null);

  // Scroll to search results when search is performed
  const scrollToSearchResults = () => {
    setTimeout(() => {
      if (searchResultsMarkerRef.current && scrollViewRef.current) {
        searchResultsMarkerRef.current.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 80),
              animated: true,
            });
          },
          () => {
            // Fallback: scroll to approximate position
            scrollViewRef.current?.scrollTo({
              y: 450,
              animated: true,
            });
          },
        );
      } else if (scrollViewRef.current) {
        // Fallback: scroll to approximate position
        scrollViewRef.current.scrollTo({
          y: 450,
          animated: true,
        });
      }
    }, 400);
  };

  // Socket connection với các events
  const {isConnected, socketError, emit} = useSocket({
    autoConnect: true,
    events: {
      // Flash sale countdown
      'flashSale:countdown': (data: {timeLeft: number}) => {
        setFlashSaleTimeLeft(data.timeLeft);
      },
      'flashSale:start': (data: {duration: number}) => {
        setFlashSaleTimeLeft(data.duration);
        showNotification('⚡ Flash Sale đã bắt đầu!', 'flashSale');
      },
      'flashSale:end': () => {
        setFlashSaleTimeLeft(null);
        showNotification('⏰ Flash Sale đã kết thúc', 'info');
      },

      // New products
      'product:new': (data: {product: any}) => {
        setNewProductsCount(prev => prev + 1);
        showNotification(`🆕 Sản phẩm mới: ${data.product.name}`, 'newProduct');
      },

      // Order updates
      'order:statusUpdate': (data: {
        orderId: string;
        status: string;
        message?: string;
        shipperName?: string;
      }) => {
        const statusMessages: {[key: string]: string} = {
          pending: '⏳ Đơn hàng đang chờ xác nhận',
          confirmed: '✅ Đơn hàng đã được xác nhận',
          preparing: '👨‍🍳 Đơn hàng đang được chuẩn bị',
          ready: '📦 Đơn hàng đã sẵn sàng',
          ready_for_pickup: '📦 Đơn hàng sẵn sàng lấy hàng',
          picked_up: '🛍️ Shipper đã lấy hàng',
          delivering: '🚚 Đơn hàng đang được giao',
          shipper_arrived: `🚚 Shipper ${data.shipperName || ''} đã đến nơi giao hàng! Vui lòng ra nhận hàng.`,
          arrived: `🚚 Shipper ${data.shipperName || ''} đã đến nơi giao hàng! Vui lòng ra nhận hàng.`,
          completed: '🎉 Đơn hàng đã được giao thành công',
          delivered: '🎉 Đơn hàng đã được giao',
          cancelled: '❌ Đơn hàng đã bị hủy',
          canceled: '❌ Đơn hàng đã bị hủy',
        };
        showNotification(
          data.message || statusMessages[data.status] || 'Cập nhật đơn hàng',
          'order',
        );
      },

      // Thông báo khi shipper giao hàng tới
      'order:shipperArrived': (data: {
        orderId: string;
        shipperName?: string;
        shipperPhone?: string;
        message?: string;
      }) => {
        const shipperInfo = data.shipperName ? `Shipper ${data.shipperName}` : 'Shipper';
        showNotification(
          data.message ||
            `🚚 ${shipperInfo} đã đến nơi giao hàng! Vui lòng ra nhận hàng ngay.`,
          'delivery',
        );
      },

      // Promotions
      'promotion:new': (data: {title: string; description: string}) => {
        showNotification(`🎁 Khuyến mãi mới: ${data.title}`, 'promotion');
      },

      // General notifications
      notification: (data: {message: string; type?: string}) => {
        showNotification(data.message, data.type || 'info');
      },
    },
  });

  // Format thời gian countdown
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Hiển thị notification
  const showNotification = (message: string, type: string = 'info') => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Date.now(),
    };

    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Giữ tối đa 5 notifications

    // Animation
    Animated.parallel([
      Animated.timing(notificationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();

    // Tự động ẩn sau 3 giây
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(notificationOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Chỉ cập nhật state sau khi animation hoàn thành
        // Không cần setValue vì animation đã đặt giá trị rồi
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      });
    }, 3000);
  };

  // Cleanup notifications cũ
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotifications(
        prev => prev.filter(n => now - n.timestamp < 10000), // Giữ notifications trong 10 giây
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Request flash sale countdown khi connect
  useEffect(() => {
    if (isConnected) {
      emit('flashSale:getCountdown');
    }
  }, [isConnected, emit]);

  return (
    <View className="flex-1" style={styles.safeAreaContainer}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#EA7001"
        translucent={true}
      />

      {/* Socket Connection Status - Chỉ hiển thị khi có lỗi quan trọng */}
      {socketError && socketError.includes('chưa được cài đặt') && (
        <View style={styles.errorBanner}>
          <View style={styles.errorContent}>
            <Ionicons name="warning" size={16} color="#FFFFFF" />
            <Text style={styles.errorText}>{socketError}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              // Có thể thêm logic để dismiss error
            }}
            style={styles.errorCloseButton}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <Animated.View
          style={[
            styles.notificationContainer,
            {
              opacity: notificationOpacity,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          <View className="bg-white rounded-lg shadow-lg p-3 mx-4 mb-2 border-l-4 border-orange-500">
            <View className="flex-row items-center">
              <Ionicons name="notifications" size={20} color="#F97316" />
              <Text className="ml-2 flex-1 text-gray-800 font-medium">
                {notifications[0]?.message}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setNotifications([]);
                }}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Header */}
      <View style={styles.headerWrapper}>
        <LinearGradient
          colors={['#EA7001', '#EA7001', '#FF8C42', '#FFA07A']}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.headerContainer, {paddingTop: statusBarHeight + 8}]}>
          <Header />
        </LinearGradient>
        {/* Search Bar - Overlap giữa header và content */}
        <View style={styles.searchBarWrapper}>
          <SearchBar
            value={query}
            onChange={(text) => {
              setQuery(text);
              setSearchCriteria(prev => ({...prev, text}));
            }}
            searchCriteria={searchCriteria}
            onSearchCriteriaChange={(criteria) => {
              setSearchCriteria(criteria);
            }}
            onSearch={scrollToSearchResults}
          />
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        style={styles.scrollViewContainer}>
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
              {/* Real-time Countdown */}
              {flashSaleTimeLeft !== null && flashSaleTimeLeft > 0 && (
                <View className="ml-3 bg-red-100 px-2 py-1 rounded">
                  <Text className="text-red-600 font-bold text-xs">
                    ⏰ {formatTime(flashSaleTimeLeft)}
                  </Text>
                </View>
              )}
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

        {/* Marker for scroll position */}
        <View ref={searchResultsMarkerRef} style={{height: 0}} />

        {/* Popular Items Section */}
        <View className="pt-6 px-4 pb-6" style={styles.popularItemsContainer}>
          {!query && !searchCriteria.categoryId && !searchCriteria.minPrice && !searchCriteria.maxPrice && !searchCriteria.minRating && (
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Text className="text-xl font-bold text-gray-800">
                  Các món ăn phổ biến
                </Text>
                {/* New Products Badge */}
                {newProductsCount > 0 && (
                  <View className="ml-2 bg-green-500 rounded-full px-2 py-0.5">
                    <Text className="text-white text-xs font-bold">
                      +{newProductsCount} mới
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setNewProductsCount(0);
                }}>
                <Text className="text-orange-500 font-semibold">
                  Xem tất cả
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {(query || searchCriteria.categoryId || searchCriteria.minPrice || searchCriteria.maxPrice || searchCriteria.minRating) && (
            <View className="mb-4">
              <Text className="text-xl font-bold text-gray-800">
                {query ? `Kết quả tìm kiếm: "${query}"` : 'Kết quả tìm kiếm'}
              </Text>
              {(searchCriteria.categoryId || searchCriteria.minPrice || searchCriteria.maxPrice || searchCriteria.minRating) && (
                <View className="flex-row flex-wrap mt-2">
                  {searchCriteria.categoryId && (
                    <View className="bg-orange-100 px-3 py-1 rounded-full mr-2 mb-2">
                      <Text className="text-orange-700 text-xs font-medium">
                        Đã lọc
                      </Text>
                    </View>
                  )}
                  {(searchCriteria.minPrice || searchCriteria.maxPrice) && (
                    <View className="bg-orange-100 px-3 py-1 rounded-full mr-2 mb-2">
                      <Text className="text-orange-700 text-xs font-medium">
                        {searchCriteria.minPrice && searchCriteria.maxPrice
                          ? `${(searchCriteria.minPrice / 1000).toFixed(0)}k - ${(searchCriteria.maxPrice / 1000).toFixed(0)}k`
                          : searchCriteria.minPrice
                            ? `Từ ${(searchCriteria.minPrice / 1000).toFixed(0)}k`
                            : `Đến ${(searchCriteria.maxPrice! / 1000).toFixed(0)}k`}
                      </Text>
                    </View>
                  )}
                  {searchCriteria.minRating && (
                    <View className="bg-orange-100 px-3 py-1 rounded-full mr-2 mb-2">
                      <Text className="text-orange-700 text-xs font-medium">
                        {searchCriteria.minRating}+ sao
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
          <PopularItems
            searchQuery={searchCriteria?.text || query}
            searchCriteria={searchCriteria}
          />
        </View>
      </ScrollView>

      {/* Cart Bottom Bar */}
      <CartBottomBar />

      {/* Chatbot Button */}
      <ChatbotButton
        onPress={() => navigation.navigate(MainRoutes.Chatbot)}
        visible={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#EA7001',
  },
  headerWrapper: {
    position: 'relative',
    zIndex: 10,
    marginBottom: 0,
  },
  headerContainer: {
    paddingBottom: 50,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchBarWrapper: {
    position: 'absolute',
    bottom: -32, // Đặt search bar ở cuối header, overlap với white container
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
  },
  scrollViewContent: {
    paddingBottom: 0,
  },
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#EA7001',
  },
  whiteContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: -10, // Overlap nhẹ với header và search bar để tạo hiệu ứng hòa quyện
    paddingTop: 40, // Padding để bù lại marginTop âm và tạo khoảng cách với search bar
    paddingBottom: 24,
    overflow: 'hidden',
    zIndex: 1,
  },
  flashSaleContainer: {
    backgroundColor: '#FFFFFF',
  },
  popularItemsContainer: {
    backgroundColor: '#FFFFFF',
  },
  notificationContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  errorBanner: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  errorCloseButton: {
    padding: 4,
  },
});

export default HomeScreen;
