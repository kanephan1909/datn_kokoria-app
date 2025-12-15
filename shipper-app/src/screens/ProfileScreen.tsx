import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchMyDriverRatings, Rating } from '../api/apiClient';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  // Fetch driver ratings (tự động lấy từ driver hiện tại)
  const { data: ratingsData, isLoading: isLoadingRatings } = useQuery({
    queryKey: ['myDriverRatings'],
    queryFn: () => fetchMyDriverRatings({ page: 1, limit: 10 }),
    enabled: !!user?.id && user?.role === 'DRIVER',
  });

  const averageRating = ratingsData?.averageRating || 0;
  const ratings = ratingsData?.ratings || [];
  const totalRatings = ratingsData?.pagination?.total || 0;

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: '#F0F9FF' }}>
      {/* Header với gradient */}
      <View 
        className="px-5 pt-12 pb-8"
        style={{
          backgroundColor: '#3B82F6',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <Text className="text-2xl font-bold text-white mb-6">Tài khoản</Text>
        
        {/* Profile Card trong header */}
        <View 
          className="bg-white rounded-2xl p-6"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View className="items-center">
            <View 
              className="bg-blue-500 rounded-full p-5 mb-4"
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Ionicons name="person" size={48} color="white" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">{user?.name}</Text>
            
            {/* Rating Display */}
            {!isLoadingRatings && totalRatings > 0 && (
              <View className="flex-row items-center justify-center mb-3 mt-2">
                <View className="flex-row items-center bg-yellow-50 px-4 py-2 rounded-full">
                  <Ionicons name="star" size={20} color="#F59E0B" />
                  <Text className="text-yellow-800 font-bold text-lg ml-1">
                    {averageRating.toFixed(1)}
                  </Text>
                  <Text className="text-yellow-600 text-sm ml-1">
                    ({totalRatings} {totalRatings === 1 ? 'đánh giá' : 'đánh giá'})
                  </Text>
                </View>
              </View>
            )}
            
            <View className="flex-row items-center mb-2">
              <Ionicons name="mail" size={16} color="#6B7280" />
              <Text className="text-gray-600 ml-2 text-base">{user?.email}</Text>
            </View>
            {user?.phone && (
              <View className="flex-row items-center">
                <Ionicons name="call" size={16} color="#6B7280" />
                <Text className="text-gray-600 ml-2 text-base">{user.phone}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Ratings Section */}
        {totalRatings > 0 && (
          <View className="bg-white mx-4 my-4 rounded-2xl p-5" style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Đánh giá từ khách hàng</Text>
              <View className="flex-row items-center">
                <Ionicons name="star" size={24} color="#F59E0B" />
                <Text className="text-gray-900 font-bold text-xl ml-1">
                  {averageRating.toFixed(1)}
                </Text>
              </View>
            </View>
            
            {isLoadingRatings ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <View>
                {ratings.slice(0, 5).map((rating: Rating) => (
                  <View 
                    key={rating.id} 
                    className="border-b border-gray-100 pb-3 mb-3"
                    style={{ borderBottomWidth: 1 }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center flex-1">
                        <Text className="text-gray-900 font-semibold text-base">
                          {rating.user?.name || 'Khách hàng'}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= rating.rating ? 'star' : 'star-outline'}
                            size={16}
                            color={star <= rating.rating ? '#F59E0B' : '#D1D5DB'}
                          />
                        ))}
                      </View>
                    </View>
                    {rating.comment && (
                      <Text className="text-gray-600 text-sm mt-1">
                        {rating.comment}
                      </Text>
                    )}
                    <Text className="text-gray-400 text-xs mt-2">
                      {new Date(rating.createdAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                ))}
                
                {totalRatings > 5 && (
                  <TouchableOpacity className="mt-2">
                    <Text className="text-blue-500 text-center font-semibold">
                      Xem thêm {totalRatings - 5} đánh giá
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
        
        {/* Menu Items */}
        <View className="bg-white mx-4 my-4 rounded-2xl" style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          borderWidth: 1,
          borderColor: '#E5E7EB',
        }}>
          <TouchableOpacity 
            className="flex-row items-center px-5 py-4 border-b border-gray-100"
            style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
          >
            <View className="bg-blue-100 rounded-xl p-3 mr-4">
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
            </View>
            <Text className="text-gray-900 flex-1 font-semibold text-base">Thông tin tài khoản</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-row items-center px-5 py-4 border-b border-gray-100"
            style={{ borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}
          >
            <View className="bg-gray-100 rounded-xl p-3 mr-4">
              <Ionicons name="settings" size={24} color="#6B7280" />
            </View>
            <Text className="text-gray-900 flex-1 font-semibold text-base">Cài đặt</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center px-5 py-4">
            <View className="bg-yellow-100 rounded-xl p-3 mr-4">
              <Ionicons name="help-circle" size={24} color="#F59E0B" />
            </View>
            <Text className="text-gray-900 flex-1 font-semibold text-base">Trợ giúp</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-red-500 mx-4 my-2 rounded-2xl py-5"
          style={{
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          onPress={handleLogout}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="log-out" size={24} color="white" />
            <Text className="text-white font-bold text-center text-lg ml-2">Đăng xuất</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
