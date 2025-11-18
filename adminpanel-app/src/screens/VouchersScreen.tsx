import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchVouchers, deleteVoucher } from '../api/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const VouchersScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExpired, setFilterExpired] = useState<string | null>(null);

  const {
    data: vouchersData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['vouchers', filterExpired],
    queryFn: () => fetchVouchers({ expired: filterExpired || undefined }),
  });

  const deleteVoucherMutation = useMutation({
    mutationFn: deleteVoucher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      Alert.alert('Thành công', 'Voucher đã được xóa');
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể xóa voucher');
    },
  });

  const vouchers = vouchersData?.data || [];
  const filteredVouchers = vouchers.filter((voucher: any) =>
    voucher.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const isExpired = (expiry: string) => {
    return new Date(expiry) < new Date();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-4 pt-4 pb-4 border-b border-gray-200"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-gray-900">Vouchers</Text>
            <Text className="text-sm text-gray-500 mt-1">
              {filteredVouchers.length} vouchers
            </Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center bg-blue-500 rounded-xl px-4 py-2.5"
            onPress={() => (navigation as any).navigate('AddVoucher')}
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text className="text-white font-semibold ml-1.5 text-sm">Thêm</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View 
          className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 mb-3 border border-gray-200"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-800"
            placeholder="Tìm kiếm voucher..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1">
          <TouchableOpacity
            className={`px-5 py-2.5 rounded-full mr-3 ${
              filterExpired === null ? 'bg-blue-500' : 'bg-white border border-gray-300'
            }`}
            onPress={() => setFilterExpired(null)}
            style={
              filterExpired === null
                ? {
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    elevation: 3,
                  }
                : {}
            }
          >
            <Text
              className={`font-semibold text-sm ${
                filterExpired === null ? 'text-white' : 'text-gray-700'
              }`}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-5 py-2.5 rounded-full mr-3 ${
              filterExpired === 'false' ? 'bg-green-500' : 'bg-white border border-gray-300'
            }`}
            onPress={() => setFilterExpired('false')}
            style={
              filterExpired === 'false'
                ? {
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    elevation: 3,
                  }
                : {}
            }
          >
            <Text
              className={`font-semibold text-sm ${
                filterExpired === 'false' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Còn hiệu lực
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-5 py-2.5 rounded-full mr-3 ${
              filterExpired === 'true' ? 'bg-red-500' : 'bg-white border border-gray-300'
            }`}
            onPress={() => setFilterExpired('true')}
            style={
              filterExpired === 'true'
                ? {
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                    elevation: 3,
                  }
                : {}
            }
          >
            <Text
              className={`font-semibold text-sm ${
                filterExpired === 'true' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Hết hạn
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Vouchers List */}
      {filteredVouchers.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <View 
            className="bg-gray-100 rounded-full p-6 mb-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="ticket-outline" size={64} color="#9CA3AF" />
          </View>
          <Text className="text-gray-700 text-center mt-2 text-xl font-bold">
            {searchQuery ? 'Không tìm thấy voucher' : 'Chưa có voucher nào'}
          </Text>
          <Text className="text-gray-500 text-center mt-2 text-sm">
            {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Voucher sẽ hiển thị ở đây'}
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          <View className="p-4">
            {filteredVouchers.map((voucher: any) => {
              const expired = isExpired(voucher.expiry);
              return (
                <View
                  key={voucher.id}
                  className={`bg-white rounded-2xl p-4 mb-4 border ${
                    expired ? 'border-red-200 bg-red-50' : 'border-gray-100'
                  }`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Text className={`text-xl font-bold ${expired ? 'text-gray-500' : 'text-gray-900'}`}>
                          {voucher.code}
                        </Text>
                        {expired && (
                          <View className="ml-2 px-2.5 py-1 rounded-lg bg-red-100 border border-red-200">
                            <Text className="text-xs font-bold text-red-700">Hết hạn</Text>
                          </View>
                        )}
                      </View>
                      <Text className={`text-3xl font-bold ${expired ? 'text-gray-400' : 'text-blue-600'} mb-2`}>
                        Giảm {voucher.discount}%
                      </Text>
                    </View>
                    <View className="flex-col justify-between ml-3">
                      <TouchableOpacity
                        className="bg-blue-50 rounded-xl p-2.5 mb-2 border border-blue-200"
                        onPress={() => (navigation as any).navigate('EditVoucher', { voucherId: voucher.id })}
                        style={{
                          shadowColor: '#3B82F6',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 2,
                        }}
                      >
                        <Ionicons name="pencil" size={18} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-red-50 rounded-xl p-2.5 border border-red-200"
                        onPress={() => {
                          Alert.alert(
                            'Xác nhận',
                            'Bạn có chắc muốn xóa voucher này?',
                            [
                              { text: 'Hủy', style: 'cancel' },
                              {
                                text: 'Xóa',
                                style: 'destructive',
                                onPress: () => deleteVoucherMutation.mutate(voucher.id),
                              },
                            ]
                          );
                        }}
                        style={{
                          shadowColor: '#EF4444',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.1,
                          shadowRadius: 2,
                          elevation: 2,
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="space-y-2 pt-3 border-t border-gray-200">
                    {voucher.minOrder && (
                      <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
                        <Ionicons name="cash-outline" size={16} color="#6B7280" />
                        <Text className="text-gray-700 text-sm font-medium ml-2">
                          Đơn tối thiểu: {formatCurrency(voucher.minOrder)}
                        </Text>
                      </View>
                    )}
                    {voucher.maxDeduct && (
                      <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
                        <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                        <Text className="text-gray-700 text-sm font-medium ml-2">
                          Giảm tối đa: {formatCurrency(voucher.maxDeduct)}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-lg">
                      <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                      <Text className="text-gray-700 text-sm font-medium ml-2">
                        Hết hạn: {new Date(voucher.expiry).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default VouchersScreen;

