import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../api/apiClient';
import { Ionicons } from '@expo/vector-icons';

const DashboardScreen = () => {
  const {
    data: statsData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
  });

  const stats = statsData?.data;

  const StatCard = ({
    icon,
    title,
    value,
    color,
    subtitle,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value: string | number;
    color: string;
    subtitle?: string;
  }) => {
    const iconColor = color === 'blue' ? '#3B82F6' : color === 'green' ? '#10B981' : color === 'orange' ? '#F59E0B' : '#EF4444';
    const bgColor = color === 'blue' ? 'bg-blue-100' : color === 'green' ? 'bg-green-100' : color === 'orange' ? 'bg-orange-100' : 'bg-red-100';
    
    return (
      <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <View className="flex-row items-center justify-between mb-2">
          <View className={`${bgColor} rounded-lg p-2`}>
            <Ionicons name={icon} size={24} color={iconColor} />
          </View>
          {subtitle && (
            <Text className="text-xs text-gray-500 font-medium">{subtitle}</Text>
          )}
        </View>
        <Text className="text-2xl font-bold text-gray-800 mt-1">{value}</Text>
        <Text className="text-sm text-gray-600 mt-1">{title}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Đang tải dữ liệu...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text className="text-red-500 text-lg font-semibold mt-4 text-center">
          Có lỗi xảy ra khi tải dữ liệu
        </Text>
        <TouchableOpacity
          className="bg-blue-500 rounded-lg px-6 py-3 mt-4"
          onPress={() => refetch()}
        >
          <Text className="text-white font-semibold">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 mt-8"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
    >
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-800">Tổng quan</Text>
          <Text className="text-gray-600 mt-1">Thống kê hệ thống</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap -mx-2 mb-4">
          <View className="w-1/2 px-2 mb-4">
            <StatCard
              icon="people"
              title="Tổng người dùng"
              value={stats?.overview?.totalUsers || 0}
              color="blue"
            />
          </View>
          <View className="w-1/2 px-2 mb-4">
            <StatCard
              icon="cart"
              title="Tổng đơn hàng"
              value={stats?.overview?.totalOrders || 0}
              color="green"
            />
          </View>
          <View className="w-1/2 px-2 mb-4">
            <StatCard
              icon="cube"
              title="Sản phẩm"
              value={stats?.overview?.totalProducts || 0}
              color="orange"
            />
          </View>
          <View className="w-1/2 px-2 mb-4">
            <StatCard
              icon="car"
              title="Tài xế"
              value={stats?.overview?.totalDrivers || 0}
              color="blue"
            />
          </View>
        </View>

        {/* Revenue Section */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">Doanh thu</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Tổng doanh thu</Text>
              <Text className="text-xl font-bold text-green-600">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(stats?.revenue?.total || 0)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">30 ngày qua</Text>
              <Text className="text-lg font-semibold text-gray-800">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(stats?.revenue?.last30Days || 0)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Hôm nay</Text>
              <Text className="text-lg font-semibold text-gray-800">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(stats?.revenue?.today || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Orders Status */}
        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-4">Trạng thái đơn hàng</Text>
          <View className="space-y-2">
            {stats?.ordersByStatus &&
              Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <View key={status} className="flex-row justify-between items-center py-2">
                  <Text className="text-gray-600 capitalize">{status}</Text>
                  <View className="bg-blue-100 rounded-full px-3 py-1">
                    <Text className="text-blue-700 font-semibold">{count as number}</Text>
                  </View>
                </View>
              ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row flex-wrap -mx-2">
          <View className="w-1/2 px-2 mb-4">
            <View className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <Text className="text-yellow-800 font-semibold mb-1">Đơn chờ xử lý</Text>
              <Text className="text-2xl font-bold text-yellow-700">
                {stats?.overview?.pendingOrders || 0}
              </Text>
            </View>
          </View>
          <View className="w-1/2 px-2 mb-4">
            <View className="bg-green-50 rounded-xl p-4 border border-green-200">
              <Text className="text-green-800 font-semibold mb-1">Đơn hôm nay</Text>
              <Text className="text-2xl font-bold text-green-700">
                {stats?.overview?.ordersToday || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default DashboardScreen;

