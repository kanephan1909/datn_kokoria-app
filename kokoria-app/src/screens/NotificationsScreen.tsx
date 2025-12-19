import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import React, {useState, useMemo, useCallback} from 'react';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../../api/apiClient';
import {useSocket} from '../hooks/useSocket';
import {MainRoutes} from '../navigation/Routes';

interface Notification {
  id: string;
  type: 'order' | 'promotion' | 'voucher' | 'delivery' | 'trending';
  title: string;
  subtitle: string;
  timestamp: string;
  createdAt?: string;
  isRead: boolean;
  orderId?: string;
  promotionId?: string;
  voucherId?: string;
  metadata?: any;
}

type TabType = 'all' | 'orders' | 'promotions';

// Mock data fallback khi API chưa sẵn sàng
const getMockNotifications = (): Notification[] => [
  {
    id: '1',
    type: 'delivery',
    title: 'Shipper đã đến nơi giao hàng! 🚚',
    subtitle: 'Shipper đang chờ bạn để giao đơn hàng. Vui lòng ra nhận hàng!',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: '1-2',
    type: 'delivery',
    title: 'Đơn hàng của bạn đang được giao!',
    subtitle: 'Alexei vừa nhận món gà của bạn từ Kokoria Lê Văn Duyệt 🛵',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: '2',
    type: 'promotion',
    title: 'Giảm 20% cho combo Gà Chiên Giòn chỉ hôm nay',
    subtitle: 'Chỉ hôm nay! Hãy thưởng thức chảo phô mai',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: '3',
    type: 'voucher',
    title: 'Đã nhận voucher',
    subtitle: 'Bạn đã nhận được voucher $5 từ đơn hàng trước. Áp dụng khi thanh toán!',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: '4',
    type: 'delivery',
    title: 'Đơn hàng đã giao',
    subtitle: 'Chúc bạn ngon miệng! Đừng quên đánh giá Kokoria Cheese & Drink ⭐',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
  {
    id: '5',
    type: 'trending',
    title: 'Đang thịnh hành gần bạn',
    subtitle: 'TP HCM Delights đang trở nên phổ biến, 100+ đơn hàng tuần này!',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    isRead: true,
  },
];

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top;
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [longPressItemId, setLongPressItemId] = useState<string | null>(null);

  // Socket để nhận real-time notifications
  useSocket({
    autoConnect: true,
    events: {
      'notification:new': (_data: {notification: Notification}) => {
        // Refetch notifications khi có notification mới
        queryClient.invalidateQueries({queryKey: ['notifications']});
      },
      'notification:read': (_data: {notificationId: string}) => {
        queryClient.invalidateQueries({queryKey: ['notifications']});
      },
      // Thông báo khi shipper giao hàng tới
      'order:shipperArrived': (_data: {
        orderId: string;
        shipperName?: string;
        shipperPhone?: string;
        message?: string;
      }) => {
        // Invalidate để refetch và hiển thị thông báo mới
        queryClient.invalidateQueries({queryKey: ['notifications']});
      },
      // Cập nhật status đơn hàng (bao gồm khi shipper tới)
      'order:statusUpdate': (data: {
        orderId: string;
        status: string;
        message?: string;
        shipperName?: string;
      }) => {
        // Nếu status là shipper_arrived hoặc delivering với thông tin shipper
        if (
          data.status === 'shipper_arrived' ||
          data.status === 'arrived' ||
          (data.status === 'delivering' && data.shipperName)
        ) {
          queryClient.invalidateQueries({queryKey: ['notifications']});
        }
      },
    },
  });

  // Fetch notifications với React Query
  const {
    data: notificationsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['notifications', activeTab],
    queryFn: async () => {
      try {
        const params: {
          page?: number;
          limit?: number;
          type?: string;
        } = {
          page: 1,
          limit: 100,
        };

        // Map tab to type filter
        if (activeTab === 'orders') {
          params.type = 'order,delivery';
        } else if (activeTab === 'promotions') {
          params.type = 'promotion,voucher,trending';
        }

        const response = await fetchNotifications(params);
        if (response.success && response.data) {
          return Array.isArray(response.data)
            ? response.data
            : response.data.notifications || response.data.data || [];
        }
        throw new Error(response.message || 'Failed to fetch notifications');
        } catch (err: any) {
        // Nếu là lỗi 404 hoặc API chưa sẵn sàng, fallback về mock data
        if (err?.response?.status === 404 || err?.message?.includes('404')) {
          console.log('API endpoint not found, using mock data');
          // Filter mock data theo tab
          const mockNotifications = getMockNotifications();
          let filtered = mockNotifications;
          if (activeTab === 'orders') {
            filtered = mockNotifications.filter(
              n => n.type === 'delivery' || n.type === 'order',
            );
          } else if (activeTab === 'promotions') {
            filtered = mockNotifications.filter(
              n =>
                n.type === 'promotion' ||
                n.type === 'voucher' ||
                n.type === 'trending',
            );
          }
          return filtered;
        }
        // Nếu là lỗi khác, vẫn throw để hiển thị error state
        throw err;
      }
    },
    staleTime: 30000, // 30 seconds
    retry: false, // Không retry để nhanh chóng fallback về mock data
  });

  const notifications: Notification[] = useMemo(
    () => notificationsResponse || [],
    [notificationsResponse],
  );

  // Check if using mock data (when API returns 404)
  const isUsingMockData = useMemo(() => {
    if (!notificationsResponse || notificationsResponse.length === 0) {
      return false;
    }
    // Check if first notification matches mock data structure
    const firstNotification = notificationsResponse[0];
    const mockNotifications = getMockNotifications();
    return mockNotifications.some(mock => mock.id === firstNotification?.id);
  }, [notificationsResponse]);

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (isUsingMockData) {
        // Nếu đang dùng mock data, chỉ update local state
        return Promise.resolve({success: true});
      }
      return markNotificationAsRead(notificationId);
    },
    onMutate: async (notificationId: string) => {
      // Optimistic update - cập nhật UI ngay lập tức cho cả mock data và API thật
      await queryClient.cancelQueries({queryKey: ['notifications']});
      const previousData = queryClient.getQueryData(['notifications', activeTab]);
      
      // Cập nhật ngay trong cache để UI phản hồi tức thì
      queryClient.setQueryData(['notifications', activeTab], (old: any) => {
        if (!old) {
          return old;
        }
        return old.map((n: Notification) =>
          n.id === notificationId ? {...n, isRead: true} : n,
        );
      });
      
      return {previousData};
    },
    onError: (_err, _notificationId, context) => {
      // Rollback nếu có lỗi
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', activeTab], context.previousData);
      }
    },
    onSuccess: () => {
      // Refresh để đảm bảo đồng bộ với server
      queryClient.invalidateQueries({queryKey: ['notifications']});
      queryClient.invalidateQueries({queryKey: ['notifications', 'unread']});
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (isUsingMockData) {
        return Promise.resolve({success: true});
      }
      return markAllNotificationsAsRead();
    },
    onMutate: async () => {
      if (isUsingMockData) {
        await queryClient.cancelQueries({queryKey: ['notifications']});
        const previousData = queryClient.getQueryData(['notifications', activeTab]);
        queryClient.setQueryData(['notifications', activeTab], (old: any) => {
          if (!old) {
            return old;
          }
          return old.map((n: Notification) => ({...n, isRead: true}));
        });
        return {previousData};
      }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', activeTab], context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notifications']});
      queryClient.invalidateQueries({queryKey: ['notifications', 'unread']});
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (isUsingMockData) {
        return Promise.resolve({success: true});
      }
      return deleteNotification(notificationId);
    },
    onMutate: async (notificationId: string) => {
      if (isUsingMockData) {
        await queryClient.cancelQueries({queryKey: ['notifications']});
        const previousData = queryClient.getQueryData(['notifications', activeTab]);
        queryClient.setQueryData(['notifications', activeTab], (old: any) => {
          if (!old) {
            return old;
          }
          return old.filter((n: Notification) => n.id !== notificationId);
        });
        return {previousData};
      }
    },
    onError: (_err, _notificationId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['notifications', activeTab], context.previousData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notifications']});
      queryClient.invalidateQueries({queryKey: ['notifications', 'unread']});
    },
  });

  // Format timestamp to relative time
  const formatTimestamp = useCallback((timestamp: string | undefined) => {
    if (!timestamp) {
      return '';
    }

    try {
      const now = new Date();
      const time = new Date(timestamp);
      const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return 'Vừa xong';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} phút trước`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} giờ trước`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} ngày trước`;
      } else {
        // Format as date if older than a week
        return time.toLocaleDateString('vi-VN', {
          day: 'numeric',
          month: 'short',
          year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
      }
    } catch (e) {
      return timestamp;
    }
  }, []);

  // Get icon color based on type
  const getIconColor = (type: string) => {
    switch (type) {
      case 'delivery':
      case 'order':
        return '#3B82F6'; // Blue
      case 'promotion':
        return '#F97316'; // Orange
      case 'voucher':
        return '#10B981'; // Green
      case 'trending':
        return '#EF4444'; // Red
      default:
        return '#F97316';
    }
  };

  // Get icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'delivery':
      case 'order':
        return 'car-outline';
      case 'promotion':
        return 'gift-outline';
      case 'voucher':
        return 'ticket-outline';
      case 'trending':
        return 'flame-outline';
      default:
        return 'notifications-outline';
    }
  };

  // Handle notification press
  const handleNotificationPress = useCallback(
    (item: Notification) => {
      // Mark as read if not already read
      if (!item.isRead) {
        markAsReadMutation.mutate(item.id);
      }

      // Navigate based on type
      if (item.type === 'delivery' || item.type === 'order') {
        if (item.orderId) {
          navigation.navigate(MainRoutes.OrderDetails, {orderId: item.orderId});
        }
      } else if (item.type === 'promotion' && item.promotionId) {
        // Navigate to promotion details if available
        // navigation.navigate(MainRoutes.PromotionDetails, {promotionId: item.promotionId});
      } else if (item.type === 'voucher' && item.voucherId) {
        // Navigate to vouchers screen
        // navigation.navigate(MainRoutes.Vouchers);
      }
    },
    [markAsReadMutation, navigation],
  );

  // Handle long press to show delete option
  const handleLongPress = useCallback((item: Notification) => {
    setLongPressItemId(item.id);
    Alert.alert(
      'Xóa thông báo',
      'Bạn có muốn xóa thông báo này không?',
      [
        {text: 'Hủy', style: 'cancel', onPress: () => setLongPressItemId(null)},
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteNotificationMutation.mutate(item.id);
            setLongPressItemId(null);
          },
        },
      ],
    );
  }, [deleteNotificationMutation]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate();
  }, [markAllAsReadMutation]);

  // Count unread notifications
  const unreadCount = useMemo(() => {
    return (notificationsResponse || []).filter((n: Notification) => !n.isRead).length;
  }, [notificationsResponse]);

  const renderNotificationItem = ({item}: {item: Notification}) => {
    const iconColor = getIconColor(item.type);
    const isLongPressed = longPressItemId === item.id;

    return (
      <Pressable
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => handleLongPress(item)}
        style={[
          styles.notificationCard,
          !item.isRead && styles.unreadCard,
          isLongPressed && styles.longPressedCard,
        ]}>
        <View style={styles.notificationContent}>
          {/* Icon */}
          <View style={[styles.iconContainer, {backgroundColor: iconColor}]}>
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

          {/* Timestamp and Actions */}
          <View style={styles.rightContainer}>
            <Text style={styles.timestamp}>
              {formatTimestamp(item.createdAt || item.timestamp)}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
        </View>
      </Pressable>
    );
  };

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

        <TouchableOpacity
          onPress={handleMarkAllAsRead}
          style={styles.markAllButton}
          activeOpacity={0.7}
          disabled={
            unreadCount === 0 || markAllAsReadMutation.isPending
          }>
          {markAllAsReadMutation.isPending ? (
            <ActivityIndicator size="small" color="#F97316" />
          ) : (
            <Text
              style={[
                styles.markAllButtonText,
                unreadCount === 0 && styles.markAllButtonTextDisabled,
              ]}>
              Đã đọc tất cả
            </Text>
          )}
        </TouchableOpacity>
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
          {activeTab === 'all' && unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{unreadCount}</Text>
            </View>
          )}
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

      {/* Loading State */}
      {isLoading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Có lỗi xảy ra</Text>
          <Text style={styles.errorSubtext}>
            {(error as any)?.message || 'Không thể tải thông báo'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      {!isLoading && !isError && (
        <>
          {notifications.length > 0 ? (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  tintColor="#F97316"
                  colors={['#F97316']}
                />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không có thông báo</Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'all'
                  ? 'Bạn sẽ nhận được thông báo về đơn hàng và khuyến mãi ở đây'
                  : activeTab === 'orders'
                    ? 'Chưa có thông báo về đơn hàng'
                    : 'Chưa có thông báo khuyến mãi'}
              </Text>
            </View>
          )}
        </>
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
    paddingBottom: 16,
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
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
  },
  markAllButtonTextDisabled: {
    color: '#9CA3AF',
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
    flexDirection: 'row',
    gap: 6,
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
  tabBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F97316',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#FFF7ED',
  },
  longPressedCard: {
    backgroundColor: '#FEE2E2',
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
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
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
