import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import Ionicons from '@react-native-vector-icons/ionicons';
import {MainRoutes} from '../navigation/Routes';
import {useNavigation} from '@react-navigation/native';

const UserScreen = () => {
  const {user, logout} = useAuth();
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  };

  const menuItems = [
    {
      id: 'orders',
      title: 'Đơn hàng của tôi',
      icon: 'receipt-outline',
      color: '#F97316',
      route: MainRoutes.OrderHistory,
    },
    {
      id: 'addresses',
      title: 'Địa chỉ giao hàng',
      icon: 'location-outline',
      color: '#3B82F6',
      route: MainRoutes.AddressList,
    },
    {
      id: 'notifications',
      title: 'Thông báo',
      icon: 'notifications-outline',
      color: '#EF4444',
      route: MainRoutes.Notifications,
    },
    {
      id: 'settings',
      title: 'Cài đặt',
      icon: 'settings-outline',
      color: '#6B7280',
      route: MainRoutes.Settings,
    },
  ];

  const handleMenuPress = (route: string) => {
    (navigation as any).navigate(route);
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-orange-500 pb-6 pt-4">
          <View className="px-4">
            <Text className="text-white text-2xl font-bold mb-6">Tài khoản</Text>

            {/* User Info Card */}
            <View className="bg-white rounded-2xl p-4 flex-row items-center shadow-md">
              <View className="w-16 h-16 rounded-full bg-orange-100 items-center justify-center mr-4">
                <Ionicons name="person" size={32} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 text-lg font-bold">
                  {user?.name || 'Người dùng'}
                </Text>
                <Text className="text-gray-500 text-sm mt-1">{user?.email || ''}</Text>
                {user?.phone && (
                  <Text className="text-gray-500 text-sm">{user.phone}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  // TODO: Navigate to edit profile
                  console.log('Edit profile');
                }}>
                <Ionicons name="create-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-4 mt-4">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item.route)}
              className="bg-white rounded-xl p-4 mb-3 flex-row items-center shadow-sm">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{backgroundColor: `${item.color}20`}}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text className="text-gray-800 text-base flex-1">{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View className="px-4 mt-4 mb-6">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleLogout}
            className="bg-red-50 rounded-xl p-4 flex-row items-center justify-center border border-red-200">
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text className="text-red-600 text-base font-semibold ml-2">
              Đăng xuất
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserScreen;
