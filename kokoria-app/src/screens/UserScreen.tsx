import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import Ionicons from '@react-native-vector-icons/ionicons';
import {MainRoutes} from '../navigation/Routes';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {fetchOrders} from '../../api/apiClient';

const UserScreen = () => {
  const {user} = useAuth();
  const navigation = useNavigation();
  const [ordersCount, setOrdersCount] = useState(0);

  // Fetch orders count
  useQuery({
    queryKey: ['userOrders'],
    queryFn: async () => {
      try {
        const response = await fetchOrders({limit: 100});
        if (response.success && response.data) {
          const ordersList = Array.isArray(response.data)
            ? response.data
            : response.data.orders || response.data.data || [];
          setOrdersCount(ordersList.length);
          return ordersList;
        }
        return [];
      } catch (error) {
        return [];
      }
    },
  });

  const menuItems = [
    {
      id: 'orders',
      title: 'Đơn hàng của tôi',
      description: 'Xem đơn hàng đã qua và đang xử lý',
      icon: 'document-text-outline',
      route: MainRoutes.OrderHistory,
    },
    {
      id: 'favorites',
      title: 'Yêu thích',
      description: 'Xem món ăn đã lưu',
      icon: 'heart-outline',
      route: null,
    },
    {
      id: 'vouchers',
      title: 'Voucher của tôi',
      description: 'Kiểm tra ưu đãi có sẵn',
      icon: 'pricetag-outline',
      route: null,
    },
    {
      id: 'payment',
      title: 'Phương thức thanh toán',
      description: 'Quản lý thẻ và ví',
      icon: 'card-outline',
      route: null,
    },
  ];

  const helpSupportItem = {
    id: 'help',
    title: 'Trợ giúp & Hỗ trợ',
    description: 'Liên hệ hoặc Câu hỏi thường gặp',
    icon: 'help-circle-outline',
    route: null,
  };

  const handleMenuPress = (route: string | null) => {
    if (route) {
      // If route is a tab (Home, Menu, Order, Profile), navigate to MainTabs
      if (
        route === MainRoutes.Home ||
        route === MainRoutes.Menu ||
        route === MainRoutes.Order ||
        route === MainRoutes.Profile
      ) {
        (navigation as any).navigate('MainTabs', {
          screen: route,
        });
      } else {
        // Otherwise, navigate directly (for stack screens)
        (navigation as any).navigate(route);
      }
    } else {
      // TODO: Implement navigation for these routes
      Alert.alert('Thông báo', 'Tính năng này đang được phát triển');
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) {
      return 'U';
    }
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          activeOpacity={0.7}
          onPress={() => {
            // Settings screen not implemented yet
            Alert.alert('Thông báo', 'Tính năng này đang được phát triển');
          }}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Profile Information Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user?.name ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getUserInitials(user.name)}
                  </Text>
                </View>
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={40} color="#EA580C" />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {user?.name || 'Người dùng'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.7}
              onPress={() => {
                // TODO: Navigate to edit profile
                console.log('Edit profile');
              }}>
              <Text style={styles.editButtonText}>Chỉnh sửa</Text>
            </TouchableOpacity>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{ordersCount}</Text>
              <Text style={styles.statLabel}>Đơn hàng</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Yêu thích</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Voucher</Text>
            </View>
          </View>
        </View>

        {/* Menu List Card */}
        <View style={styles.menuCard}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item.route)}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={24} color="#000" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Help & Support Card */}
        <View style={styles.helpCard}>
          <TouchableOpacity
            style={styles.helpItem}
            activeOpacity={0.7}
            onPress={() => handleMenuPress(helpSupportItem.route)}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons
                  name={helpSupportItem.icon as any}
                  size={24}
                  color="#000"
                />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemTitle}>
                  {helpSupportItem.title}
                </Text>
                <Text style={styles.menuItemDescription}>
                  {helpSupportItem.description}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  settingsButton: {
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EA580C',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EA580C',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  editButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  helpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default UserScreen;
