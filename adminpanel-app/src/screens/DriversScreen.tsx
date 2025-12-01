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
import { fetchDrivers, deleteDriver } from '../api/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const DriversScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnline, setFilterOnline] = useState<boolean | null>(null);

  const {
    data: driversData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['drivers', filterOnline],
    queryFn: () => fetchDrivers({ isOnline: filterOnline !== null ? filterOnline.toString() : undefined }),
  });

  const deleteDriverMutation = useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      Alert.alert('Thành công', 'Tài xế đã được xóa');
    },
    onError: (error: any) => {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể xóa tài xế');
    },
  });

  const drivers = driversData?.data || [];
  const filteredDrivers = drivers.filter((driver: any) =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone.includes(searchQuery)
  );

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
            <Text className="text-2xl font-bold text-gray-900">Danh sách tài xế </Text>
            <Text className="text-sm text-gray-500 mt-1">
              {filteredDrivers.length} tài xế
            </Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center bg-blue-500 rounded-xl px-4 py-2.5"
            onPress={() => (navigation as any).navigate('AddDriver')}
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
            placeholder="Tìm kiếm tài xế..."
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
              filterOnline === null ? 'bg-blue-500' : 'bg-white border border-gray-300'
            }`}
            onPress={() => setFilterOnline(null)}
            style={
              filterOnline === null
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
                filterOnline === null ? 'text-white' : 'text-gray-700'
              }`}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-5 py-2.5 rounded-full mr-3 ${
              filterOnline === true ? 'bg-green-500' : 'bg-white border border-gray-300'
            }`}
            onPress={() => setFilterOnline(true)}
            style={
              filterOnline === true
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
                filterOnline === true ? 'text-white' : 'text-gray-700'
              }`}
            >
              Đang online
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-5 py-2.5 rounded-full mr-3 ${
              filterOnline === false ? 'bg-gray-500' : 'bg-white border border-gray-300'
            }`}
            onPress={() => setFilterOnline(false)}
            style={
              filterOnline === false
                ? {
                    shadowColor: '#6B7280',
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
                filterOnline === false ? 'text-white' : 'text-gray-700'
              }`}
            >
              Offline
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Drivers List */}
      {filteredDrivers.length === 0 ? (
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
            <Ionicons name="car-outline" size={64} color="#9CA3AF" />
          </View>
          <Text className="text-gray-700 text-center mt-2 text-xl font-bold">
            {searchQuery ? 'Không tìm thấy tài xế' : 'Chưa có tài xế nào'}
          </Text>
          <Text className="text-gray-500 text-center mt-2 text-sm">
            {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Tài xế sẽ hiển thị ở đây'}
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
            {filteredDrivers.map((driver: any) => (
              <View
                key={driver.id}
                className="bg-white rounded-2xl p-4 mb-4 border border-gray-100"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-lg font-bold text-gray-900">
                        {driver.name}
                      </Text>
                      <View
                        className={`ml-2 px-2.5 py-1 rounded-lg border ${
                          driver.isOnline 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            driver.isOnline ? 'text-green-700' : 'text-gray-600'
                          }`}
                        >
                          {driver.isOnline ? 'Online' : 'Offline'}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center bg-gray-50 px-2.5 py-1 rounded-lg mb-1.5">
                      <Ionicons name="call-outline" size={14} color="#6B7280" />
                      <Text className="text-gray-700 text-sm font-medium ml-1.5">{driver.phone}</Text>
                    </View>
                    {driver.orders && driver.orders.length > 0 && (
                      <View className="flex-row items-center bg-blue-50 px-2.5 py-1 rounded-lg self-start">
                        <Ionicons name="cube-outline" size={14} color="#3B82F6" />
                        <Text className="text-blue-700 text-sm font-medium ml-1.5">
                          {driver.orders.length} đơn hàng
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-col justify-between ml-3">
                    <TouchableOpacity
                      className="bg-blue-50 rounded-xl p-2.5 mb-2 border border-blue-200"
                      onPress={() => (navigation as any).navigate('EditDriver', { driverId: driver.id })}
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
                          'Bạn có chắc muốn xóa tài xế này?',
                          [
                            { text: 'Hủy', style: 'cancel' },
                            {
                              text: 'Xóa',
                              style: 'destructive',
                              onPress: () => deleteDriverMutation.mutate(driver.id),
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
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

export default DriversScreen;

