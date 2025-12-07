import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '../api/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ORDER_STATUSES = [
  { value: null, label: 'Tất cả', color: '#6B7280' },
  { value: 'PENDING', label: 'Chờ xác nhận', color: '#F59E0B' },
  { value: 'CONFIRMED', label: 'Đã xác nhận', color: '#3B82F6' },
  { value: 'PREPARING', label: 'Đang chuẩn bị', color: '#8B5CF6' },
  { value: 'READY_FOR_PICKUP', label: 'Sẵn sàng lấy', color: '#6366F1' },
  { value: 'PICKED_UP', label: 'Đã lấy', color: '#EC4899' },
  { value: 'DELIVERING', label: 'Đang giao', color: '#06B6D4' },
  { value: 'COMPLETED', label: 'Hoàn thành', color: '#10B981' },
  { value: 'CANCELED', label: 'Đã hủy', color: '#EF4444' },
];

const OrdersScreen = () => {
  const navigation = useNavigation();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['orders', selectedStatus],
    queryFn: () => fetchOrders({ page: 1, limit: 20, status: selectedStatus || undefined }),
  });

  const orders = ordersData?.data || [];
  const filteredOrders = orders.filter((order: any) =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      PREPARING: 'Đang chuẩn bị',
      READY_FOR_PICKUP: 'Sẵn sàng lấy',
      PICKED_UP: 'Đã lấy',
      DELIVERING: 'Đang giao',
      COMPLETED: 'Hoàn thành',
      CANCELED: 'Đã hủy',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      PENDING: '#F59E0B',
      CONFIRMED: '#3B82F6',
      PREPARING: '#8B5CF6',
      READY_FOR_PICKUP: '#6366F1',
      PICKED_UP: '#EC4899',
      DELIVERING: '#06B6D4',
      COMPLETED: '#10B981',
      CANCELED: '#EF4444',
    };
    return colorMap[status] || '#6B7280';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getOrderImage = (order: any) => {
    if (order.items && order.items.length > 0 && order.items[0].product?.imageUrl) {
      return order.items[0].product.imageUrl;
    }
    return null;
  };

  const getOrderName = (order: any) => {
    if (order.items && order.items.length > 0) {
      return order.items[0].product?.name || 'Order';
    }
    return 'Order';
  };

  const getDeliveryAddress = (order: any) => {
    if (order.address) {
      return `${order.address.address || ''}, ${order.address.ward || ''}`.trim();
    }
    return '123 Tokyo Lane';
  };

  const getRestaurantName = (order: any) => {
    return order.restaurant?.name || 'Kokoria';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA580C" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Có lỗi xảy ra khi tải đơn hàng</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.searchButton}
            activeOpacity={0.7}
            onPress={() => setShowSearch(!showSearch)}>
            <Ionicons name="search" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedStatus && styles.filterButtonActive]}
            activeOpacity={0.7}
            onPress={() => setShowFilter(!showFilter)}>
            <Ionicons name="filter" size={24} color={selectedStatus ? '#FFFFFF' : '#000'} />
            {selectedStatus && <View style={styles.filterBadge} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo ID đơn hàng hoặc tên khách hàng..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterChipsContainer}
        contentContainerStyle={styles.filterChipsContent}>
        {ORDER_STATUSES.map((status) => (
          <TouchableOpacity
            key={status.value || 'all'}
            style={[
              styles.filterChip,
              selectedStatus === status.value && styles.filterChipActive,
              selectedStatus === status.value && { backgroundColor: status.color },
            ]}
            onPress={() => setSelectedStatus(status.value)}>
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === status.value && styles.filterChipTextActive,
              ]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilter(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lọc đơn hàng</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalSectionTitle}>Trạng thái đơn hàng</Text>
              {ORDER_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status.value || 'all'}
                  style={styles.modalOption}
                  onPress={() => {
                    setSelectedStatus(status.value);
                    setShowFilter(false);
                  }}>
                  <View style={styles.modalOptionLeft}>
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: status.color },
                      ]}
                    />
                    <Text style={styles.modalOptionText}>{status.label}</Text>
                  </View>
                  {selectedStatus === status.value && (
                    <Ionicons name="checkmark" size={20} color="#EA580C" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalResetButton}
                onPress={() => {
                  setSelectedStatus(null);
                  setShowFilter(false);
                }}>
                <Text style={styles.modalResetText}>Đặt lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ordered Items Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Đơn hàng đã đặt
            {selectedStatus && (
              <Text style={styles.filterCount}>
                {' '}
                ({filteredOrders.length} đơn)
              </Text>
            )}
          </Text>
        </View>

        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy đơn hàng' : 'Chưa có đơn hàng nào'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Đơn hàng sẽ hiển thị ở đây'}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }>
            {filteredOrders.map((order: any) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() =>
                  (navigation as any).navigate('OrderDetail', { orderId: order.id })
                }>
                <View style={styles.orderImageContainer}>
                  {getOrderImage(order) ? (
                    <Image
                      source={{ uri: getOrderImage(order) }}
                      style={styles.orderImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderImage}>
                      <Ionicons name="restaurant" size={24} color="#9CA3AF" />
                    </View>
                  )}
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderName} numberOfLines={1}>
                    {getOrderName(order)}
                  </Text>
                  <Text style={styles.orderDetail}>
                    Delivery · {getDeliveryAddress(order)}
                  </Text>
                  <Text style={styles.orderDetail}>From {getRestaurantName(order)}</Text>
                  <View style={styles.orderFooter}>
                    <Text
                      style={[
                        styles.orderStatus,
                        { color: getStatusColor(order.status) },
                      ]}>
                      {getStatusText(order.status)}
                    </Text>
                    <TouchableOpacity
                      style={styles.trackButton}
                      activeOpacity={0.7}
                      onPress={() =>
                        (navigation as any).navigate('OrderDetail', { orderId: order.id })
                      }>
                      <Text style={styles.trackButtonText}>Chi tiết</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
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
    flex: 1,
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
    marginRight: 8,
  },
  section: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
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
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    marginRight: 12,
  },
  orderImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  orderDetail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  trackButton: {
    backgroundColor: '#EA580C',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  filterChipsContainer: {
    maxHeight: 40,
    marginBottom: 12,
  },
  filterChipsContent: {
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterCount: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  modalBody: {
    padding: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalResetButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalResetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});

export default OrdersScreen;
