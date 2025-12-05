import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

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
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-900">Tài khoản</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Profile Info */}
        <View className="bg-white mx-4 my-4 rounded-xl p-6">
          <View className="items-center mb-4">
            <View className="bg-blue-500 rounded-full p-6 mb-3">
              <Ionicons name="person" size={40} color="white" />
            </View>
            <Text className="text-xl font-bold text-gray-900">{user?.name}</Text>
            <Text className="text-gray-600 mt-1">{user?.email}</Text>
            {user?.phone && (
              <Text className="text-gray-600 mt-1">{user.phone}</Text>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View className="bg-white mx-4 my-2 rounded-xl">
          <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
            <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
            <Text className="text-gray-900 ml-3 flex-1">Thông tin tài khoản</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
            <Text className="text-gray-900 ml-3 flex-1">Cài đặt</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center px-4 py-4">
            <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
            <Text className="text-gray-900 ml-3 flex-1">Trợ giúp</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          className="bg-red-500 mx-4 my-4 rounded-xl py-4"
          onPress={handleLogout}
        >
          <Text className="text-white font-semibold text-center text-lg">Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
