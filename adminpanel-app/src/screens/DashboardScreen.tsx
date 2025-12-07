import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../api/apiClient';
import { Ionicons } from '@expo/vector-icons';

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingTop: 30
  },
  header: {
    marginBottom: 14,
  },
  subtitle: {
    marginTop: 4,
  },
  statsGrid: {
    marginBottom: 16,
    marginHorizontal: -6,
  },
  statItem: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  statCard: {
    minHeight: 110,
  },
  statValue: {
    fontSize: 24,
    lineHeight: 28,
  },
  statTitle: {
    fontSize: 13,
    marginTop: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  revenueCard: {
    flex: 1.2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  revenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickStats: {
    flex: 1,
    marginLeft: 12,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    maxHeight: 220,
  },
  statusScroll: {
    maxHeight: 200,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
});

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

  // Hàm dịch trạng thái đơn hàng sang tiếng Việt
  const getStatusLabel = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      PENDING: 'Đang chờ',
      CONFIRMED: 'Đã xác nhận',
      PREPARING: 'Đang chuẩn bị',
      READY_FOR_PICKUP: 'Sẵn sàng lấy hàng',
      PICKED_UP: 'Đã lấy hàng',
      DELIVERING: 'Đang giao hàng',
      COMPLETED: 'Hoàn thành',
      CANCELED: 'Đã hủy',
      CANCELLED: 'Đã hủy',
    };
    return statusMap[status.toUpperCase()] || status;
  };

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
      <View className="bg-white rounded-lg p-3 shadow-sm border border-gray-100" style={styles.statCard}>
        <View className="flex-row items-center justify-between mb-1">
          <View className={`${bgColor} rounded-lg p-1.5`}>
            <Ionicons name={icon} size={18} color={iconColor} />
          </View>
          {subtitle && (
            <Text className="text-xs text-gray-500 font-medium">{subtitle}</Text>
          )}
        </View>
        <Text className="text-xl font-bold text-gray-800" style={styles.statValue}>{value}</Text>
        <Text className="text-xs text-gray-600" style={styles.statTitle}>{title}</Text>
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
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text className="text-2xl font-bold text-gray-800">Tổng quan</Text>
          <Text className="text-sm text-gray-600" style={styles.subtitle}>Thống kê hệ thống</Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap" style={styles.statsGrid}>
          <View style={styles.statItem}>
            <StatCard
              icon="people"
              title="Tổng người dùng"
              value={stats?.overview?.totalUsers || 0}
              color="blue"
            />
          </View>
          <View style={styles.statItem}>
            <StatCard
              icon="cart"
              title="Tổng đơn hàng"
              value={stats?.overview?.totalOrders || 0}
              color="green"
            />
          </View>
          <View style={styles.statItem}>
            <StatCard
              icon="cube"
              title="Sản phẩm"
              value={stats?.overview?.totalProducts || 0}
              color="orange"
            />
          </View>
          <View style={styles.statItem}>
            <StatCard
              icon="car"
              title="Tài xế"
              value={stats?.overview?.totalDrivers || 0}
              color="blue"
            />
          </View>
        </View>

        {/* Revenue and Quick Stats Row */}
        <View style={styles.bottomRow}>
          {/* Revenue Section */}
          <View style={styles.revenueCard}>
            <Text className="text-base font-bold text-gray-800 mb-3">Doanh thu</Text>
            <View style={styles.revenueItem}>
              <Text className="text-sm text-gray-600">Tổng</Text>
              <Text className="text-base font-bold text-green-600" numberOfLines={1}>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  notation: 'compact',
                }).format(stats?.revenue?.total || 0)}
              </Text>
            </View>
            <View style={styles.revenueItem}>
              <Text className="text-sm text-gray-600">30 ngày</Text>
              <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  notation: 'compact',
                }).format(stats?.revenue?.last30Days || 0)}
              </Text>
            </View>
            <View style={styles.revenueItem}>
              <Text className="text-sm text-gray-600">Hôm nay</Text>
              <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  notation: 'compact',
                }).format(stats?.revenue?.today || 0)}
              </Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatCard}>
              <Text className="text-sm text-yellow-800 font-semibold mb-1">Đơn chờ xử lý</Text>
              <Text className="text-2xl font-bold text-yellow-700">
                {stats?.overview?.pendingOrders || 0}
              </Text>
            </View>
            <View style={[styles.quickStatCard, { marginBottom: 0 }]}>
              <Text className="text-sm text-green-800 font-semibold mb-1">Đơn hôm nay</Text>
              <Text className="text-2xl font-bold text-green-700">
                {stats?.overview?.ordersToday || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Orders Status - Compact */}
        <View style={styles.statusCard}>
          <Text className="text-base font-bold text-gray-800 mb-3">Trạng thái đơn hàng</Text>
          <ScrollView 
            nestedScrollEnabled 
            style={styles.statusScroll}
            showsVerticalScrollIndicator={false}
          >
            {stats?.ordersByStatus &&
              Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <View key={status} style={styles.statusRow}>
                  <Text className="text-sm text-gray-600" numberOfLines={1}>{getStatusLabel(status)}</Text>
                  <View className="bg-blue-100 rounded-full px-3 py-1">
                    <Text className="text-sm text-blue-700 font-semibold">{count as number}</Text>
                  </View>
                </View>
              ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;

