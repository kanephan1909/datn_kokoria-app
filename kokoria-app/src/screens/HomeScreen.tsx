import {
  ScrollView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import React, {useState, useEffect, useRef} from 'react';
import Header from '../components/dashboard/Header';
import SearchBar from '../components/dashboard/SearchBar';
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
  const [flashSaleTimeLeft, setFlashSaleTimeLeft] = useState<number | null>(
    null,
  );
  const [notifications, setNotifications] = useState<
    Array<{id: string; message: string; type: string; timestamp: number}>
  >([]);
  const [newProductsCount, setNewProductsCount] = useState(0);
  const notificationOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

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
        showNotification(
          `🆕 Sản phẩm mới: ${data.product.name}`,
          'newProduct',
        );
      },

      // Order updates
      'order:statusUpdate': (data: {
        orderId: string;
        status: string;
        message?: string;
      }) => {
        const statusMessages: {[key: string]: string} = {
          confirmed: '✅ Đơn hàng đã được xác nhận',
          preparing: '👨‍🍳 Đơn hàng đang được chuẩn bị',
          ready: '📦 Đơn hàng đã sẵn sàng',
          delivering: '🚚 Đơn hàng đang được giao',
          delivered: '🎉 Đơn hàng đã được giao',
          cancelled: '❌ Đơn hàng đã bị hủy',
        };
        showNotification(
          data.message || statusMessages[data.status] || 'Cập nhật đơn hàng',
          'order',
        );
      },

      // Promotions
      'promotion:new': (data: {title: string; description: string}) => {
        showNotification(`🎁 Khuyến mãi mới: ${data.title}`, 'promotion');
      },

      // General notifications
      'notification': (data: {message: string; type?: string}) => {
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
        setNotifications(prev =>
          prev.filter(n => n.id !== notification.id),
        );
        notificationOpacity.setValue(0);
        slideAnim.setValue(-100);
      });
    }, 3000);
  };

  // Cleanup notifications cũ
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotifications(prev =>
        prev.filter(n => now - n.timestamp < 10000), // Giữ notifications trong 10 giây
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
    <SafeAreaView edges={['top']} className="flex-1 bg-orange-500">
      <StatusBar
        barStyle="light-content"
        backgroundColor="#EA580C"
        translucent={false}
      />

      {/* Socket Connection Status (Debug) - Chỉ hiển thị khi có lỗi */}
      {__DEV__ && socketError && (
        <View className="px-2 py-1 bg-red-500">
          <Text className="text-white text-xs text-center">
            Socket Error: {socketError}
          </Text>
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
                  notificationOpacity.setValue(0);
                  slideAnim.setValue(-100);
                }}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

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

        {/* Popular Items Section */}
        <View className="pt-6 px-4 pb-6" style={styles.popularItemsContainer}>
          {!query && (
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

      {/* Chatbot Button */}
      <ChatbotButton
        onPress={() => navigation.navigate(MainRoutes.Chatbot)}
        visible={true}
      />
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
  notificationContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});

export default HomeScreen;
