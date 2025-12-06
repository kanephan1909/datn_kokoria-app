import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
} from 'react-native';
import React, {useState} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

interface Notification {
  id: string;
  type: 'order' | 'promotion' | 'voucher' | 'delivery' | 'trending';
  title: string;
  subtitle: string;
  timestamp: string;
  isRead: boolean;
}

type TabType = 'all' | 'orders' | 'promotions';

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Mock data - sau này sẽ lấy từ API
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'delivery',
      title: 'Đơn hàng của bạn đang được giao!',
      subtitle: 'Alexei vừa nhận món gà của bạn từ Kokoria Lê Văn Duyệt 🛵',
      timestamp: '5 phút',
      isRead: false,
    },
    {
      id: '2',
      type: 'promotion',
      title: 'Giảm 20% cho combo Gà Chiên Giòn chỉ hôm nay',
      subtitle: 'Chỉ hôm nay! Hãy thưởng thức chảo phô mai',
      timestamp: '1 giờ',
      isRead: false,
    },
    {
      id: '3',
      type: 'voucher',
      title: 'Đã nhận voucher',
      subtitle: 'Bạn đã nhận được voucher $5 từ đơn hàng trước. Áp dụng khi thanh toán!',
      timestamp: '2 giờ',
      isRead: true,
    },
    {
      id: '4',
      type: 'delivery',
      title: 'Đơn hàng đã giao',
      subtitle: 'Chúc bạn ngon miệng! Đừng quên đánh giá Kokoria Cheese & Drink ⭐',
      timestamp: '4 giờ',
      isRead: true,
    },
    {
      id: '5',
      type: 'trending',
      title: 'Đang thịnh hành gần bạn',
      subtitle: 'TP HCM Delights đang trở nên phổ biến, 100+ đơn hàng tuần này!',
      timestamp: '8 giờ',
      isRead: true,
    },
  ]);

  // Lọc notifications theo tab
  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === 'all') {
      return true;
    }
    if (activeTab === 'orders') {
      return notif.type === 'delivery' || notif.type === 'order';
    }
    if (activeTab === 'promotions') {
      return notif.type === 'promotion' || notif.type === 'voucher' || notif.type === 'trending';
    }
    return true;
  });

  // Lấy icon theo type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'delivery':
        return 'car-outline';
      case 'promotion':
        return 'location-outline';
      case 'voucher':
        return 'ticket-outline';
      case 'trending':
        return 'flame-outline';
      default:
        return 'notifications-outline';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return timestamp;
  };

  const renderNotificationItem = ({item}: {item: Notification}) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.isRead && styles.unreadCard]}
      activeOpacity={0.7}>
      <View style={styles.notificationContent}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={24}
            color="#FFFFFF"
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationSubtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>
        </View>

        {/* Timestamp */}
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={[]} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, {paddingTop: statusBarHeight + 16}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}>
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={20} color="#000" />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thông báo</Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.7}>
          <Text
            style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            Tất cả
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'orders' && styles.activeTabText,
            ]}>
            Đơn hàng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'promotions' && styles.activeTab]}
          onPress={() => setActiveTab('promotions')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'promotions' && styles.activeTabText,
            ]}>
            Khuyến mãi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>Không có thông báo</Text>
          <Text style={styles.emptySubtext}>
            Bạn sẽ nhận được thông báo về đơn hàng và khuyến mãi ở đây
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#F97316',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen;

